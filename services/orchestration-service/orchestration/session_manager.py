import uuid
import time
from typing import Dict, Optional
from .models import OrchestratorSession, TaskSpec, TaskStatus
from .task_decomposer import TaskDecomposer
from .dependency_graph import DependencyGraph
from .result_merger import ResultMerger


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, OrchestratorSession] = {}
        self._decomposer = TaskDecomposer()
        self._merger = ResultMerger()

    def create_session(self, goal: str, context: str = "") -> OrchestratorSession:
        session_id = str(uuid.uuid4())
        tasks = self._decomposer.decompose(goal, context)
        session = OrchestratorSession(
            id=session_id,
            goal=goal,
            context=context,
            tasks=tasks,
            status=TaskStatus.PENDING,
            created_at=time.time()
        )
        self._sessions[session_id] = session
        # Simulate running: mark tasks as completed with stub results
        self._run_session(session)
        return session

    def _run_session(self, session: OrchestratorSession):
        """Simulate task execution (stub: all tasks complete successfully)."""
        graph = DependencyGraph(session.tasks)
        if graph.has_cycle():
            session.status = TaskStatus.FAILED
            return

        completed_ids: set = set()
        session.status = TaskStatus.RUNNING

        for task_id in graph.topological_order():
            task = next((t for t in session.tasks if t.id == task_id), None)
            if task:
                task.status = TaskStatus.RUNNING
                # Stub: generate a placeholder result
                task.result = f"Completed: {task.description[:100]}"
                task.status = TaskStatus.COMPLETED
                completed_ids.add(task_id)

        session.merged_result = self._merger.merge(session.tasks)
        session.status = TaskStatus.COMPLETED
        session.completed_at = time.time()

    def get_session(self, session_id: str) -> Optional[OrchestratorSession]:
        return self._sessions.get(session_id)

    def cancel_session(self, session_id: str) -> bool:
        session = self._sessions.get(session_id)
        if session and session.status in (TaskStatus.PENDING, TaskStatus.RUNNING):
            session.status = TaskStatus.CANCELLED
            return True
        return False

    def list_sessions(self) -> list:
        return list(self._sessions.values())
