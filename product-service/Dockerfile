FROM python:3.11-slim

WORKDIR /app

# Instalam dependintele inainte de a copia codul, pentru a beneficia
# de cache-ul de layere Docker la rebuild-uri ulterioare
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PORT=5000
EXPOSE 5000

CMD ["python", "app.py"]
