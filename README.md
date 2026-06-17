# Distributed Orders System

Sistem distribuit de gestiune a comenzilor, construit pe arhitectura de microservicii, containerizat cu **Docker** si orchestrat cu **Kubernetes** (rulat local cu **Minikube**). Frontend interactiv realizat cu **Next.js 16**.

Proiect realizat in cadrul masterului de **Retele si Sisteme Distribuite**.

---

## 1. Arhitectura

**Backend** – 4 microservicii independente:

| Serviciu | Rol | Replici |
|----------|-----|---------|
| `api-gateway` | Punct unic de intrare, CORS, rutare | 2 |
| `order-service` | Gestiune comenzi, orchestrator | 2 |
| `product-service` | Catalog produse, CRUD, stoc | 1 |
| `notification-service` | Log evenimente sistem | 1 |

**Frontend** – Next.js:
- `/` – **Cumparator**: Catalog, plasare comenzi.
- `/admin` – **Administrator**: CRUD produse, stoc, log-uri sistem.

---

## 2. Diagrama flux comanda
**Client** -> `api-gateway` -> `order-service` -> `product-service` (verificare + reducere stoc) -> `notification-service` (log eveniment)

Comunicare bazata pe DNS-ul intern Kubernetes (ConfigMap).

---

## 3. Structura proiect

    ├── api-gateway/            # Python/Flask + CORS
    ├── order-service/          # Python/Flask
    ├── product-service/        # Python/Flask (CRUD complet)
    ├── notification-service/   # Python/Flask
    ├── frontend-app/           # Next.js 16
    │   ├── app/                # Rute: /, /admin
    │   ├── components/         # Dashboard, Nav, ProductCard
    │   └── lib/                # API Config
    ├── k8s/                    # Deployment + Service YAML
    └── build-and-deploy.sh     # Script automatizare

---

## 4. Endpoint-uri principale

| Serviciu | Metoda | Ruta | Descriere |
|----------|--------|------|-----------|
| products | GET | `/api/products` | Lista produse |
| products | POST | `/api/products` | Adauga produs |
| products | PUT | `/api/products/<id>` | Actualizare produs |
| products | DELETE | `/api/products/<id>` | Stergere produs |
| orders | POST | `/api/orders` | Creeaza comanda |
| notifications| GET | `/api/notifications` | Lista log-uri |

---

## 5. Rulare rapida (zilnic)

    minikube start
    # Deschide un terminal separat pentru tunel:
    minikube service api-gateway -n distributed-orders --url
    # In folderul frontend:
    cd frontend-app && npm run dev

---

## 6. Concepte demonstrate
* **Loose coupling** – servicii izolate, comunicare prin REST API.
* **Database per Service** – separarea responsabilitatilor datelor.
* **API Gateway** – punct unic de intrare, rutare si CORS.
* **Orchestrare** – Kubernetes (self-healing, declarativ).
* **Fault tolerance** – tratarea erorilor si gestionarea stocului.

---

## 7. Autor
Proiect realizat de **Stefan Ionut Razvan** pentru disciplina *Retele si Sisteme Distribuite*, program de Master.
