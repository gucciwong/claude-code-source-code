import re
from typing import List
from .models import TaskSpec
import uuid


class TaskDecomposer:
    """Decompose a high-level goal into atomic task specs."""

    def decompose(self, goal: str, context: str = "") -> List[TaskSpec]:
        """
        Heuristic decomposition: split on common patterns like
        'and', 'then', numbered steps, bullet points, semicolons.
        Returns at least 1 task (the goal itself if no split found).
        """
        tasks = []
        # Try to split on numbered items (1. ... 2. ...)
        numbered = re.findall(r'\d+[\.\)]\s+([^\d\n]+)', goal)
        if len(numbered) >= 2:
            for i, desc in enumerate(numbered):
                tasks.append(TaskSpec(
                    id=str(uuid.uuid4()),
                    title=f"Step {i+1}",
                    description=desc.strip(),
                    dependencies=[tasks[i-1].id] if i > 0 else []
                ))
            return tasks

        # Try bullet points
        bullets = re.findall(r'[-•*]\s+([^\n\-•*]+)', goal)
        if len(bullets) >= 2:
            for desc in bullets:
                task_id = str(uuid.uuid4())
                tasks.append(TaskSpec(id=task_id, title=desc.strip()[:50], description=desc.strip()))
            return tasks

        # Try splitting on " then " or " and then "
        parts = re.split(r'\s+(?:and\s+)?then\s+', goal, flags=re.IGNORECASE)
        if len(parts) >= 2:
            for i, part in enumerate(parts):
                tasks.append(TaskSpec(
                    id=str(uuid.uuid4()),
                    title=part.strip()[:50],
                    description=part.strip(),
                    dependencies=[tasks[i-1].id] if i > 0 else []
                ))
            return tasks

        # Fallback: single task
        return [TaskSpec(id=str(uuid.uuid4()), title=goal[:50], description=goal)]
