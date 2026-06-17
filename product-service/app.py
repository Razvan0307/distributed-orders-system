"""
product-service
================
Microserviciu responsabil cu gestionarea catalogului de produse si a stocului.
Baza de date este simulata printr-un dictionar in memorie (suficient pentru
demonstratie academica; intr-un sistem real ar fi inlocuita cu PostgreSQL,
MongoDB etc., posibil cu propria instanta per microserviciu - pattern-ul
"Database per Service").
"""

from flask import Flask, jsonify, request
import os

app = Flask(__name__)

# ---------------------------------------------------------------------------
# "Baza de date" simulata - dictionar in memorie
# ---------------------------------------------------------------------------
products = {}
next_id = 1


def seed_data():
    """Populeaza catalogul cu cateva produse implicite, pentru a putea testa
    sistemul imediat dupa pornire, fara pasi suplimentari."""
    global next_id
    initial = [
        {"name": "Laptop Dell XPS 13", "price": 4500.0, "stock": 10},
        {"name": "Mouse Logitech MX Master 3", "price": 250.0, "stock": 25},
        {"name": "Monitor LG UltraWide 34 inch", "price": 1800.0, "stock": 8},
        {"name": "Tastatura mecanica Keychron K8", "price": 450.0, "stock": 15},
    ]
    for item in initial:
        products[next_id] = {
            "id": next_id,
            "name": item["name"],
            "price": item["price"],
            "stock": item["stock"],
        }
        next_id += 1


seed_data()


# ---------------------------------------------------------------------------
# Health check - folosit de Kubernetes pentru readiness/liveness probes
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "UP", "service": "product-service"}), 200


# ---------------------------------------------------------------------------
# GET /products - listeaza toate produsele
# ---------------------------------------------------------------------------
@app.route("/products", methods=["GET"])
def get_products():
    return jsonify(list(products.values())), 200


# ---------------------------------------------------------------------------
# GET /products/<id> - returneaza un singur produs
# ---------------------------------------------------------------------------
@app.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = products.get(product_id)
    if not product:
        return jsonify({"error": "Produsul nu a fost gasit"}), 404
    return jsonify(product), 200


# ---------------------------------------------------------------------------
# POST /products - adauga un produs nou cu stoc initial
# Body JSON: { "name": str, "price": float, "stock": int }
# ---------------------------------------------------------------------------
@app.route("/products", methods=["POST"])
def add_product():
    global next_id
    data = request.get_json(silent=True)

    if not data or "name" not in data or "price" not in data or "stock" not in data:
        return jsonify({"error": "Campuri obligatorii: name, price, stock"}), 400

    try:
        price = float(data["price"])
        stock = int(data["stock"])
    except (TypeError, ValueError):
        return jsonify({"error": "price trebuie sa fie numeric, stock trebuie sa fie intreg"}), 400

    product = {
        "id": next_id,
        "name": str(data["name"]),
        "price": price,
        "stock": stock,
    }
    products[next_id] = product
    next_id += 1

    return jsonify(product), 201


# ---------------------------------------------------------------------------
# POST /products/<id>/reduce-stock - endpoint INTERN, apelat de order-service
# atunci cand se confirma o comanda. Body JSON: { "quantity": int }
# ---------------------------------------------------------------------------
@app.route("/products/<int:product_id>/reduce-stock", methods=["POST"])
def reduce_stock(product_id):
    data = request.get_json(silent=True)
    if not data or "quantity" not in data:
        return jsonify({"error": "Campul quantity este obligatoriu"}), 400

    product = products.get(product_id)
    if not product:
        return jsonify({"error": "Produsul nu a fost gasit"}), 404

    try:
        quantity = int(data["quantity"])
    except (TypeError, ValueError):
        return jsonify({"error": "quantity trebuie sa fie un numar intreg"}), 400

    if quantity <= 0:
        return jsonify({"error": "quantity trebuie sa fie pozitiv"}), 400

    if product["stock"] < quantity:
        return jsonify({
            "error": "Stoc insuficient",
            "available": product["stock"],
            "requested": quantity,
        }), 409

    product["stock"] -= quantity
    return jsonify(product), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
