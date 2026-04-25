from pathlib import Path

import albumentations as A
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2
from PIL import Image
from torch.utils.data import Dataset


class DefectDataset(Dataset):
    """MVTec AD–style layout: ``root/category/{split}/{label or defect_name}/*.png``."""

    def __init__(
        self,
        root_dir: str,
        category: str,
        split: str = "train",
        img_size: int = 224,
        augment: bool = False,
    ):
        self.root = Path(root_dir) / category
        self.samples: list[tuple[Path, int]] = []

        split_path = self.root / split
        if not split_path.is_dir():
            raise FileNotFoundError(f"Split not found: {split_path}")

        for label_dir in split_path.iterdir():
            if not label_dir.is_dir():
                continue
            label = 0 if label_dir.name == "good" else 1
            for img_path in sorted(label_dir.glob("*.png")):
                self.samples.append((img_path, label))

        base = [
            A.Resize(img_size, img_size),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ]
        aug_steps = (
            [A.HorizontalFlip(p=0.5), A.Rotate(limit=15, p=0.3), A.GaussNoise(p=0.2)] + base
            if augment
            else base
        )

        self.transform = A.Compose(aug_steps)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        img_path, label = self.samples[idx]
        image = np.array(Image.open(img_path).convert("RGB"))
        out = self.transform(image=image)
        return out["image"], torch.tensor(label, dtype=torch.long)
