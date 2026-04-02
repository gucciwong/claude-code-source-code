import numpy as np
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .differential_privacy import DifferentialPrivacy


class FedAvgAggregator:
    """
    Federated Averaging: weighted average of gradients based on data_size.
    Optionally applies Differential Privacy noise.
    """

    def __init__(self, dp: 'DifferentialPrivacy' = None, apply_dp: bool = False):
        self._dp = dp
        self._apply_dp = apply_dp

    def aggregate(self, updates: List[dict]) -> List[float]:
        """
        updates: list of dicts with 'gradients' (List[float]) and 'data_size' (int)
        Returns weighted-averaged gradient vector.
        """
        if not updates:
            return []
        total_data = sum(u["data_size"] for u in updates)
        if total_data == 0:
            return updates[0]["gradients"]

        grad_len = len(updates[0]["gradients"])
        result = np.zeros(grad_len)

        for update in updates:
            w = update["data_size"] / total_data
            arr = np.array(update["gradients"])
            result += w * arr

        final = result.tolist()

        if self._apply_dp and self._dp:
            clipped = self._dp.clip_gradients(final)
            final = self._dp.add_noise(clipped)

        return final
