#!/usr/bin/env bash
# =============================================================================
# build-and-deploy.sh
#
# Automatizeaza intregul flux de lansare a sistemului distribuit:
#   1. Verifica/porneste Minikube
#   2. Configureaza Docker CLI sa construiasca imagini direct in demonul
#      Docker al Minikube (astfel imagePullPolicy: Never functioneaza,
#      fara a fi nevoie de un registry extern)
#   3. Construieste imaginile celor 4 microservicii
#   4. Creeaza namespace-ul dedicat (daca nu exista deja)
#   5. Aplica ConfigMap + toate Deployment/Service-urile
#   6. Asteapta ca toate deployment-urile sa devina disponibile
#   7. Afiseaza statusul final al podurilor si serviciilor
#
# Ruleaza acest script din radacina proiectului:
#   chmod +x build-and-deploy.sh
#   ./build-and-deploy.sh
# =============================================================================

set -e  # ne oprim la prima eroare

NAMESPACE="distributed-orders"

echo "=================================================================="
echo " Distributed Orders System - Build & Deploy"
echo "=================================================================="

# -----------------------------------------------------------------------
# 1. Verificam ca Minikube ruleaza
# -----------------------------------------------------------------------
if ! command -v minikube &> /dev/null; then
    echo "[EROARE] minikube nu este instalat sau nu este in PATH."
    exit 1
fi

if ! minikube status &> /dev/null; then
    echo "[INFO] Minikube nu ruleaza inca. Pornesc Minikube..."
    minikube start
else
    echo "[INFO] Minikube ruleaza deja."
fi

# -----------------------------------------------------------------------
# 2. Configuram shell-ul curent sa foloseasca demonul Docker din Minikube
#    Astfel imaginile construite mai jos sunt disponibile direct in
#    cluster, fara a fi nevoie sa fie impinse intr-un registry.
# -----------------------------------------------------------------------
echo "[INFO] Configurez mediul Docker catre demonul din Minikube..."
eval "$(minikube docker-env)"

# -----------------------------------------------------------------------
# 3. Construim imaginile Docker pentru toate cele 4 microservicii
# -----------------------------------------------------------------------
echo "[INFO] Construiesc imaginea: product-service:latest"
docker build -t product-service:latest ./product-service

echo "[INFO] Construiesc imaginea: order-service:latest"
docker build -t order-service:latest ./order-service

echo "[INFO] Construiesc imaginea: notification-service:latest"
docker build -t notification-service:latest ./notification-service

echo "[INFO] Construiesc imaginea: api-gateway:latest"
docker build -t api-gateway:latest ./api-gateway

echo "[INFO] Imagini construite (vizibile in demonul Docker al Minikube):"
docker images | head -1
docker images | grep -E "product-service|order-service|notification-service|api-gateway" || true

# -----------------------------------------------------------------------
# 4. Creem namespace-ul dedicat, daca nu exista deja
# -----------------------------------------------------------------------
echo "[INFO] Creez (sau verific) namespace-ul '$NAMESPACE'..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# -----------------------------------------------------------------------
# 5. Aplicam manifestele Kubernetes
#    Ordinea conteaza partial: ConfigMap-ul trebuie sa existe inainte ca
#    Deployment-urile care il refera (envFrom) sa fie create.
# -----------------------------------------------------------------------
echo "[INFO] Aplic ConfigMap..."
kubectl apply -f k8s/configmap.yaml

echo "[INFO] Aplic Deployment + Service pentru product-service..."
kubectl apply -f k8s/product-deployment.yaml

echo "[INFO] Aplic Deployment + Service pentru notification-service..."
kubectl apply -f k8s/notification-deployment.yaml

echo "[INFO] Aplic Deployment + Service pentru order-service..."
kubectl apply -f k8s/order-deployment.yaml

echo "[INFO] Aplic Deployment + Service pentru api-gateway..."
kubectl apply -f k8s/gateway-deployment.yaml

# -----------------------------------------------------------------------
# 6. Asteptam ca toate Deployment-urile sa fie disponibile
# -----------------------------------------------------------------------
echo "[INFO] Asteptam ca deployment-urile sa devina disponibile (timeout 120s fiecare)..."
kubectl rollout status deployment/product-service -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/notification-service -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/order-service -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/api-gateway -n "$NAMESPACE" --timeout=120s

# -----------------------------------------------------------------------
# 7. Afisam statusul final
# -----------------------------------------------------------------------
echo ""
echo "=================================================================="
echo " Status final al sistemului (namespace: $NAMESPACE)"
echo "=================================================================="
echo ""
echo "--- Pods ---"
kubectl get pods -n "$NAMESPACE" -o wide
echo ""
echo "--- Services ---"
kubectl get svc -n "$NAMESPACE"
echo ""
echo "--- Deployments ---"
kubectl get deployments -n "$NAMESPACE"
echo ""

MINIKUBE_IP=$(minikube ip)

echo "=================================================================="
echo " Sistemul este pregatit!"
echo "=================================================================="
echo "API Gateway disponibil la: http://$MINIKUBE_IP:30080"
echo ""
echo "Exemple de testare rapida:"
echo "  curl http://$MINIKUBE_IP:30080/api/products"
echo "  curl http://$MINIKUBE_IP:30080/api/orders"
echo "  curl http://$MINIKUBE_IP:30080/api/notifications"
echo ""
echo "Pentru mai multe exemple de testare, consulta README.md."
echo "=================================================================="
