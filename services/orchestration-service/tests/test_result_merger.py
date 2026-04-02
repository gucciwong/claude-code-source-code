import pytest
from orchestration.result_merger import ResultMerger
from orchestration.models import TaskSpec, TaskStatus


def make_completed(tid: str, title: str, result: str) -> TaskSpec:
    return TaskSpec(id=tid, title=title, description="desc", status=TaskStatus.COMPLETED, result=result)


def make_failed(tid: str, title: str, error: str = "Oops") -> TaskSpec:
    return TaskSpec(id=tid, title=title, description="desc", status=TaskStatus.FAILED, error=error)


def make_pending(tid: str, title: str) -> TaskSpec:
    return TaskSpec(id=tid, title=title, description="desc", status=TaskStatus.PENDING)


def test_merge_all_completed():
    merger = ResultMerger()
    tasks = [
        make_completed("t1", "Init", "Initialized"),
        make_completed("t2", "Build", "Built"),
    ]
    result = merger.merge(tasks)
    assert "Completed Tasks" in result
    assert "Initialized" in result
    assert "Built" in result


def test_merge_mixed_completed_and_failed():
    merger = ResultMerger()
    tasks = [
        make_completed("t1", "Init", "Initialized"),
        make_failed("t2", "Build", "Build failed"),
    ]
    result = merger.merge(tasks)
    assert "Completed Tasks" in result
    assert "Failed Tasks" in result
    assert "Build failed" in result


def test_merge_only_failed():
    merger = ResultMerger()
    tasks = [make_failed("t1", "Alpha", "error A")]
    result = merger.merge(tasks)
    assert "Failed Tasks" in result
    assert "error A" in result
    assert "Completed Tasks" not in result


def test_merge_no_tasks_returns_no_results():
    merger = ResultMerger()
    result = merger.merge([])
    assert result == "No results available."


def test_merge_output_contains_task_titles():
    merger = ResultMerger()
    tasks = [
        make_completed("t1", "MySpecialTitle", "done"),
    ]
    result = merger.merge(tasks)
    assert "MySpecialTitle" in result
