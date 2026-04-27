"""
PatchCore-style anomaly scoring: memory bank of normal patch features, k-NN distance at inference.
Simplified: global pooled features from WideResNet50 (no per-patch map) for smaller RAM on M1.
"""

import pickle
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from sklearn.neighbors import NearestNeighbors
from torchvision.models import Wide_ResNet50_2_Weights, wide_resnet50_2


def _get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class PatchCore:
    def __init__(self, device: torch.device | None = None):
        self.device = device or _get_device()
        self.backbone = self._build_backbone()
        self.memory_bank: np.ndarray | None = None
        self.knn: NearestNeighbors | None = None
        self.threshold: float = 0.0
        self.n_neighbors: int = 9
        self.distance_metric: str = "euclidean"
        self.score_reduction: str = "mean"

    def _build_backbone(self) -> nn.Module:
        model = wide_resnet50_2(weights=Wide_ResNet50_2_Weights.IMAGENET1K_V1)
        model = nn.Sequential(*list(model.children())[:-2])
        return model.eval().to(self.device)

    def fit(
        self,
        normal_images: list[torch.Tensor],
        threshold_percentile: int = 95,
        n_neighbors: int = 9,
        distance_metric: str = "euclidean",
        score_reduction: str = "mean",
    ) -> None:
        features: list[np.ndarray] = []
        with torch.no_grad():
            for img in normal_images:
                feat = self.backbone(img.unsqueeze(0).to(self.device))
                pooled = torch.nn.functional.adaptive_avg_pool2d(feat, (1, 1))
                features.append(pooled.cpu().numpy().reshape(-1))

        self.memory_bank = np.array(features)
        self.n_neighbors = max(1, int(n_neighbors))
        self.distance_metric = distance_metric
        self.score_reduction = score_reduction
        self.knn = NearestNeighbors(
            n_neighbors=min(self.n_neighbors, len(self.memory_bank)),
            metric=self.distance_metric,
        )
        self.knn.fit(self.memory_bank)

        distances, _ = self.knn.kneighbors(self.memory_bank)
        if self.score_reduction == "min":
            train_scores = distances.min(axis=1)
        else:
            train_scores = distances.mean(axis=1)
        self.threshold = float(np.percentile(train_scores, threshold_percentile))
        print(f"✅ PatchCore fitted. threshold={self.threshold:.4f}")

    def predict(self, image_tensor: torch.Tensor) -> dict[str, Any]:
        if self.knn is None or self.memory_bank is None:
            raise RuntimeError("Fit model before predict")

        with torch.no_grad():
            feat = self.backbone(image_tensor.unsqueeze(0).to(self.device))
            pooled = torch.nn.functional.adaptive_avg_pool2d(feat, (1, 1))
            feat_np = pooled.cpu().numpy().reshape(1, -1)

        distances, _ = self.knn.kneighbors(feat_np)
        if self.score_reduction == "min":
            score = float(distances.min())
        else:
            score = float(distances.mean())

        if self.device.type == "mps":
            torch.mps.empty_cache()

        return {
            "anomaly_score": score,
            "is_defect": score > self.threshold,
            "threshold": self.threshold,
        }

    def save(self, path: str) -> None:
        with open(path, "wb") as f:
            pickle.dump(
                {
                    "memory_bank": self.memory_bank,
                    "threshold": self.threshold,
                    "n_neighbors": self.n_neighbors,
                    "distance_metric": self.distance_metric,
                    "score_reduction": self.score_reduction,
                },
                f,
            )

    def load(self, path: str) -> None:
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.memory_bank = data["memory_bank"]
        self.threshold = data["threshold"]
        self.n_neighbors = int(data.get("n_neighbors", 9))
        self.distance_metric = str(data.get("distance_metric", "euclidean"))
        self.score_reduction = str(data.get("score_reduction", "mean"))
        n = min(self.n_neighbors, len(self.memory_bank))
        self.knn = NearestNeighbors(
            n_neighbors=max(1, n),
            metric=self.distance_metric,
        )
        self.knn.fit(self.memory_bank)
