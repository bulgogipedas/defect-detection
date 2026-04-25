from abc import ABC, abstractmethod
from typing import Any

import torch


class AnomalyDetector(ABC):
    """Protocol-style base for anomaly backends."""

    @abstractmethod
    def predict(self, image_tensor: torch.Tensor) -> dict[str, Any]:
        raise NotImplementedError
