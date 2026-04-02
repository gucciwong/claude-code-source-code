from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from typing import Optional

from analytics.models import MetricEvent
from analytics.registry import collector, productivity_calc, quality_analyzer, roi_calculator, exporter

app = FastAPI(title="Analytics Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.post("/events")
async def ingest_event(event: MetricEvent):
    event_id = collector.ingest(event)
    return {"status": "ok", "id": event_id}


@app.get("/metrics/productivity")
async def get_productivity():
    return productivity_calc.calculate()


@app.get("/metrics/quality-trends")
async def get_quality_trends():
    return quality_analyzer.analyze()


@app.get("/metrics/training-roi")
async def get_training_roi():
    return roi_calculator.calculate()


@app.get("/reports/export")
async def export_report(
    format: str = Query("json", pattern="^(json|csv)$"),
    start: Optional[float] = None,
    end: Optional[float] = None,
):
    if format == "csv":
        data = exporter.export_csv()
        return PlainTextResponse(content=data, media_type="text/csv")
    else:
        data = exporter.export_json()
        return PlainTextResponse(content=data, media_type="application/json")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
