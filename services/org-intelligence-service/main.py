from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from org_intelligence.models import SharedPattern, ContributeRequest, SearchRequest, SkillGapReport, Bottleneck
from org_intelligence.registry import aggregator, skill_analyzer, bottleneck_detector

app = FastAPI(title="Org Intelligence Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


@app.post("/patterns/contribute", response_model=SharedPattern)
def contribute_pattern(req: ContributeRequest) -> SharedPattern:
    return aggregator.contribute(req)


@app.get("/patterns/shared", response_model=List[SharedPattern])
def list_patterns() -> List[SharedPattern]:
    return aggregator.list_patterns()


@app.post("/patterns/search", response_model=List[SharedPattern])
def search_patterns(req: SearchRequest) -> List[SharedPattern]:
    return aggregator.search(req.query)


@app.get("/analytics/skill-gaps", response_model=SkillGapReport)
def get_skill_gaps() -> SkillGapReport:
    patterns = aggregator.list_patterns()
    return skill_analyzer.analyze(patterns)


@app.get("/analytics/bottlenecks", response_model=List[Bottleneck])
def get_bottlenecks() -> List[Bottleneck]:
    patterns = aggregator.list_patterns()
    return bottleneck_detector.detect(patterns)
