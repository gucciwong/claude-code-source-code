# Knowledge Service

FastAPI microservice that provides text embedding and vector similarity search for the PKL (Personal Knowledge Library) system.

## Overview

The service uses the `intfloat/e5-small-v2` sentence-transformers model to embed text into 384-dimensional vectors. It exposes a pure-Python cosine-similarity search so callers don't need a dedicated vector database.

The model is **lazy-loaded** — it is downloaded and initialised on the first `/embed` request, not at startup. This keeps startup fast.

## Starting the Service

```bash
# Option 1 — plain Python
cd services/knowledge-service
python -m venv venv
# Windows
venv\Scripts\pip install -r requirements.txt
venv\Scripts\uvicorn main:app --reload --port 8003
# macOS / Linux
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8003

# Option 2 — Docker (from repo root)
docker-compose up knowledge-service
```

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8003` | Listen port |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `MODEL_NAME` | `intfloat/e5-small-v2` | HuggingFace model ID |
| `DEVICE` | `cpu` | `cpu`, `cuda`, or `mps` |

## Endpoints

### `GET /health`

Returns service status and whether the model has been loaded.

```json
{ "status": "ok", "version": "0.1.0", "model_loaded": false }
```

### `POST /embed`

Embeds a text string into a float vector.

**Request**
```json
{ "text": "async pagination with React Query" }
```

**Response**
```json
{ "embedding": [0.023, -0.11, ...], "dim": 384 }
```

Returns `400` if `text` is empty, `503` if the model is unavailable.

### `POST /search`

Ranks a list of pre-embedded snippet vectors against a query embedding using cosine similarity.

**Request**
```json
{
  "query_embedding": [0.1, 0.2, ...],
  "snippets": [
    { "id": "abc123", "embedding": [0.1, 0.2, ...] }
  ],
  "top_k": 5,
  "threshold": 0.7
}
```

**Response**
```json
{ "results": [{ "id": "abc123", "score": 0.99 }] }
```

Results are sorted by score descending and capped at `top_k`. Snippets below `threshold` are excluded.

## Running Tests

```bash
cd services/knowledge-service
venv\Scripts\pytest tests/ -v
```
