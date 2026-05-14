# W3-T8b: build context is the repository root (see docker-compose.yml).
FROM python:3.11-slim

WORKDIR /app

# Install per-service Python deps first so the layer can be cached.
COPY services/training-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the shared `_shared` package (auth, etc.) BEFORE the service so
# changes inside the service tree don't bust the _shared layer cache.
COPY services/_shared/ ./_shared/

# Copy the service source.
COPY services/training-service/ ./

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
