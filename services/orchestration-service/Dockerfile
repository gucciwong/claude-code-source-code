# W6-T17c: build context is the repository root (see docker-compose.yml).
FROM python:3.11-slim

WORKDIR /app

COPY services/orchestration-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/_shared/ ./_shared/

COPY services/orchestration-service/ ./

EXPOSE 8006
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
