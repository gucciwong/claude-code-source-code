"""
Training data store - abstraction over SQLite with validation & sanitization
"""

import uuid
import re
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import CompletionEvent, TaskTrajectory, TrainingRun, ChatMessage, EventType


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
        # §3.1 KPI envelope
        event_name: Optional[str] = None,
        event_version: Optional[str] = None,
        correlation_id: Optional[str] = None,
        session_id: Optional[str] = None,
        installation_id_hash: Optional[str] = None,
        project_id_hash: Optional[str] = None,
        client_version: Optional[str] = None,
        platform: Optional[str] = None,
        runtime_backend: Optional[str] = None,
        # §3.2 Completion-specific
        completion_type: Optional[str] = None,
        suggestion_length_tokens: Optional[int] = None,
        accepted_boolean: Optional[bool] = None,
        edit_distance_after_accept: Optional[int] = None,
        # §3.2 Inference-specific
        first_token_latency_ms: Optional[float] = None,
        tokens_per_second: Optional[float] = None,
        backend_name: Optional[str] = None,
        model_quantization: Optional[str] = None,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        error_message: Optional[str] = None,
    ) -> str:
        """Add a completion or inference event to the store"""
        
        # Validate (skip for pure inference events that have no meaningful code)
        is_inference = event_type.startswith("inference_")
        if not is_inference:
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
            event_metadata=metadata or {},
            # KPI envelope
            event_name=event_name or event_type,
            event_version=event_version or "1.0",
            correlation_id=correlation_id,
            session_id=session_id,
            installation_id_hash=installation_id_hash,
            project_id_hash=project_id_hash,
            client_version=client_version,
            platform=platform,
            runtime_backend=runtime_backend,
            # Completion-specific
            completion_type=completion_type,
            suggestion_length_tokens=suggestion_length_tokens,
            accepted_boolean=accepted_boolean,
            edit_distance_after_accept=edit_distance_after_accept,
            # Inference-specific
            first_token_latency_ms=first_token_latency_ms,
            tokens_per_second=tokens_per_second,
            backend_name=backend_name,
            model_quantization=model_quantization,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            error_message=error_message,
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
        now = datetime.now(timezone.utc)
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
            run.completed_at = datetime.now(timezone.utc)
        
        self.db.commit()
    
    def get_training_run(self, run_id: str) -> Dict[str, Any]:
        """Get training run details"""
        
        run = self.db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            raise ValueError(f"Training run not found: {run_id}")
        
        return run.to_dict()
    
    def clear_old_events(self, days_old: int = 90):
        """Delete old training events (management task)"""

        cutoff = datetime.now(timezone.utc) - timedelta(days=days_old)
        deleted = self.db.query(CompletionEvent).filter(
            CompletionEvent.created_at < cutoff
        ).delete()

        self.db.commit()

        return deleted

    def add_chat_message(
        self,
        role: str,
        content: str,
        session_id: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> str:
        """Add a chat message to the store."""
        if role not in ("user", "assistant"):
            raise ValueError(f"Invalid role: {role}. Must be 'user' or 'assistant'.")

        message_id = str(uuid.uuid4())
        message = ChatMessage(
            id=message_id,
            session_id=session_id,
            role=role,
            content=self._sanitize_code(content) if role == "assistant" else content,
            model_id=model_id,
        )

        self.db.add(message)
        self.db.commit()

        return message_id

    def add_chat_messages_batch(self, messages: List[Dict[str, Any]]) -> int:
        """Add multiple chat messages in batch. Returns count of added messages."""
        if not messages:
            return 0

        ids = []
        for msg in messages:
            role = msg.get("role", "")
            if role not in ("user", "assistant"):
                continue

            message_id = str(uuid.uuid4())
            content = msg.get("content", "")
            message = ChatMessage(
                id=message_id,
                session_id=msg.get("session_id"),
                role=role,
                content=self._sanitize_code(content) if role == "assistant" else content,
                model_id=msg.get("model_id"),
            )
            self.db.add(message)
            ids.append(message_id)

        self.db.commit()
        return len(ids)

    def get_chat_conversations(
        self,
        max_pairs: int = 500,
    ) -> List[Dict[str, Any]]:
        """Get user-assistant message pairs for training.

        Returns pairs where a user message is followed by an assistant message
        in the same session, ordered by recency.
        """
        # Get all messages ordered by created_at
        all_messages = (
            self.db.query(ChatMessage)
            .order_by(ChatMessage.session_id, ChatMessage.created_at)
            .all()
        )

        pairs = []
        for i in range(len(all_messages) - 1):
            current = all_messages[i]
            next_msg = all_messages[i + 1]

            # Check if same session and user->assistant transition
            if (
                current.session_id == next_msg.session_id
                and current.role == "user"
                and next_msg.role == "assistant"
            ):
                pairs.append({
                    "prompt": current.content,
                    "completion": next_msg.content,
                    "session_id": current.session_id,
                })
                if len(pairs) >= max_pairs:
                    break

        return pairs

    def get_chat_message_count(self) -> int:
        """Get total number of chat messages stored."""
        return self.db.query(ChatMessage).count()
