import pytest
import uuid
from orchestration.task_decomposer import TaskDecomposer
from orchestration.models import TaskSpec


@pytest.fixture
def decomposer():
    return TaskDecomposer()


def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(val)
        return True
    except ValueError:
        return False


def test_decompose_numbered_list(decomposer):
    goal = "1. Set up the database 2. Create API endpoints 3. Write tests"
    tasks = decomposer.decompose(goal)
    assert len(tasks) >= 2
    assert tasks[0].title == "Step 1"
    assert tasks[1].title == "Step 2"


def test_decompose_bulleted_goal(decomposer):
    goal = "- Install dependencies\n- Configure environment\n- Run the server"
    tasks = decomposer.decompose(goal)
    assert len(tasks) >= 2
    assert any("Install" in t.description for t in tasks)
    assert any("Configure" in t.description for t in tasks)


def test_decompose_then_separated(decomposer):
    goal = "Fetch the data then process it then save to disk"
    tasks = decomposer.decompose(goal)
    assert len(tasks) == 3
    assert "Fetch" in tasks[0].description
    assert "process" in tasks[1].description
    assert "save" in tasks[2].description


def test_decompose_single_step(decomposer):
    goal = "Write a summary of the report"
    tasks = decomposer.decompose(goal)
    assert len(tasks) == 1
    assert tasks[0].description == goal


def test_task_ids_are_unique_uuids(decomposer):
    goal = "Step 1: do this 2. do that 3. do another thing"
    tasks = decomposer.decompose(goal)
    ids = [t.id for t in tasks]
    assert len(ids) == len(set(ids)), "All task ids must be unique"
    for tid in ids:
        assert is_valid_uuid(tid), f"{tid} is not a valid UUID"


def test_dependencies_set_for_sequential_numbered_tasks(decomposer):
    goal = "1. Initialize repo 2. Add dependencies 3. Configure CI"
    tasks = decomposer.decompose(goal)
    assert len(tasks) == 3
    # First task has no deps
    assert tasks[0].dependencies == []
    # Second depends on first
    assert tasks[1].dependencies == [tasks[0].id]
    # Third depends on second
    assert tasks[2].dependencies == [tasks[1].id]


def test_title_truncated_to_50_chars(decomposer):
    long_goal = "A" * 100
    tasks = decomposer.decompose(long_goal)
    for task in tasks:
        assert len(task.title) <= 50


def test_empty_context_still_works(decomposer):
    goal = "Do something useful"
    tasks = decomposer.decompose(goal, context="")
    assert len(tasks) >= 1
    assert tasks[0].description == goal
