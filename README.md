# Distributed Orders System

Sistem distribuit de gestiune a comenzilor, construit pe arhitectură de
microservicii, containerizat cu **Docker** și orchestrat cu **Kubernetes**
(rulat local cu **Minikube**).

Proiect realizat în cadrul masterului de **Rețele și Sisteme Distribuite**.

---

## 1. Descrierea arhitecturii

Sistemul este compus din **4 componente independente**, fiecare rulând în
propriul container, fiecare cu propria sa "bază de date" (simulată în
memorie pentru simplitate didactică) și comunicând exclusiv prin **HTTP
REST**:

| Componentă             | Rol                                                                 | Tehnologie     | Replici |
|-------------------------|----------------------------------------------------------------------|----------------|---------|
| `api-gateway`            | Punct unic de intrare; rutează cererile către serviciul corect      | Python/Flask   | 2       |
| `order-service`          | Primește și stochează comenzile; orchestrează apelurile către celelalte servicii | Python/Flask | 2 |
| `product-service`        | Gestionează catalogul de produse și stocul                          | Python/Flask   | 2       |
| `notification-service`   | Înregistrează (loghează) evenimentele din sistem                    | Python/Flask   | 1       |

Toate cele 4 componente rulează în același **namespace Kubernetes**:
`distributed-orders`.

### De ce API Gateway?

Clientul extern (browser, curl, Postman) nu cunoaște și nu trebuie să
cunoască topologia internă a clusterului (adrese IP de Pod, nume de Service
interne etc.). El contactează o singură adresă — `api-gateway` — care
rutează intern cererea către microserviciul potrivit. Acesta este pattern-ul
clasic **API Gateway** din arhitecturile de microservicii.

---

## 2. Diagrama textuală a sistemului

```
                                   ┌────────────────────────────┐
                                   │        CLIENT EXTERN         │
                                   │   (curl / browser / Postman) │
                                   └──────────────┬───────────────┘
                                                  │  HTTP :30080 (NodePort)
                                                  ▼
                         ┌─────────────────────────────────────────────┐
                         │                  api-gateway                  │
                         │            (Deployment, 2 replici)            │
                         │      Service: NodePort (30080 -> 5000)        │
                         └───────────────┬───────────┬───────────────────┘
                                          │           │
                     /api/orders/*        │           │       /api/products/*
                     /api/notifications/* │           │
                                          ▼           ▼
                  ┌──────────────────────────┐   ┌──────────────────────────┐
                  │       order-service        │   │      product-service      │
                  │   (Deployment, 2 replici)  │   │   (Deployment, 2 replici)  │
                  │   Service: ClusterIP :5000 │   │   Service: ClusterIP :5000 │
                  │                            │──▶│  GET  /products/<id>      │
                  │  POST /orders              │   │  POST /products/<id>/     │
                  │   1. verifica produs ──────┼──▶│        reduce-stock       │
                  │   2. reduce stoc   ─────────┘   └──────────────────────────┘
                  │   3. salveaza comanda      │
                  │   4. trimite notificare ───┼──▶┌──────────────────────────┐
                  └──────────────────────────┘    │   notification-service     │
                                                    │   (Deployment, 1 replica)  │
                                                    │   Service: ClusterIP :5000 │
                                                    │  POST /notifications       │
                                                    │  GET  /notifications       │
                                                    └──────────────────────────┘

      Toate componentele citesc adresele celorlalte servicii din:
      ConfigMap "service-urls" (ORDER_SERVICE_URL, PRODUCT_SERVICE_URL,
      NOTIFICATION_SERVICE_URL) -- niciun IP hardcodat.
```

### Fluxul complet al unei comenzi (POST /orders)

```
Client          api-gateway        order-service       product-service     notification-service
  │                   │                    │                     │                    │
  │── POST /api/orders ──▶                 │                     │                    │
  │                   │── proxy POST /orders ──▶                  │                    │
  │                   │                    │── GET /products/id ──▶                    │
  │                   │                    │◀── 200 produs ────────│                    │
  │                   │                    │── POST reduce-stock ──▶                    │
  │                   │                    │◀── 200 stoc redus ────│                    │
  │                   │                    │── POST /notifications ─────────────────────▶
  │                   │                    │◀── 201 notificare creata ────────────────────│
  │                   │◀── 201 comanda ─────│                     │                    │
  │◀── 201 comanda ────│                    │                     │                    │
```

---

## 3. Structura proiectului

```
distributed-orders-system/
├── order-service/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── product-service/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── notification-service/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── api-gateway/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── k8s/
│   ├── configmap.yaml
│   ├── order-deployment.yaml
│   ├── product-deployment.yaml
│   ├── notification-deployment.yaml
│   └── gateway-deployment.yaml
├── build-and-deploy.sh
└── README.md
```

---

## 4. Endpoint-uri disponibile

### product-service (intern, port 5000)
| Metodă | Rută                                  | Descriere                                |
|--------|----------------------------------------|--------------------------------------------|
| GET    | `/products`                            | Listează toate produsele                  |
| GET    | `/products/<id>`                       | Detalii despre un produs                  |
| POST   | `/products`                            | Adaugă produs nou (`name`, `price`, `stock`) |
| POST   | `/products/<id>/reduce-stock`          | (intern) Reduce stocul cu `quantity`      |
| GET    | `/health`                              | Health check                              |

### order-service (intern, port 5000)
| Metodă | Rută            | Descriere                                                  |
|--------|------------------|---------------------------------------------------------------|
| GET    | `/orders`        | Listează toate comenzile                                      |
| GET    | `/orders/<id>`   | Detalii despre o comandă                                       |
| POST   | `/orders`        | Creează o comandă (`product_id`, `quantity`, `customer_name`) |
| GET    | `/health`        | Health check                                                   |

### notification-service (intern, port 5000)
| Metodă | Rută             | Descriere                                |
|--------|-------------------|---------------------------------------------|
| GET    | `/notifications`  | Listează log-ul de notificări               |
| POST   | `/notifications`  | Înregistrează un eveniment (`event`, `message`) |
| GET    | `/health`         | Health check                                 |

### api-gateway (extern, NodePort 30080)
Toate rutele de mai sus sunt accesibile extern prin prefixul `/api/<serviciu>`:

```
/api/products
/api/products/<id>
/api/products/<id>/reduce-stock
/api/orders
/api/orders/<id>
/api/notifications
```

---

## 5. Pași de instalare și rulare

### Cerințe preliminare
- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

### Pas 1 — Pornește Minikube

```bash
minikube start
```

### Pas 2 — Rulează scriptul automatizat (recomandat)

Din rădăcina proiectului:

```bash
chmod +x build-and-deploy.sh
./build-and-deploy.sh
```

Scriptul va:
1. verifica/porni Minikube;
2. configura Docker CLI să construiască imagini direct în demonul Docker
   al Minikube (`eval $(minikube docker-env)`), astfel încât
   `imagePullPolicy: Never` să funcționeze fără registry extern;
3. construi imaginile pentru toate cele 4 servicii;
4. crea namespace-ul `distributed-orders`;
5. aplica ConfigMap-ul și toate Deployment/Service-urile;
6. aștepta ca toate deployment-urile să devină disponibile;
7. afișa statusul final al podurilor și serviciilor + IP-ul de testare.

### Pas 2 (alternativ) — Pași manuali

```bash
# Configuram Docker sa construiasca direct in Minikube
eval $(minikube docker-env)

# Construim imaginile
docker build -t product-service:latest ./product-service
docker build -t order-service:latest ./order-service
docker build -t notification-service:latest ./notification-service
docker build -t api-gateway:latest ./api-gateway

# Cream namespace-ul
kubectl create namespace distributed-orders

# Aplicam configuratiile Kubernetes
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/product-deployment.yaml
kubectl apply -f k8s/notification-deployment.yaml
kubectl apply -f k8s/order-deployment.yaml
kubectl apply -f k8s/gateway-deployment.yaml

# Verificam statusul
kubectl get pods -n distributed-orders
kubectl get svc -n distributed-orders
```

### Pas 3 — Obține adresa de acces

```bash
minikube ip
# exemplu rezultat: 192.168.49.2
```

API Gateway-ul va fi accesibil la `http://<minikube-ip>:30080`.

> Alternativ, dacă driverul Minikube nu expune direct IP-ul nodului
> (ex: pe Docker Desktop / driver `docker` pe macOS sau Windows), poți
> folosi tunelul dedicat:
> ```bash
> minikube service api-gateway -n distributed-orders --url
> ```

---

## 6. Comenzi de testare cu `curl`

Înlocuiește `$GW` cu adresa reală (`http://<minikube-ip>:30080`):

```bash
export GW=http://$(minikube ip):30080
```

### Listare produse (date inițiale, pre-populate la pornire)
```bash
curl $GW/api/products
```

### Adăugare produs nou
```bash
curl -X POST $GW/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Casti Sony WH-1000XM5", "price": 1400, "stock": 12}'
```

### Creare comandă (declanșează comunicarea inter-servicii)
```bash
curl -X POST $GW/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2, "customer_name": "Ana Popescu"}'
```

### Listare comenzi
```bash
curl $GW/api/orders
```

### Listare notificări (log-ul evenimentelor generate de order-service)
```bash
curl $GW/api/notifications
```

### Testare comandă cu stoc insuficient (eroare 409)
```bash
curl -X POST $GW/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 9999, "customer_name": "Test Stoc"}'
```

### Testare produs inexistent (eroare 404)
```bash
curl $GW/api/products/999
```

---

## 7. Verificare și depanare în Kubernetes

```bash
# Statusul podurilor
kubectl get pods -n distributed-orders -o wide

# Logurile unui pod (util pentru a vedea notificarile logate)
kubectl logs -n distributed-orders deployment/notification-service

# Detalii despre un pod (ex: daca un probe de health a picat)
kubectl describe pod <nume-pod> -n distributed-orders

# Acces direct intr-un container, pentru debugging
kubectl exec -it <nume-pod> -n distributed-orders -- /bin/sh
```

---

## 8. Demonstrarea scalabilității orizontale

```bash
# Scalam order-service la 4 replici
kubectl scale deployment order-service -n distributed-orders --replicas=4

# Verificam noile poduri
kubectl get pods -n distributed-orders -l app=order-service

# Revenim la 2 replici
kubectl scale deployment order-service -n distributed-orders --replicas=2
```

## 9. Demonstrarea toleranței la erori (self-healing)

```bash
# Stergem manual un pod de product-service
kubectl delete pod -n distributed-orders -l app=product-service --field-selector status.phase=Running -l app=product-service --field-selector=status.phase=Running | head -n 1

# Alternativ, simplu:
POD=$(kubectl get pods -n distributed-orders -l app=product-service -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $POD -n distributed-orders

# Kubernetes va recrea automat podul, conform Deployment-ului (replicaset controller)
kubectl get pods -n distributed-orders -l app=product-service -w
```

---

## 10. Cleanup

```bash
# Sterge toate resursele din namespace
kubectl delete namespace distributed-orders

# Opreste Minikube (opțional)
minikube stop
```

---

## 11. Concepte demonstrate (legătura cu teoria din curs)

### Loose coupling (cuplare slabă)
Microserviciile nu se cunosc reciproc prin adrese fixe — comunică prin
nume de servicii Kubernetes (DNS intern) injectate prin **ConfigMap**.
Acest lucru permite înlocuirea, repornirea sau realocarea fizică a unui
serviciu fără a impacta codul celorlalte servicii. De exemplu,
`order-service` apelează `http://product-service:5000`, indiferent de pe
ce nod fizic sau în care din cele 2 replici ajunge efectiv cererea —
Service-ul Kubernetes face load-balancing transparent (`kube-proxy`).

### Single Responsibility / Database per Service
Fiecare microserviciu are propriul "magazin de date" (în acest proiect,
simulat cu un dicționar în memorie, dar conceptual izolat). Niciun
serviciu nu accesează direct datele altui serviciu — comunicarea se face
exclusiv prin API-uri HTTP bine definite, nu prin acces direct la baza de
date a altcuiva. Acest pattern reduce cuplarea la nivel de schemă de date
și permite fiecărui serviciu să-și evolueze independent modelul intern.

### Fault tolerance (toleranță la erori)
`order-service` tratează explicit cazurile în care `product-service` sau
`notification-service` nu răspund (`try/except` pe `requests`, timeout de
5 secunde, coduri HTTP `503 Service Unavailable`). Notificarea către
`notification-service` este tratată ca operațiune **best-effort**: dacă
notification-service e indisponibil, comanda este în continuare validă —
sistemul degradează grațios ("graceful degradation") în loc să cadă
complet. În Kubernetes, **liveness și readiness probes** detectează
automat podurile nesănătoase și le restart/exclud din load balancing,
iar **ReplicaSet controller**-ul recreează automat podurile care cad
(self-healing).

### Scalability (scalabilitate orizontală)
`order-service`, `product-service` și `api-gateway` rulează cu 2 replici
fiecare. Service-ul Kubernetes de tip ClusterIP distribuie automat
traficul către toate podurile sănătoase ale unui Deployment. Comanda
`kubectl scale deployment <nume> --replicas=N` demonstrează cum sistemul
poate absorbi creșterea încărcării prin adăugarea de instanțe noi,
identice și fără stare partajată (stateless), fără downtime.

### CAP Theorem (Consistență, Disponibilitate, Toleranță la partiționare)
Acest sistem este construit ca un exemplu de sistem orientat spre
**disponibilitate (A)** în detrimentul **consistenței stricte (C)**, în
prezența unei partiționări de rețea (P):

- Atunci când `notification-service` este indisponibil, `order-service`
  **nu blochează și nu anulează comanda** — alege disponibilitatea
  fluxului principal de business (confirmarea comenzii către client) în
  detrimentul consistenței imediate a log-ului de notificări (care va fi
  temporar "în urmă" / inconsistent față de starea reală a comenzilor).
  Aceasta este o formă de **eventual consistency**.
- În schimb, pentru reducerea stocului (`product-service`), sistemul
  alege un compromis spre consistență: comanda este respinsă (HTTP 409)
  dacă stocul nu poate fi rezervat sincron, evitând suprasolicitarea
  (overselling) — un exemplu clasic de tensiune între C și A, rezolvată
  diferit în funcție de cât de critică e operațiunea pentru business.
- Lipsa unei tranzacții distribuite (2PC) între `order-service` și
  `product-service` este intenționată, pentru a ilustra o limitare reală
  a sistemelor distribuite: în absența unui mecanism de tip Saga sau
  tranzacții compensatorii, există o fereastră teoretică în care stocul
  e redus dar comanda nu se mai salvează (de ex. dacă order-service
  pică exact după pasul 2). Aceasta motivează discuția despre
  **pattern-ul Saga** ca extensie posibilă a proiectului.

### API Gateway pattern
`api-gateway` oferă un punct unic, stabil de intrare în sistem,
ascunzând topologia internă și permițând introducerea ulterioară a unor
preocupări transversale (autentificare, rate limiting, logging
centralizat, caching) fără a modifica microserviciile din spate.

### Containerizare și portabilitate (Docker)
Fiecare serviciu este împachetat independent într-o imagine Docker
minimală (`python:3.11-slim`), cu propriile dependențe izolate
(`requirements.txt`), garantând că rulează identic indiferent de mediul
host (laptop dezvoltator, server CI, cluster de producție).

### Orchestrare declarativă (Kubernetes)
Starea dorită a sistemului (număr de replici, variabile de mediu,
porturi expuse, politici de health-check) este descrisă **declarativ** în
fișiere YAML, nu imperativ prin comenzi pas-cu-pas. Kubernetes
reconciliază continuu starea reală a clusterului cu cea declarată
(control loop), ceea ce stă la baza capacităților de self-healing și
scalare automată discutate mai sus.

---

## 12. Limitări cunoscute și posibile extensii

Acest proiect este o demonstrație didactică; pentru un sistem de
producție real, ar fi necesare următoarele îmbunătățiri:

- **Persistență reală a datelor** — înlocuirea dicționarelor în memorie cu
  baze de date reale (PostgreSQL, MongoDB), eventual cu volume persistente
  Kubernetes (`PersistentVolumeClaim`), astfel încât datele să supraviețuiască
  restart-ului unui pod.
- **Comunicare asincronă** — înlocuirea apelurilor HTTP sincrone dintre
  `order-service` și `notification-service` cu un broker de mesaje
  (RabbitMQ, Kafka), pentru decuplare temporală reală și retry automat.
- **Pattern Saga / tranzacții compensatorii** — pentru a garanta
  consistența între reducerea stocului și salvarea comenzii, în cazul în
  care un pas intermediar eșuează.
- **Circuit Breaker** — pentru a evita apeluri repetate către un serviciu
  deja cunoscut ca indisponibil (ex: bibliotecă precum `pybreaker`).
- **Observabilitate** — integrarea cu Prometheus + Grafana pentru metrici,
  și cu un sistem centralizat de logging (ex: EFK/ELK stack).
- **Securitate** — autentificare/autorizare la nivelul API Gateway-ului
  (JWT, OAuth2), `NetworkPolicy` pentru a restricționa comunicarea
  inter-pod doar la fluxurile necesare, TLS între servicii (mTLS via
  service mesh precum Istio/Linkerd).
- **CI/CD** — pipeline automatizat de build & deploy (GitHub Actions,
  GitLab CI) către un registry real de imagini (Docker Hub, GHCR), în
  locul construirii locale în demonul Docker al Minikube.

---

## 13. Autor

Proiect realizat pentru disciplina **Rețele și Sisteme Distribuite**,
program de master.
