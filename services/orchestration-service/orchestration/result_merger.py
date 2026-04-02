from typing import List, Dict
from .models import TaskSpec, TaskStatus


class ResultMerger:
    """Assembles partial task results into a coherent final output."""

    def merge(self, tasks: List[TaskSpec]) -> str:
        """Merge all completed task results into a structured summary."""
        completed = [t for t in tasks if t.status == TaskStatus.COMPLETED and t.result]
        failed = [t for t in tasks if t.status == TaskStatus.FAILED]

        parts = []
        if completed:
            parts.append("## Completed Tasks\n")
            for task in completed:
                parts.append(f"### {task.title}\n{task.result}\n")

        if failed:
            parts.append("## Failed Tasks\n")
            for task in failed:
                parts.append(f"- {task.title}: {task.error or 'Unknown error'}\n")

        return "\n".join(parts) if parts else "No results available."
