"""
order-service
==============
Microserviciu responsabil cu primirea si stocarea comenzilor.

Acesta este punctul central de orchestrare a comunicarii intre microservicii:
    1. Verifica existenta produsului in product-service (HTTP GET)
    2. Cere reducerea stocului in product-service (HTTP POST)
    3. Salveaza comanda local (in memorie)
    4. Trimite un eveniment catre notification-service (HTTP POST, best-effort)

Adresele celorlalte servicii NU sunt hardcodate - sunt injectate prin
variabile de mediu (vezi k8s/configmap.yaml), pentru a respecta principiul
de loose coupling intre componente.
"""

from flask import Flask, jsonify, request
import os
import requests
from datetime import datetime

app = Flask(__name__)

# ---------------------------------------------------------------------------
# "Baza de date" simulata - dictionar in memorie
# ---------------------------------------------------------------------------
orders = {}
next_id = 1

# ---------------------------------------------------------------------------
# URL-urile altor servicii, injectate din ConfigMap (vezi k8s/configmap.yaml)
# Valorile implicite (fallback) permit rularea locala (ex: docker-compose
# sau "python app.py" direct pe masina de dezvoltare) fara Kubernetes.
# ---------------------------------------------------------------------------
PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "http://localhost:5001")
NOTIFICATION_SERVICE_URL = os.environ.get("NOTIFICATION_SERVICE_URL", "http://localhost:5002")

REQUEST_TIMEOUT = 5  # secunde - evitam blocarea la infinit daca un serviciu nu raspunde


def notify(event, message):
    """Trimite o notificare catre notification-service.

    Esecul acestui apel NU trebuie sa blocheze fluxul principal de creare a
    comenzii - este un exemplu de comunicare "best-effort" / fault-tolerant:
    daca notification-service e indisponibil, comanda este in continuare
    valida, doar notificarea se pierde (sau ar putea fi pusa intr-o coada
    de retry, intr-o implementare mai avansata).
    """
    try:
        requests.post(
            f"{NOTIFICATION_SERVICE_URL}/notifications",
            json={"event": event, "message": message},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.exceptions.RequestException as exc:
        print(f"[WARN] Nu am putut trimite notificarea catre notification-service: {exc}", flush=True)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "UP", "service": "order-service"}), 200


# ---------------------------------------------------------------------------
# GET /orders - listeaza toate comenzile
# ---------------------------------------------------------------------------
@app.route("/orders", methods=["GET"])
def get_orders():
    return jsonify(list(orders.values())), 200


# ---------------------------------------------------------------------------
# GET /orders/<id> - returneaza o singura comanda
# ---------------------------------------------------------------------------
@app.route("/orders/<int:order_id>", methods=["GET"])
def get_order(order_id):
    order = orders.get(order_id)
    if not order:
        return jsonify({"error": "Comanda nu a fost gasita"}), 404
    return jsonify(order), 200


# ---------------------------------------------------------------------------
# POST /orders - creeaza o comanda noua
# Body JSON: { "product_id": int, "quantity": int, "customer_name": str }
#
# Acest endpoint demonstreaza comunicarea sincrona intre 3 microservicii:
# order-service -> product-service (verificare + reducere stoc)
# order-service -> notification-service (logare eveniment)
# ---------------------------------------------------------------------------
@app.route("/orders", methods=["POST"])
def create_order():
    global next_id
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Body JSON invalid sau lipsa"}), 400

    required_fields = ["product_id", "quantity", "customer_name"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Campuri obligatorii lipsa: {', '.join(missing)}"}), 400

    product_id = data["product_id"]
    quantity = data["quantity"]
    customer_name = data["customer_name"]

    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "quantity trebuie sa fie un numar intreg pozitiv"}), 400

    # -----------------------------------------------------------------
    # PAS 1: Verificam produsul in product-service
    # -----------------------------------------------------------------
    try:
        product_resp = requests.get(
            f"{PRODUCT_SERVICE_URL}/products/{product_id}",
            timeout=REQUEST_TIMEOUT,
        )
    except requests.exceptions.RequestException as exc:
        return jsonify({
            "error": "product-service este indisponibil",
            "details": str(exc),
        }), 503  # Service Unavailable

    if product_resp.status_code == 404:
        return jsonify({"error": "Produsul nu exista"}), 404
    if product_resp.status_code != 200:
        return jsonify({"error": "Eroare necunoscuta la verificarea produsului"}), 502

    product = product_resp.json()

    # -----------------------------------------------------------------
    # PAS 2: Cerem reducerea stocului in product-service
    # -----------------------------------------------------------------
    try:
        reduce_resp = requests.post(
            f"{PRODUCT_SERVICE_URL}/products/{product_id}/reduce-stock",
            json={"quantity": quantity},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.exceptions.RequestException as exc:
        return jsonify({
            "error": "product-service a devenit indisponibil la reducerea stocului",
            "details": str(exc),
        }), 503

    if reduce_resp.status_code == 409:
        return jsonify({
            "error": "Stoc insuficient pentru aceasta comanda",
            "details": reduce_resp.json(),
        }), 409
    if reduce_resp.status_code != 200:
        return jsonify({"error": "Eroare necunoscuta la reducerea stocului"}), 502

    # -----------------------------------------------------------------
    # PAS 3: Salvam comanda local
    # -----------------------------------------------------------------
    order = {
        "id": next_id,
        "product_id": product_id,
        "product_name": product["name"],
        "quantity": quantity,
        "customer_name": customer_name,
        "total_price": round(product["price"] * quantity, 2),
        "status": "CONFIRMED",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    orders[next_id] = order
    next_id += 1

    # -----------------------------------------------------------------
    # PAS 4: Notificam evenimentul (best-effort)
    # -----------------------------------------------------------------
    notify(
        event="ORDER_CREATED",
        message=(
            f"Comanda #{order['id']} creata de {customer_name} pentru "
            f"{quantity}x {product['name']} (total: {order['total_price']} RON)"
        ),
    )

    return jsonify(order), 201


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
