"""
Experiment API Routes (Phase 1.3 - Experiment API)

Provides FastAPI routes for autonomous hyperparameter experimentation:
- Create, list, retrieve, and update experiments
- Query best experiment by metric
- Export experiments as TSV for analysis

Routes (ordered: specific routes first, then dynamic routes):
    GET    /api/v1/experiments/best         - Get best experiment for run_tag
    GET    /api/v1/experiments/export       - Export experiments as TSV
    POST   /api/v1/experiments              - Create new experiment
    GET    /api/v1/experiments              - List experiments with filtering
    GET    /api/v1/experiments/{id}         - Get experiment details
    PATCH  /api/v1/experiments/{id}         - Update experiment status/metrics
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from io import StringIO

from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from .models import Experiment, ExperimentStatus
from .store import ExperimentStore


# ============================================================================
# Pydantic Request/Response Models
# ============================================================================

class CreateExperimentRequest(BaseModel):
    """Request to create a new experiment"""
    run_tag: str = Field(..., description="Run identifier (e.g., 'autoresearch/jun15')")
    config: Dict[str, Any] = Field(..., description="Training configuration dict")
    description: str = Field(..., description="Human-readable description of experiment")
    parent_experiment_id: Optional[str] = Field(
        None,
        description="Parent experiment ID for lineage tracking"
    )


class UpdateExperimentRequest(BaseModel):
    """Request to update experiment status and metrics"""
    status: Optional[str] = Field(
        None,
        description="Status: pending, running, keep, discard, crash"
    )
    val_loss: Optional[float] = Field(None, description="Validation loss")
    val_bpb: Optional[float] = Field(None, description="Validation bits-per-byte")
    primary_metric: Optional[float] = Field(None, description="Primary optimization metric")
    secondary_metrics: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional benchmark metrics"
    )
    peak_vram_mb: Optional[float] = Field(None, description="Peak GPU memory in MB")
    training_seconds: Optional[float] = Field(None, description="Active training duration")
    total_seconds: Optional[float] = Field(None, description="Total execution time")
    started_at: Optional[datetime] = Field(None, description="Training start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Training end timestamp")
    changes_from_parent: Optional[str] = Field(None, description="Description of changes")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Validate that status is a valid ExperimentStatus enum value"""
        if v is None:
            return v
        valid_statuses = {s.value for s in ExperimentStatus}
        if v not in valid_statuses:
            raise ValueError(
                f"Invalid status '{v}'. Must be one of: {', '.join(valid_statuses)}"
            )
        return v


class ExperimentListResponse(BaseModel):
    """Response for listing experiments"""
    items: List[Experiment]
    total: int = Field(..., description="Total number of experiments matching filter")
    limit: int = Field(..., description="Page size used")
    offset: int = Field(..., description="Offset used")


# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(prefix="/api/v1/experiments", tags=["experiments"])

# Global store instance (will be initialized in main.py or passed as dependency)
_store: Optional[ExperimentStore] = None


def set_store(store: ExperimentStore) -> None:
    """Initialize the global experiment store (call this from main.py)"""
    global _store
    _store = store


def get_store() -> ExperimentStore:
    """Get the global experiment store"""
    if _store is None:
        raise RuntimeError("Experiment store not initialized. Call set_store() first.")
    return _store


# ============================================================================
# Route Handlers (ordered: specific routes first, then dynamic routes)
# ============================================================================

@router.get(
    "/best",
    response_model=Experiment,
    summary="Get best experiment",
    responses={
        200: {"description": "Best experiment retrieved successfully"},
        400: {"description": "Missing required run_tag parameter"},
        404: {"description": "No best experiment found for run_tag"},
    },
)
async def get_best_experiment(
    run_tag: str = Query(..., description="Run tag (required)"),
    primary_metric: str = Query(
        "val_loss",
        description="Metric to optimize (val_loss|val_bpb|primary_metric)"
    ),
) -> Experiment:
    """
    Get the best experiment for a given run.
    
    Returns the experiment with the lowest primary_metric value and
    status=KEEP for the specified run_tag.
    
    Args:
        run_tag: Run tag to search (required)
        primary_metric: Metric to minimize (default: val_loss)
    
    Returns:
        Best Experiment object (200 OK)
    
    Raises:
        400: If run_tag missing or invalid primary_metric
        404: If no KEEP experiment found for run_tag
    """
    store = get_store()
    
    try:
        experiment = store.get_best(run_tag=run_tag, primary_metric=primary_metric)
        
        if experiment is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"No best experiment found for run_tag '{run_tag}' "
                       f"(no experiments with status=KEEP)"
            )
        
        return experiment
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get best experiment: {str(e)}"
        )


@router.get(
    "/export",
    responses={
        200: {"description": "TSV file exported successfully"},
        400: {"description": "Missing required run_tag parameter"},
    },
)
async def export_experiments(
    run_tag: str = Query(..., description="Run tag to export (required)"),
    format: str = Query("tsv", description="Export format (only 'tsv' supported)"),
) -> StreamingResponse:
    """
    Export experiments as TSV (tab-separated values).
    
    Generates a TSV file with experiment metrics, suitable for analysis
    in Python, pandas, or Excel.
    
    Format (columns):
        commit_hash, val_loss, val_bpb, peak_vram_mb, status, description
    
    Args:
        run_tag: Run tag to export (required)
        format: Export format (only "tsv" supported for now)
    
    Returns:
        TSV file as StreamingResponse (200 OK)
    
    Raises:
        400: If run_tag missing or format not supported
    """
    if format != "tsv":
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{format}'. Only 'tsv' supported."
        )
    
    store = get_store()
    
    try:
        # Get all experiments for run_tag
        experiments = store.list(run_tag=run_tag, limit=999999, offset=0)
        
        # Build TSV content
        tsv_output = StringIO()
        
        # Write header
        tsv_output.write(
            "commit_hash\tval_loss\tval_bpb\tpeak_vram_mb\tstatus\tdescription\n"
        )
        
        # Write data rows
        for exp in experiments:
            commit_hash = exp.commit_hash or ""
            val_loss = str(exp.val_loss) if exp.val_loss is not None else ""
            val_bpb = str(exp.val_bpb) if exp.val_bpb is not None else ""
            peak_vram = str(exp.peak_vram_mb) if exp.peak_vram_mb is not None else ""
            status_val = exp.status.value
            description = exp.description
            
            tsv_output.write(
                f"{commit_hash}\t{val_loss}\t{val_bpb}\t{peak_vram}\t{status_val}\t{description}\n"
            )
        
        # Generate timestamp for filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"experiments_{run_tag}_{timestamp}.tsv"
        
        # Create streaming response
        return StreamingResponse(
            iter([tsv_output.getvalue()]),
            media_type="text/tab-separated-values",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to export experiments: {str(e)}"
        )


@router.post(
    "",
    response_model=Experiment,
    status_code=http_status.HTTP_201_CREATED,
    summary="Create new experiment",
    responses={
        201: {"description": "Experiment created successfully"},
        400: {"description": "Invalid input (missing required fields or invalid status)"},
    },
)
async def create_experiment(request: CreateExperimentRequest) -> Experiment:
    """
    Create a new experiment.
    
    Creates an experiment record with PENDING status. Used to start a new
    hyperparameter variant for autonomous experimentation.
    
    Args:
        request: Experiment creation request (run_tag, config, description required)
    
    Returns:
        Created Experiment object (201 Created)
    
    Raises:
        400: If required fields missing or invalid
    """
    store = get_store()
    
    try:
        experiment = store.create(
            run_tag=request.run_tag,
            config=request.config,
            description=request.description,
            parent_experiment_id=request.parent_experiment_id,
        )
        return experiment
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create experiment: {str(e)}"
        )


@router.get(
    "",
    response_model=ExperimentListResponse,
    summary="List experiments with filtering",
    responses={
        200: {"description": "Experiments retrieved successfully"},
        400: {"description": "Invalid query parameters"},
    },
)
async def list_experiments(
    run_tag: Optional[str] = Query(None, description="Filter by run_tag"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=1000, description="Page size (max 1000)"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> ExperimentListResponse:
    """
    List experiments with optional filtering and pagination.
    
    Returns experiments sorted by creation time (most recent first).
    
    Args:
        run_tag: Filter by run_tag (optional)
        status: Filter by status (pending|running|keep|discard|crash, optional)
        limit: Number of results per page (1-1000, default 100)
        offset: Pagination offset (default 0)
    
    Returns:
        ExperimentListResponse with items, total count, limit, offset
    
    Raises:
        400: If invalid status or limit/offset parameters
    """
    store = get_store()
    
    # Validate status parameter if provided
    if status is not None:
        valid_statuses = {s.value for s in ExperimentStatus}
        if status not in valid_statuses:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}"
            )
        status_enum = ExperimentStatus(status)
    else:
        status_enum = None
    
    try:
        experiments = store.list(
            run_tag=run_tag,
            status=status_enum,
            limit=limit,
            offset=offset,
        )
        
        # Get total count (for pagination metadata)
        all_experiments = store.list(run_tag=run_tag, status=status_enum, limit=999999, offset=0)
        total = len(all_experiments)
        
        return ExperimentListResponse(
            items=experiments,
            total=total,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list experiments: {str(e)}"
        )


@router.get(
    "/{experiment_id}",
    response_model=Experiment,
    summary="Get experiment details",
    responses={
        200: {"description": "Experiment retrieved successfully"},
        404: {"description": "Experiment not found"},
    },
)
async def get_experiment(experiment_id: str) -> Experiment:
    """
    Get experiment by ID.
    
    Retrieves the complete experiment record including config, metrics,
    and lifecycle information.
    
    Args:
        experiment_id: Experiment UUID
    
    Returns:
        Experiment object (200 OK)
    
    Raises:
        404: If experiment with id not found
    """
    store = get_store()
    
    experiment = store.get(experiment_id)
    if experiment is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Experiment {experiment_id} not found"
        )
    
    return experiment


@router.patch(
    "/{experiment_id}",
    response_model=Experiment,
    summary="Update experiment",
    responses={
        200: {"description": "Experiment updated successfully"},
        400: {"description": "Invalid input or invalid status"},
        404: {"description": "Experiment not found"},
    },
)
async def update_experiment(
    experiment_id: str,
    request: UpdateExperimentRequest,
) -> Experiment:
    """
    Update experiment status and metrics.
    
    Updates immutable experiment record with training results, metrics,
    and status decisions (KEEP, DISCARD, CRASH).
    
    Args:
        experiment_id: Experiment UUID
        request: Update request (all fields optional)
    
    Returns:
        Updated Experiment object (200 OK)
    
    Raises:
        400: If invalid status value
        404: If experiment not found
    """
    store = get_store()
    
    # Build kwargs from request, filtering out None values
    updates = {}
    for field, value in request.model_dump().items():
        if value is not None:
            updates[field] = value
    
    if not updates:
        # No updates provided, just return current
        experiment = store.get(experiment_id)
        if experiment is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Experiment {experiment_id} not found"
            )
        return experiment
    
    try:
        experiment = store.update(experiment_id, **updates)
        return experiment
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update experiment: {str(e)}"
        )
