import argparse
import json
from datetime import UTC, datetime
from pathlib import Path

import yaml

import mlflow


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["patchcore", "yolov8"], default="patchcore")
    parser.add_argument("--category", default="bottle")
    parser.add_argument("--config", default="src/training/config.yaml")
    parser.add_argument("--mlflow-uri", default="file:./mlflow/mlruns")
    parser.add_argument("--experiment", default="defect-pipeline")
    parser.add_argument("--output-dir", default="models/runs")
    parser.add_argument("--run-name", default="")
    args = parser.parse_args()

    cfg_path = Path(args.config)
    with cfg_path.open() as f:
        cfg = yaml.safe_load(f)

    Path("models").mkdir(exist_ok=True)
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    run_name = args.run_name or f"{args.model}_{args.category}_{ts}"
    run_dir = Path(args.output_dir) / run_name
    run_dir.mkdir(parents=True, exist_ok=True)
    metrics_json_path = run_dir / "metrics.json"
    model_path = run_dir / "model.pkl"

    mlflow.set_tracking_uri(args.mlflow_uri)
    mlflow.set_experiment(args.experiment)
    mlflow.start_run(run_name=run_name)
    mlflow.log_params(
        {
            "model": args.model,
            "category": args.category,
            "run_name": run_name,
            "config_path": args.config,
        }
    )

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
        model.save(str(model_path))
        # Keep backwards-compatible latest pointer.
        latest_model = Path("models") / f"patchcore_{args.category}.pkl"
        model.save(str(latest_model))
        mlflow.log_param("threshold_percentile", cfg["threshold_percentile"])
        mlflow.log_artifact(str(model_path), artifact_path="model")
        summary = {
            "model_type": "patchcore",
            "category": args.category,
            "artifact_path": str(model_path),
            "latest_model_path": str(latest_model),
            "threshold": model.threshold,
        }
        metrics_json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        mlflow.log_artifact(str(metrics_json_path), artifact_path="metadata")

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
        summary = {
            "model_type": "yolov8",
            "category": args.category,
            "artifact_path": "mlflow/yolov8/defect_nano/weights/best.pt",
        }
        metrics_json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        mlflow.log_artifact(str(metrics_json_path), artifact_path="metadata")

    mlflow.end_run()
    print(f"Run dir: {run_dir}")
    print(f"Metadata: {metrics_json_path}")


if __name__ == "__main__":
    main()
