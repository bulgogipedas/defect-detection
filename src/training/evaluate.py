import argparse
from pathlib import Path

from sklearn.metrics import confusion_matrix, f1_score, roc_auc_score
from torch.utils.data import DataLoader

from src.data.dataset import DefectDataset
from src.models.patchcore import PatchCore


def evaluate_patchcore(model: PatchCore, loader: DataLoader) -> dict[str, float]:
    scores: list[float] = []
    labels: list[int] = []

    for images, targets in loader:
        for i in range(images.shape[0]):
            img = images[i]
            label = targets[i]
            result = model.predict(img)
            scores.append(result["anomaly_score"])
            labels.append(int(label.item()))

    preds = [1 if s > model.threshold else 0 for s in scores]
    auroc = float(roc_auc_score(labels, scores)) if len(set(labels)) > 1 else float("nan")
    f1 = float(f1_score(labels, preds, zero_division=0))
    cm = confusion_matrix(labels, preds)

    print(f"AUROC : {auroc:.4f}")
    print(f"F1    : {f1:.4f}")
    print(f"CM    :\n{cm}")
    return {"auroc": auroc, "f1": f1}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["patchcore"], default="patchcore")
    parser.add_argument("--category", default="bottle")
    parser.add_argument("--weights", default="")
    parser.add_argument("--batch-size", type=int, default=4)
    args = parser.parse_args()

    weights = args.weights or f"models/patchcore_{args.category}.pkl"
    if not Path(weights).is_file():
        raise SystemExit(f"Missing weights: {weights}")

    if args.model == "patchcore":
        model = PatchCore()
        model.load(weights)

        ds = DefectDataset("data/raw", args.category, split="test", augment=False)
        loader = DataLoader(
            ds,
            batch_size=args.batch_size,
            shuffle=False,
            num_workers=0,
        )
        evaluate_patchcore(model, loader)


if __name__ == "__main__":
    main()
