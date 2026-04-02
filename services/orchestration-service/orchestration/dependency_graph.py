from typing import List, Dict, Optional
from .models import TaskSpec


class DependencyGraph:
    """DAG of tasks with topological sort and cycle detection."""

    def __init__(self, tasks: List[TaskSpec]):
        self.tasks = {t.id: t for t in tasks}

    def has_cycle(self) -> bool:
        visited = set()
        rec_stack = set()

        def dfs(task_id: str) -> bool:
            visited.add(task_id)
            rec_stack.add(task_id)
            task = self.tasks.get(task_id)
            if not task:
                return False
            for dep in task.dependencies:
                if dep not in visited:
                    if dfs(dep):
                        return True
                elif dep in rec_stack:
                    return True
            rec_stack.discard(task_id)
            return False

        for tid in self.tasks:
            if tid not in visited:
                if dfs(tid):
                    return True
        return False

    def topological_order(self) -> List[str]:
        """Return task ids in topological order (dependencies first)."""
        visited = set()
        order = []

        def dfs(task_id: str):
            if task_id in visited:
                return
            visited.add(task_id)
            task = self.tasks.get(task_id)
            if task:
                for dep in task.dependencies:
                    dfs(dep)
            order.append(task_id)

        for tid in self.tasks:
            dfs(tid)
        return order

    def get_ready_tasks(self, completed_ids: set) -> List[str]:
        """Return task ids whose dependencies are all completed."""
        ready = []
        for tid, task in self.tasks.items():
            if tid in completed_ids:
                continue
            if all(dep in completed_ids for dep in task.dependencies):
                ready.append(tid)
        return ready
