import os
import requests
from flask import Flask, jsonify, request, Response

app = Flask(__name__)

# URL-urile interne preluate din Kubernetes via ConfigMap
ORDER_SERVICE_URL = os.environ.get("ORDER_SERVICE_URL", "http://order-service:5000")
PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "http://product-service:5000")
NOTIFICATION_SERVICE_URL = os.environ.get("NOTIFICATION_SERVICE_URL", "http://notification-service:5000")

REQUEST_TIMEOUT = 5

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "UP", "service": "api-gateway"}), 200

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "api-gateway",
        "message": "Bine ai venit! Foloseste prefixul /api/<serviciu> pentru a contacta microserviciile."
    }), 200

def proxy(target_base, service_name, subpath):
    """Asambleaza corect URL-ul si forwardeaza cererea."""
    # Exemplu: target_base (http://product-service:5000) + / + service_name (products)
    target_url = f"{target_base}/{service_name}"
    
    # Daca exista un ID (ex: /api/products/1), il adaugam la final
    if subpath:
        target_url = f"{target_url}/{subpath}"

    try:
        resp = requests.request(
            method=request.method,
            url=target_url,
            params=request.args,
            json=request.get_json(silent=True) if request.is_json else None,
            headers={key: value for (key, value) in request.headers if key != 'Host'},
            allow_redirects=False,
            timeout=REQUEST_TIMEOUT,
        )
    except requests.exceptions.RequestException as exc:
        return jsonify({
            "error": "Serviciul tinta este indisponibil",
            "details": str(exc),
        }), 503

    # Curatam header-ele incompatibile de la nivel de server
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.headers.items() if name.lower() not in excluded_headers]

    return Response(
        resp.content,
        status=resp.status_code,
        headers=headers
    )

# Captam toate rutele care incep cu /api/
@app.route("/api/<service>", methods=["GET", "POST", "PUT", "DELETE"], strict_slashes=False)
@app.route("/api/<service>/<path:subpath>", methods=["GET", "POST", "PUT", "DELETE"])
def gateway(service, subpath=""):
    if service == "products":
        return proxy(PRODUCT_SERVICE_URL, "products", subpath)
    elif service == "orders":
        return proxy(ORDER_SERVICE_URL, "orders", subpath)
    elif service == "notifications":
        return proxy(NOTIFICATION_SERVICE_URL, "notifications", subpath)
    else:
        return jsonify({"error": f"Serviciu necunoscut: {service}"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)