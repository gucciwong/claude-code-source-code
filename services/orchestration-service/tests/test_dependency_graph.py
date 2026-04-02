import pytest
from orchestration.dependency_graph import DependencyGraph
from orchestration.models import TaskSpec, TaskStatus


def make_task(tid: str, deps: list = None) -> TaskSpec:
    return TaskSpec(id=tid, title=tid, description=tid, dependencies=deps or [])


def test_no_cycle_in_linear_chain():
    t1 = make_task("t1")
    t2 = make_task("t2", ["t1"])
    t3 = make_task("t3", ["t2"])
    graph = DependencyGraph([t1, t2, t3])
    assert graph.has_cycle() is False


def test_cycle_detected_in_circular_deps():
    t1 = make_task("t1", ["t3"])
    t2 = make_task("t2", ["t1"])
    t3 = make_task("t3", ["t2"])
    graph = DependencyGraph([t1, t2, t3])
    assert graph.has_cycle() is True


def test_topological_order_respects_deps():
    t1 = make_task("t1")
    t2 = make_task("t2", ["t1"])
    t3 = make_task("t3", ["t2"])
    graph = DependencyGraph([t3, t2, t1])  # intentionally unordered
    order = graph.topological_order()
    assert order.index("t1") < order.index("t2")
    assert order.index("t2") < order.index("t3")


def test_get_ready_tasks_no_completed_returns_only_nodep_tasks():
    t1 = make_task("t1")
    t2 = make_task("t2", ["t1"])
    t3 = make_task("t3")
    graph = DependencyGraph([t1, t2, t3])
    ready = graph.get_ready_tasks(set())
    assert set(ready) == {"t1", "t3"}
    assert "t2" not in ready


def test_get_ready_tasks_after_some_complete_returns_newly_unblocked():
    t1 = make_task("t1")
    t2 = make_task("t2", ["t1"])
    t3 = make_task("t3", ["t2"])
    graph = DependencyGraph([t1, t2, t3])
    ready = graph.get_ready_tasks({"t1"})
    assert "t2" in ready
    assert "t3" not in ready


def test_single_task_no_deps_in_topological_order():
    t1 = make_task("t1")
    graph = DependencyGraph([t1])
    order = graph.topological_order()
    assert order == ["t1"]


def test_empty_graph_returns_empty_order():
    graph = DependencyGraph([])
    assert graph.topological_order() == []
