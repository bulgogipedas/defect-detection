from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def save_score_histogram(
    scores: list[float],
    path: str | Path,
    title: str = "Anomaly scores",
) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(6, 4))
    plt.hist(np.array(scores), bins=20, color="steelblue", edgecolor="white")
    plt.title(title)
    plt.xlabel("Score")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
