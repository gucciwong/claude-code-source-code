# Enterprise Data Service

FastAPI microservice (port **8004**) that proxies read-only queries to PostgreSQL, REST APIs, SAP, and Salesforce connectors, and assembles structured `<enterprise_context>` XML blocks for injection into AI prompts.

## Architecture

```
services/enterprise-data-service/
  main.py                          # FastAPI app entry point
  enterprise_data/
    connector.py                   # BaseConnector ABC
    registry.py                    # ConnectorRegistry (in-memory store + factory)
    context_assembler.py           # DataContextAssembler → XML output
    connectors/
      postgres_connector.py        # PostgreSQL (psycopg2, optional)
      rest_connector.py            # Generic HTTP REST (httpx)
      sap_connector.py             # SAP mock
      salesforce_connector.py      # Salesforce mock
  tests/
    test_connectors.py             # 20 pytest tests
  requirements.txt
  pyproject.toml
  .env.example
```

## Running locally

```bash
cd services/enterprise-data-service
python3.10 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Service starts on `http://localhost:8004`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/connectors` | Register a new connector |
| `GET` | `/connectors` | List all connectors |
| `DELETE` | `/connectors/{id}` | Remove a connector |
| `POST` | `/connectors/{id}/query` | Execute read-only query |
| `GET` | `/connectors/{id}/schema` | Get tables/columns |
| `POST` | `/context` | Build `<enterprise_context>` XML |
| `GET` | `/health` | Health check |

## Quick example

```bash
# Register a SAP connector
curl -X POST http://localhost:8004/connectors \
  -H "Content-Type: application/json" \
  -d '{"name":"SAP ERP","type":"sap","enabled":true}'

# List connectors
curl http://localhost:8004/connectors

# Build enterprise context for a prompt
curl -X POST http://localhost:8004/context \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Summarise open orders","connector_ids":["<id-from-above>"]}'
```

## PostgreSQL support

psycopg2 is **optional** — the service degrades gracefully when it is not installed.  
To enable real Postgres queries:

```bash
pip install "enterprise-data-service[postgres]"
# or: pip install psycopg2-binary
```

Then register a connector with `"type": "postgres"` and `"connectionString": "host=... dbname=..."`.

## Running tests

```bash
pytest tests/ -v
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8004` | Listen port |
| `LOG_LEVEL` | `INFO` | Uvicorn log level |
| `CONNECTOR_STORE_PATH` | `~/.sovereign-code/enterprise/connectors.json` | (future) persistence path |
