# W3-T8b: build context is the repository root (see docker-compose.yml).
# All COPY paths are therefore prefixed with `services/<svc>/`.
FROM python:3.11-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc cmake libomp-dev && rm -rf /var/lib/apt/lists/*

# Install per-service Python deps first so the layer can be cached.
COPY services/model-manager/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the shared `_shared` package (auth, etc.) BEFORE the service so
# changes inside the service tree don't bust the _shared layer cache.
COPY services/_shared/ ./_shared/

# Copy the service source. Last to maximize cache hits during dev.
COPY services/model-manager/ ./

EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
