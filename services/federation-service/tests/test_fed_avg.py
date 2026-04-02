import pytest
import numpy as np
from federation.fed_avg import FedAvgAggregator
from federation.differential_privacy import DifferentialPrivacy


@pytest.fixture
def aggregator():
    return FedAvgAggregator()


@pytest.fixture
def dp_aggregator():
    dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5)
    return FedAvgAggregator(dp=dp, apply_dp=True)


def test_aggregate_returns_empty_list_for_empty_updates(aggregator):
    result = aggregator.aggregate([])
    assert result == []


def test_aggregate_averages_two_equal_weight_updates(aggregator):
    updates = [
        {"gradients": [1.0, 2.0], "data_size": 100},
        {"gradients": [3.0, 4.0], "data_size": 100},
    ]
    result = aggregator.aggregate(updates)
    assert abs(result[0] - 2.0) < 1e-9
    assert abs(result[1] - 3.0) < 1e-9


def test_aggregate_weights_updates_by_data_size(aggregator):
    updates = [
        {"gradients": [0.0, 0.0], "data_size": 100},
        {"gradients": [4.0, 4.0], "data_size": 300},
    ]
    # Weighted avg: 0 * 0.25 + 4 * 0.75 = 3.0
    result = aggregator.aggregate(updates)
    assert abs(result[0] - 3.0) < 1e-9
    assert abs(result[1] - 3.0) < 1e-9


def test_aggregate_with_apply_dp_runs(dp_aggregator):
    updates = [
        {"gradients": [1.0, 2.0, 3.0], "data_size": 50},
    ]
    result = dp_aggregator.aggregate(updates)
    assert isinstance(result, list)
    assert len(result) == 3


def test_aggregate_returns_same_length_vector(aggregator):
    updates = [
        {"gradients": [1.0, 2.0, 3.0, 4.0, 5.0], "data_size": 100},
        {"gradients": [2.0, 3.0, 4.0, 5.0, 6.0], "data_size": 100},
    ]
    result = aggregator.aggregate(updates)
    assert len(result) == 5
