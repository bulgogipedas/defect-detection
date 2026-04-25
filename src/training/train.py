import argparse
from pathlib import Path

import yaml


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["patchcore", "yolov8"], default="patchcore")
    parser.add_argument("--category", default="bottle")
    parser.add_argument("--config", default="src/training/config.yaml")
    args = parser.parse_args()

    cfg_path = Path(args.config)
    with cfg_path.open() as f:
        cfg = yaml.safe_load(f)

    Path("models").mkdir(exist_ok=True)

    if args.model == "patchcore":
        from src.data.dataset import DefectDataset
        from src.models.patchcore import PatchCore

        img_size = cfg.get("img_size_patchcore", 224)
        dataset = DefectDataset(
            "data/raw",
            args.category,
            split="train",
            img_size=img_size,
            augment=False,
        )
        # Only normal samples for PatchCore memory bank
        images = [img for img, lab in dataset if lab.item() == 0]
        if not images:
            raise SystemExit(
                "No normal (label=0) images in train split. "
                "Download MVTec AD and extract under data/raw/<category>/train/good/"
            )

        model = PatchCore()
        model.fit(images, threshold_percentile=cfg["threshold_percentile"])
        model.save(f"models/patchcore_{args.category}.pkl")

    elif args.model == "yolov8":
        from src.models.yolov8_trainer import train_yolov8

        data_yaml = Path("data/processed") / f"{args.category}.yaml"
        if not data_yaml.is_file():
            msg = f"Missing {data_yaml}. Add a YOLO data yaml for {args.category!r}."
            raise SystemExit(msg)
        train_yolov8(
            data_yaml=str(data_yaml),
            epochs=cfg["epochs"],
            imgsz=cfg["imgsz"],
            batch=cfg["batch_size"],
        )


if __name__ == "__main__":
    main()
