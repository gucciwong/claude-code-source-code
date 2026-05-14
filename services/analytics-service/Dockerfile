# W6-T17c: build context is the repository root (see docker-compose.yml).
FROM python:3.11-slim

WORKDIR /app

COPY services/analytics-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Shared package (auth, observability, logging). Layer split first so it
# only invalidates the cache when services/_shared/ actually changes.
COPY services/_shared/ ./_shared/

COPY services/analytics-service/ ./

EXPOSE 8009
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8009"]
