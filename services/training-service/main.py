"""
Sovereign Coder Training Service - FastAPI backend
Handles training data collection, orchestration, and evaluation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import logging
import os

from training_data.models import init_db, get_session_maker, EventType
from training_data.store import TrainingDataStore
from finetune.router import router as finetune_router


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models (Request/Response schemas)
# ============================================================================

class CompletionEventRequest(BaseModel):
    """Request to log a completion event"""
    event_type: str  # completion_accepted, completion_rejected, completion_edited
    prompt: str
    completion: str
    language: str
    file_path: Optional[str] = None
    model_id: Optional[str] = None
    tokens_generated: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskTrajectoryRequest(BaseModel):
    """Request to log a task execution"""
    task_id: str
    task_description: str
    task_type: Optional[str] = None
    steps: List[Dict[str, Any]]
    outcome: str  # success, failure, partial
    final_code: Optional[str] = None
    error_message: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    tokens_consumed: Optional[int] = None


class TrainingStatsResponse(BaseModel):
    """Training statistics"""
    total_events: int
    completion_accepted: int
    completion_rejected: int
    completion_edited: int
    task_completed_total: int
    task_success_rate: float
    recent_events_24h: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    database_ready: bool


# ============================================================================
# Application Setup
# ============================================================================

# Initialize database
DB_PATH = os.getenv("DB_PATH", "./data/training.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
engine = init_db(DB_PATH)
SessionLocal = get_session_maker(DB_PATH)


def get_db():
    """Dependency: get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle"""
    logger.info("🚀 Training service starting...")
    yield
    logger.info("🛑 Training service shutting down...")


app = FastAPI(
    title="Sovereign Coder Training Service",
    version="0.1.0",
    lifespan=lifespan,
)

# Mount finetune sub-router
app.include_router(finetune_router)


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_ok = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_ok = False
    
    return HealthResponse(
        status="ok" if db_ok else "degraded",
        version="0.1.0",
        database_ready=db_ok,
    )


@app.post("/api/v1/training/event", status_code=201)
async def log_completion_event(request: CompletionEventRequest):
    """Log a code completion event for training"""
    
    db = next(get_db())
    store = TrainingDataStore(db)
    
    try:
        # Validate event type
        if request.event_type not in [e.value for e in EventType]:
            raise ValueError(f"Invalid event_type: {request.event_type}")
        
        # Add to store
        event_id = store.add_completion_event(
            event_type=request.event_type,
            prompt=request.prompt,
            completion=request.completion,
            language=request.language,
            file_path=request.file_path,
            model_id=request.model_id,
            tokens_generated=request.tokens_generated,
            temperature=request.temperature,
            top_p=request.top_p,
            metadata=request.metadata,
        )
        
        logger.info(f"✓ Logged event {event_id} ({request.event_type})")
        
        return {
            "event_id": event_id,
            "created_at": datetime.utcnow().isoformat(),
        }
    
    except ValueError as e:
        logger.warning(f"Invalid event: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error logging event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()


@app.post("/api/v1/training/task", status_code=201)
async def log_task_trajectory(request: TaskTrajectoryRequest):
    """Log an agent task execution for training"""
    
    db = next(get_db())
    store = TrainingDataStore(db)
    
    try:
        task_id = store.add_task_trajectory(
            task_id=request.task_id,
            task_description=request.task_description,
            task_type=request.task_type,
            steps=request.steps,
            outcome=request.outcome,
            final_code=request.final_code,
            error_message=request.error_message,
            execution_time_seconds=request.execution_time_seconds,
            tokens_consumed=request.tokens_consumed,
        )
        
        logger.info(f"✓ Logged task {task_id} ({request.outcome})")
        
        return {
            "task_id": task_id,
            "created_at": datetime.utcnow().isoformat(),
        }
    
    except ValueError as e:
        logger.warning(f"Invalid task: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error logging task: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()


@app.get("/api/v1/training/stats", response_model=TrainingStatsResponse)
async def get_training_stats():
    """Get training data statistics"""
    
    db = next(get_db())
    store = TrainingDataStore(db)
    
    try:
        stats = store.get_stats()
        logger.info(f"Stats queried: {stats['total_events']} events")
        return stats
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()


@app.get("/api/v1/training/export")
async def export_training_data(
    format: str = "jsonlines",
    max_samples: int = 5000,
    language: Optional[str] = None,
):
    """
    Export training data for external use
    Formats: jsonlines, parquet, csv
    """
    
    db = next(get_db())
    store = TrainingDataStore(db)
    
    try:
        # Fetch data
        data = store.get_all_dataset_since(
            since=None,
            language_filter=language,
        )
        
        if len(data) > max_samples:
            data = data[-max_samples:]  # Keep most recent
        
        logger.info(f"Exporting {len(data)} samples in {format} format")
        
        if format == "jsonlines":
            # Stream as newline-delimited JSON
            import json
            
            def generate():
                for row in data:
                    yield json.dumps(row) + "\n"
            
            return StreamingResponse(
                generate(),
                media_type="application/x-ndjson",
                headers={
                    "Content-Disposition": f"attachment; filename=training-data.jsonl"
                }
            )
        
        elif format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if data:
                writer = csv.DictWriter(output, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=training-data.csv"
                }
            )
        
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()


@app.post("/api/v1/training/cleanup")
async def cleanup_old_events(days_old: int = 90):
    """Delete training events older than N days"""
    
    db = next(get_db())
    store = TrainingDataStore(db)
    
    try:
        deleted = store.clear_old_events(days_old=days_old)
        logger.info(f"✓ Cleaned up {deleted} events older than {days_old} days")
        
        return {
            "deleted": deleted,
            "message": f"Removed {deleted} events older than {days_old} days",
        }
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()


# ============================================================================
# UI Integration Endpoints (Desktop & VSCode)
# ============================================================================

@app.get("/api/v1/training/status")
async def get_training_status():
    """Get current training orchestrator status (for UI).
    
    Returns:
    {
      "model_id": "mistral-7b",
      "active_cycle": "quick" | "full" | "idle",
      "quick_train_count": 25,  # Quick trains since last full
      "last_quick_train": "2026-04-02T12:30:00",
      "next_full_train_in": 23,  # Quick trains until next full cycle (48 total)
      "current_best_adapter": "mistral-7b_quick_24",
      "is_training": true,  # Currently running training
      "estimated_time_remaining_minutes": 45,
    }
    """
    # TODO: Wire with actual orchestrator instance
    # For now, return stub response
    return {
        "model_id": "mistral-7b",
        "active_cycle": "idle",
        "quick_train_count": 0,
        "last_quick_train": None,
        "next_full_train_in": 48,
        "current_best_adapter": None,
        "is_training": False,
        "estimated_time_remaining_minutes": 0,
    }


@app.get("/api/v1/training/version/{model_id}")
async def get_model_version(model_id: str):
    """Get current active model version.
    
    Returns:
    {
      "version_id": "v_1712149200",
      "adapter_id": "mistral-7b_full_0",
      "status": "production" | "staging" | "draft",
      "quality_score": 0.92,
      "promoted_at": "2026-04-02T14:00:00",
      "benchmark_results": {
        "humaneval_pass_rate": 0.45,
        "mbpp_pass_rate": 0.85,
      }
    }
    """
    # TODO: Wire with actual registry instance
    # For now, return stub response
    return {
        "version_id": None,
        "adapter_id": None,
        "status": "none",
        "quality_score": 0.0,
        "promoted_at": None,
        "benchmark_results": {},
    }


@app.get("/api/v1/training/versions/{model_id}")
async def get_version_history(model_id: str, limit: int = 5):
    """Get version history for display in UI.
    
    Returns: [
      {
        "version_id": "v_1712149200",
        "created_at": "2026-04-02T14:00:00",
        "action": "publish" | "promote" | "rollback",
        "status": "production",
        "quality_score": 0.92,
      },
      ...
    ]
    """
    # TODO: Wire with actual registry instance
    return []


# ============================================================================
# Root endpoint
# ============================================================================

@app.get("/")
async def root():
    """API root"""
    return {
        "service": "Sovereign Coder Training Service",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
