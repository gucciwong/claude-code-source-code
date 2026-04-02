import pytest
import math
from federation.differential_privacy import DifferentialPrivacy


@pytest.fixture
def dp():
    return DifferentialPrivacy(epsilon=1.0, delta=1e-5, sensitivity=1.0)


def test_compute_sigma_returns_positive_float(dp):
    sigma = dp.compute_sigma()
    assert isinstance(sigma, float)
    assert sigma > 0


def test_add_noise_returns_list_of_same_length(dp):
    grads = [1.0, 2.0, 3.0]
    noisy = dp.add_noise(grads)
    assert isinstance(noisy, list)
    assert len(noisy) == len(grads)


def test_add_noise_changes_gradient_values(dp):
    """With high probability, at least one gradient should change with noise."""
    grads = [1.0, 2.0, 3.0, 4.0, 5.0]
    noisy = dp.add_noise(grads)
    # With Gaussian noise, probability of exactly 0 noise is effectively 0
    assert grads != noisy


def test_clip_gradients_clips_vector_exceeding_max_norm(dp):
    import numpy as np
    grads = [3.0, 4.0]  # norm = 5.0
    clipped = dp.clip_gradients(grads, max_norm=1.0)
    arr = np.array(clipped)
    norm = float(np.linalg.norm(arr))
    assert norm <= 1.0 + 1e-9


def test_clip_gradients_does_not_change_vector_within_max_norm(dp):
    grads = [0.3, 0.4]  # norm = 0.5
    clipped = dp.clip_gradients(grads, max_norm=1.0)
    assert abs(clipped[0] - 0.3) < 1e-9
    assert abs(clipped[1] - 0.4) < 1e-9


def test_add_noise_with_zero_length_list_returns_empty(dp):
    result = dp.add_noise([])
    assert result == []
