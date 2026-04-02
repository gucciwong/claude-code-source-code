import math
import numpy as np


class DifferentialPrivacy:
    """Gaussian noise DP-SGD mechanism."""

    def __init__(self, epsilon: float = 1.0, delta: float = 1e-5, sensitivity: float = 1.0):
        self.epsilon = epsilon
        self.delta = delta
        self.sensitivity = sensitivity

    def compute_sigma(self) -> float:
        """Compute noise standard deviation from epsilon/delta."""
        sigma = self.sensitivity * math.sqrt(2 * math.log(1.25 / self.delta)) / self.epsilon
        return sigma

    def add_noise(self, gradients: list) -> list:
        """Add Gaussian noise to gradients."""
        if not gradients:
            return []
        arr = np.array(gradients, dtype=float)
        sigma = self.compute_sigma()
        noise = np.random.normal(0, sigma, arr.shape)
        return (arr + noise).tolist()

    def clip_gradients(self, gradients: list, max_norm: float = 1.0) -> list:
        """Clip gradient vector to max_norm."""
        arr = np.array(gradients, dtype=float)
        norm = np.linalg.norm(arr)
        if norm > max_norm:
            arr = arr * (max_norm / norm)
        return arr.tolist()
