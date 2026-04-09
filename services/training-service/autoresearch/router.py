"""
Research Program API Routes (Phase 4.3 - Router)

Provides FastAPI routes for research program management:
- Create, list, retrieve, update research programs
- Start/stop experiment loops
- Query current loop status
- Manage program lifecycle

Routes (ordered: specific routes first, then dynamic routes):
    POST   /api/v1/research/programs              - Create new program
    GET    /api/v1/research/programs              - List programs
    GET    /api/v1/research/programs/presets      - Get default programs
    GET    /api/v1/research/programs/{id}         - Get program details
    PATCH  /api/v1/research/programs/{id}         - Update status
    DELETE /api/v1/research/programs/{id}         - Delete program
    POST   /api/v1/research/programs/{id}/start   - Start experiment loop
    POST   /api/v1/research/programs/{id}/stop    - Stop experiment loop
    GET    /api/v1/research/programs/{id}/status  - Current loop status
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status
from pydantic import BaseModel, Field, field_validator

from .program import ResearchProgram, SearchDimension, DEFAULT_PROGRAMS
from .store import ResearchProgramStore


# ============================================================================
# Pydantic Request/Response Models
# ============================================================================

class SearchDimensionSchema(BaseModel):
    """Schema for search dimension in request/response"""
    name: str
    type: str
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    options: Optional[List[Any]] = None
    current: Any


class CreateResearchProgramRequest(BaseModel):
    """Request to create a new research program"""
    run_tag: str = Field(..., description="Run identifier (e.g., 'autoresearch/jun15')")
    goal: str = Field(..., description="Research goal (what we're optimizing for)")
    description: Optional[str] = Field(
        None,
        description="Longer explanation of research goals"
    )
    primary_metric: str = Field(..., description="Metric to optimize (e.g., val_loss)")
    time_budget_seconds: int = Field(
        600,
        description="Time budget per experiment in seconds"
    )
    max_experiments: Optional[int] = Field(
        None,
        description="Max experiments (None = unlimited)"
    )
    base_model: str = Field(..., description="Base model ID (HuggingFace)")
    dataset_path: str = Field(..., description="Training data location")
    search_dimensions: List[SearchDimensionSchema] = Field(
        ...,
        description="Hyperparameters to search over"
    )
    max_vram_mb: Optional[float] = Field(None, description="VRAM constraint (MB)")
    simplicity_preference: float = Field(
        0.5,
        description="Preference for simpler configs (0.0-1.0)"
    )
    strategy: str = Field(
        "random",
        description="Search strategy: random, sequential, bayesian, agent"
    )
    
    @field_validator('strategy')
    @classmethod
    def validate_strategy(cls, v: str) -> str:
        """Validate strategy value"""
        valid = ["random", "sequential", "bayesian", "agent"]
        if v not in valid:
            raise ValueError(f"strategy must be one of {valid}, got {v}")
        return v


class UpdateResearchProgramRequest(BaseModel):
    """Request to update program status/metadata"""
    status: Optional[str] = Field(
        None,
        description="Status: pending, running, completed, stopped"
    )
    experiments_completed: Optional[int] = Field(
        None,
        description="Number of experiments completed"
    )
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate that status is a valid value"""
        if v is None:
            return v
        valid_statuses = ["pending", "running", "completed", "stopped"]
        if v not in valid_statuses:
            raise ValueError(
                f"Invalid status '{v}'. Must be one of: {', '.join(valid_statuses)}"
            )
        return v


class ResearchProgramResponse(BaseModel):
    """Response model for research program"""
    id: str
    run_tag: str
    goal: str
    description: str
    primary_metric: str
    time_budget_seconds: int
    max_experiments: Optional[int]
    base_model: str
    dataset_path: str
    search_dimensions: List[SearchDimensionSchema]
    max_vram_mb: Optional[float]
    simplicity_preference: float
    strategy: str
    status: str
    experiments_completed: int
    created_at: str


class ResearchProgramListResponse(BaseModel):
    """Response for listing research programs"""
    items: List[ResearchProgramResponse]
    total: int = Field(..., description="Total number of programs")
    limit: int = Field(..., description="Page size used")
    offset: int = Field(..., description="Offset used")


class StatusResponse(BaseModel):
    """Response for status endpoint"""
    status: str


# ============================================================================
# Router Setup
# ============================================================================

router = APIRouter(prefix="/api/v1/research", tags=["research"])


@router.get(
    "/health",
    summary="Research service health check",
)
async def research_health() -> dict:
    """Health check for the research program service.

    Returns OK if the research API is reachable and the store is initialized.
    """
    store_ok = _store is not None
    return {
        "status": "ok" if store_ok else "degraded",
        "store_initialized": store_ok,
    }


# Global store instance (will be initialized in main.py)
_store: Optional[ResearchProgramStore] = None


def set_store(store: ResearchProgramStore) -> None:
    """Initialize the global research program store (call this from main.py)"""
    global _store
    _store = store


def get_store() -> ResearchProgramStore:
    """Get the global research program store"""
    if _store is None:
        raise RuntimeError(
            "Research program store not initialized. Call set_store() first."
        )
    return _store


def _program_to_response(program: ResearchProgram) -> ResearchProgramResponse:
    """Convert ResearchProgram to response schema"""
    return ResearchProgramResponse(
        id=program.id,
        run_tag=program.run_tag,
        goal=program.goal,
        description=program.description,
        primary_metric=program.primary_metric,
        time_budget_seconds=program.time_budget_seconds,
        max_experiments=program.max_experiments,
        base_model=program.base_model,
        dataset_path=program.dataset_path,
        search_dimensions=[
            SearchDimensionSchema(
                name=d.name,
                type=d.type,
                min_val=d.min_val,
                max_val=d.max_val,
                options=d.options,
                current=d.current
            )
            for d in program.search_dimensions
        ],
        max_vram_mb=program.max_vram_mb,
        simplicity_preference=program.simplicity_preference,
        strategy=program.strategy,
        status=program.status,
        experiments_completed=program.experiments_completed,
        created_at=program.created_at.isoformat()
    )


# ============================================================================
# Route Handlers (ordered: most specific first, then general)
# ============================================================================

@router.post(
    "/programs",
    response_model=ResearchProgramResponse,
    status_code=http_status.HTTP_201_CREATED,
    summary="Create new research program",
    responses={
        201: {"description": "Program created successfully"},
        400: {"description": "Invalid input"},
        422: {"description": "Validation error"},
    },
)
async def create_research_program(
    request: CreateResearchProgramRequest
) -> ResearchProgramResponse:
    """
    Create a new research program.
    
    Programs define the research goals, constraints, and hyperparameter search space.
    Created programs start with status=pending.
    
    Args:
        request: Program creation request with goals and search space
    
    Returns:
        Created ResearchProgram object (201 Created)
    
    Raises:
        422: If required fields missing or validation fails
        400: If creation fails for other reasons
    """
    try:
        store = get_store()
        
        # Convert request to ResearchProgram
        program = ResearchProgram(
            run_tag=request.run_tag,
            goal=request.goal,
            description=request.description or "",
            primary_metric=request.primary_metric,
            time_budget_seconds=request.time_budget_seconds,
            max_experiments=request.max_experiments,
            base_model=request.base_model,
            dataset_path=request.dataset_path,
            search_dimensions=[
                SearchDimension(
                    name=d.name,
                    type=d.type,
                    min_val=d.min_val,
                    max_val=d.max_val,
                    options=d.options,
                    current=d.current
                )
                for d in request.search_dimensions
            ],
            max_vram_mb=request.max_vram_mb,
            simplicity_preference=request.simplicity_preference,
            strategy=request.strategy,
        )
        
        created = store.create(program)
        return _program_to_response(created)
    
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create program: {str(e)}"
        )


@router.get(
    "/programs/presets",
    summary="Get default preset programs",
    responses={
        200: {"description": "Preset programs retrieved successfully"},
    },
)
async def get_preset_programs() -> Dict[str, ResearchProgramResponse]:
    """
    Get default preset research programs.
    
    Returns commonly-used research program presets (e.g., quick-explore, overnight-run).
    These can be used as templates for new research runs.
    
    Returns:
        Dict of preset name → ResearchProgram (200 OK)
    
    Example:
        ```json
        {
          "quick-explore": { ... },
          "overnight-run": { ... }
        }
        ```
    """
    return {
        name: _program_to_response(program)
        for name, program in DEFAULT_PROGRAMS.items()
    }


@router.get(
    "/programs",
    response_model=ResearchProgramListResponse,
    summary="List research programs",
    responses={
        200: {"description": "Programs listed successfully"},
        400: {"description": "Invalid pagination parameters"},
    },
)
async def list_research_programs(
    limit: int = Query(100, ge=1, le=1000, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> ResearchProgramListResponse:
    """
    List all research programs with pagination.
    
    Returns programs sorted by creation date (newest first).
    
    Args:
        limit: Maximum results per page (1-1000, default 100)
        offset: Pagination offset (default 0)
    
    Returns:
        List of programs with pagination metadata (200 OK)
    """
    try:
        store = get_store()
        
        programs = store.list(limit=limit, offset=offset)
        total_count = store.get_total_count()
        
        return ResearchProgramListResponse(
            items=[_program_to_response(p) for p in programs],
            total=total_count,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list programs: {str(e)}"
        )


@router.get(
    "/programs/{program_id}",
    response_model=ResearchProgramResponse,
    summary="Get program details",
    responses={
        200: {"description": "Program retrieved successfully"},
        404: {"description": "Program not found"},
    },
)
async def get_research_program(program_id: str) -> ResearchProgramResponse:
    """
    Get details of a specific research program.
    
    Args:
        program_id: The program UUID
    
    Returns:
        ResearchProgram details (200 OK)
    
    Raises:
        404: If program not found
    """
    store = get_store()
    
    program = store.get(program_id)
    if program is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Research program '{program_id}' not found"
        )
    
    return _program_to_response(program)


@router.patch(
    "/programs/{program_id}",
    response_model=ResearchProgramResponse,
    summary="Update program status",
    responses={
        200: {"description": "Program updated successfully"},
        400: {"description": "Invalid status value"},
        404: {"description": "Program not found"},
    },
)
async def update_research_program(
    program_id: str,
    request: UpdateResearchProgramRequest
) -> ResearchProgramResponse:
    """
    Update a research program's status and metadata.
    
    Only status and experiments_completed can be updated.
    The search space (search_dimensions) is immutable once created.
    
    Args:
        program_id: The program ID
        request: Update request (status and/or experiments_completed)
    
    Returns:
        Updated ResearchProgram (200 OK)
    
    Raises:
        400: If invalid status value
        404: If program not found
    """
    try:
        store = get_store()
        
        # Build update dict from non-None fields
        update_data = {}
        if request.status is not None:
            update_data["status"] = request.status
        if request.experiments_completed is not None:
            update_data["experiments_completed"] = request.experiments_completed
        
        if not update_data:
            # No fields to update, return current state
            program = store.get(program_id)
            if program is None:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail=f"Research program '{program_id}' not found"
                )
            return _program_to_response(program)
        
        updated = store.update(program_id, **update_data)
        return _program_to_response(updated)
    
    except ValueError as e:
        if "not found" in str(e).lower():
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
            detail=f"Failed to update program: {str(e)}"
        )


@router.delete(
    "/programs/{program_id}",
    status_code=http_status.HTTP_200_OK,
    summary="Delete research program",
    responses={
        200: {"description": "Program deleted successfully"},
        404: {"description": "Program not found"},
    },
)
async def delete_research_program(program_id: str) -> Dict[str, str]:
    """
    Delete a research program.
    
    Args:
        program_id: The program ID
    
    Returns:
        Confirmation message (200 OK)
    
    Raises:
        404: If program not found
    """
    try:
        store = get_store()
        store.delete(program_id)
        
        return {"message": f"Program '{program_id}' deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete program: {str(e)}"
        )


@router.post(
    "/programs/{program_id}/start",
    response_model=ResearchProgramResponse,
    summary="Start experiment loop",
    responses={
        200: {"description": "Loop started successfully"},
        404: {"description": "Program not found"},
    },
)
async def start_experiment_loop(program_id: str) -> ResearchProgramResponse:
    """
    Start the autonomous experiment loop for a research program.
    
    Changes program status from pending to running.
    
    Args:
        program_id: The program ID
    
    Returns:
        Updated ResearchProgram with status=running (200 OK)
    
    Raises:
        404: If program not found
    """
    try:
        store = get_store()
        
        updated = store.update(program_id, status="running")
        return _program_to_response(updated)
    
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to start experiment loop: {str(e)}"
        )


@router.post(
    "/programs/{program_id}/stop",
    response_model=ResearchProgramResponse,
    summary="Stop experiment loop",
    responses={
        200: {"description": "Loop stopped successfully"},
        404: {"description": "Program not found"},
    },
)
async def stop_experiment_loop(program_id: str) -> ResearchProgramResponse:
    """
    Stop the autonomous experiment loop for a research program.
    
    Changes program status to stopped (from running or other state).
    
    Args:
        program_id: The program ID
    
    Returns:
        Updated ResearchProgram with status=stopped (200 OK)
    
    Raises:
        404: If program not found
    """
    try:
        store = get_store()
        
        updated = store.update(program_id, status="stopped")
        return _program_to_response(updated)
    
    except ValueError as e:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to stop experiment loop: {str(e)}"
        )


@router.get(
    "/programs/{program_id}/status",
    response_model=StatusResponse,
    summary="Get experiment loop status",
    responses={
        200: {"description": "Status retrieved successfully"},
        404: {"description": "Program not found"},
    },
)
async def get_loop_status(program_id: str) -> StatusResponse:
    """
    Get the current experiment loop status for a research program.
    
    Args:
        program_id: The program ID
    
    Returns:
        Current status (pending, running, completed, or stopped) (200 OK)
    
    Raises:
        404: If program not found
    """
    store = get_store()
    
    program = store.get(program_id)
    if program is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Research program '{program_id}' not found"
        )
    
    return StatusResponse(status=program.status)
