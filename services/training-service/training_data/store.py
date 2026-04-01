"""
Training data store - abstraction over SQLite with validation & sanitization
"""

import uuid
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import CompletionEvent, TaskTrajectory, TrainingRun, EventType


class TrainingDataStore:
    """Handle training data collection, validation, and export"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.secret_patterns = [
            re.compile(r"api[_-]?key['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]+)['\"]?", re.IGNORECASE),
            re.compile(r"password['\"]?\s*[:=]\s*['\"]?([^'\"\\n]+)['\"]?", re.IGNORECASE),
            re.compile(r"token['\"]?\s*[:=]\s*['\"]?([a-zA-Z0-9_\-]+)['\"]?", re.IGNORECASE),
            re.compile(r"bearer\s+[a-zA-Z0-9_\-\.]+", re.IGNORECASE),
        ]
    
    def _sanitize_code(self, code: str) -> str:
        """Remove secrets and PII from code"""
        for pattern in self.secret_patterns:
            code = pattern.sub("[REDACTED]", code)
        # Remove email addresses
        code = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "[EMAIL_REDACTED]", code)
        # Remove common API URLs
        code = re.sub(r"https?://[^\s]+", "[URL_REDACTED]", code)
        return code
    
    def _validate_code(self, code: str, language: str) -> tuple[bool, Optional[str]]:
        """Validate code before storing"""
        if not code or len(code.strip()) == 0:
            return False, "Empty code"
        
        if len(code) > 50000:
            return False, "Code too long (>50KB)"
        
        # Basic syntax check per language
        if language == "python":
            if code.count("'") % 2 != 0 and code.count('"') % 2 != 0:
                return False, "Mismatched quotes (likely invalid)"
        
        return True, None
    
    def add_completion_event(
        self,
        event_type: str,
        prompt: str,
        completion: str,
        language: str,
        file_path: Optional[str] = None,
        model_id: Optional[str] = None,
        tokens_generated: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Add a completion event to the store"""
        
        # Validate
        valid, error = self._validate_code(prompt + completion, language)
        if not valid:
            raise ValueError(f"Invalid code: {error}")
        
        # Sanitize
        prompt_clean = self._sanitize_code(prompt)
        completion_clean = self._sanitize_code(completion)
        
        # Create event
        event_id = str(uuid.uuid4())
        event = CompletionEvent(
            id=event_id,
            event_type=EventType(event_type),
            prompt=prompt_clean,
            completion=completion_clean,
            language=language,
            file_path=file_path,
            model_id=model_id,
            tokens_generated=tokens_generated,
            temperature=temperature,
            top_p=top_p,
            metadata=metadata or {},
        )
        
        self.db.add(event)
        self.db.commit()
        
        return event_id
    
    def add_task_trajectory(
        self,
        task_id: str,
        task_description: str,
        steps: List[Dict[str, Any]],
        outcome: str,
        final_code: Optional[str] = None,
        error_message: Optional[str] = None,
        task_type: Optional[str] = None,
        num_steps: Optional[int] = None,
        execution_time_seconds: Optional[float] = None,
        tokens_consumed: Optional[int] = None,
    ) -> str:
        """Add a task trajectory to the store"""
        
        # Validate outcome
        if outcome not in ["success", "failure", "partial"]:
            raise ValueError(f"Invalid outcome: {outcome}")
        
        # Sanitize code
        final_code_clean = self._sanitize_code(final_code) if final_code else None
        
        # Create trajectory
        trajectory = TaskTrajectory(
            id=task_id,
            task_description=task_description,
            task_type=task_type,
            steps=steps,
            outcome=outcome,
            final_code=final_code_clean,
            error_message=error_message,
            num_steps=num_steps or len(steps),
            execution_time_seconds=execution_time_seconds,
            tokens_consumed=tokens_consumed,
        )
        
        self.db.add(trajectory)
        self.db.commit()
        
        return task_id
    
    def get_incremental_dataset(
        self,
        since: Optional[datetime] = None,
        max_samples: int = 1000,
        event_types: Optional[List[str]] = None,
        language_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch recent completion events for training"""
        
        query = self.db.query(CompletionEvent)
        
        if since:
            query = query.filter(CompletionEvent.created_at >= since)
        
        if event_types:
            query = query.filter(CompletionEvent.event_type.in_(event_types))
        else:
            # Default: only accepted/edited completions (not rejections)
            query = query.filter(
                CompletionEvent.event_type.in_([
                    EventType.COMPLETION_ACCEPTED,
                    EventType.COMPLETION_EDITED,
                ])
            )
        
        if language_filter:
            query = query.filter(CompletionEvent.language == language_filter)
        
        events = query.order_by(CompletionEvent.created_at.desc()).limit(max_samples).all()
        
        return [event.to_dict() for event in events]
    
    def get_all_dataset_since(
        self,
        since: Optional[datetime] = None,
        language_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch all training data (for full training cycle)"""
        
        query = self.db.query(CompletionEvent)
        
        if since:
            query = query.filter(CompletionEvent.created_at >= since)
        
        # Only successful completions
        query = query.filter(
            CompletionEvent.event_type.in_([
                EventType.COMPLETION_ACCEPTED,
                EventType.COMPLETION_EDITED,
            ])
        )
        
        if language_filter:
            query = query.filter(CompletionEvent.language == language_filter)
        
        events = query.order_by(CompletionEvent.created_at.asc()).all()
        
        return [event.to_dict() for event in events]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get training data statistics"""
        
        total_events = self.db.query(CompletionEvent).count()
        accepted = self.db.query(CompletionEvent).filter(
            CompletionEvent.event_type == EventType.COMPLETION_ACCEPTED
        ).count()
        rejected = self.db.query(CompletionEvent).filter(
            CompletionEvent.event_type == EventType.COMPLETION_REJECTED
        ).count()
        edited = self.db.query(CompletionEvent).filter(
            CompletionEvent.event_type == EventType.COMPLETION_EDITED
        ).count()
        
        tasks_total = self.db.query(TaskTrajectory).count()
        tasks_success = self.db.query(TaskTrajectory).filter(
            TaskTrajectory.outcome == "success"
        ).count()
        
        # Recent activity (last 24h)
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        recent = self.db.query(CompletionEvent).filter(
            CompletionEvent.created_at >= yesterday
        ).count()
        
        return {
            "total_events": total_events,
            "completion_accepted": accepted,
            "completion_rejected": rejected,
            "completion_edited": edited,
            "task_completed_total": tasks_total,
            "task_success_rate": tasks_success / tasks_total if tasks_total > 0 else 0,
            "recent_events_24h": recent,
        }
    
    def add_training_run(
        self,
        run_type: str,
        base_model_id: str,
        samples_used: int,
        train_size: int,
        eval_size: int,
    ) -> str:
        """Create a new training run record"""
        
        run_id = str(uuid.uuid4())
        run = TrainingRun(
            id=run_id,
            run_type=run_type,
            base_model_id=base_model_id,
            samples_used=samples_used,
            train_size=train_size,
            eval_size=eval_size,
            status="pending",
        )
        
        self.db.add(run)
        self.db.commit()
        
        return run_id
    
    def update_training_run(
        self,
        run_id: str,
        status: str = None,
        loss: float = None,
        eval_loss: float = None,
        duration_seconds: float = None,
        adapter_path: str = None,
        error_message: str = None,
    ):
        """Update training run with results"""
        
        run = self.db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            raise ValueError(f"Training run not found: {run_id}")
        
        if status:
            run.status = status
        if loss is not None:
            run.loss = loss
        if eval_loss is not None:
            run.eval_loss = eval_loss
        if duration_seconds is not None:
            run.duration_seconds = duration_seconds
        if adapter_path:
            run.adapter_path = adapter_path
        if error_message:
            run.error_message = error_message
        
        if status == "completed":
            run.completed_at = datetime.utcnow()
        
        self.db.commit()
    
    def get_training_run(self, run_id: str) -> Dict[str, Any]:
        """Get training run details"""
        
        run = self.db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            raise ValueError(f"Training run not found: {run_id}")
        
        return run.to_dict()
    
    def clear_old_events(self, days_old: int = 90):
        """Delete old training events (management task)"""
        
        cutoff = datetime.utcnow() - timedelta(days=days_old)
        deleted = self.db.query(CompletionEvent).filter(
            CompletionEvent.created_at < cutoff
        ).delete()
        
        self.db.commit()
        
        return deleted
