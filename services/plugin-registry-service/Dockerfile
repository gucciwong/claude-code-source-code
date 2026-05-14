# W6-T17c: build context is the repository root (see docker-compose.yml).
FROM python:3.11-slim

WORKDIR /app

COPY services/plugin-registry-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/_shared/ ./_shared/

COPY services/plugin-registry-service/ ./

EXPOSE 8015
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8015"]
