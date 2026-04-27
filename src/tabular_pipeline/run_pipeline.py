from __future__ import annotations

import argparse
from pathlib import Path

from src.tabular_pipeline.config import PipelineConfig
from src.tabular_pipeline.evaluate import evaluate_tabular_classifier
from src.tabular_pipeline.train import train_tabular_classifier


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-csv", required=True)
    parser.add_argument("--target-col", required=True)
    parser.add_argument("--artifacts-dir", default="artifacts/tabular")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    args = parser.parse_args()

    data_csv = Path(args.data_csv)
    artifacts_dir = Path(args.artifacts_dir)
    cfg = PipelineConfig(
        target_col=args.target_col,
        test_size=args.test_size,
        random_state=args.random_state,
    )

    train_metrics = train_tabular_classifier(
        data_csv=data_csv,
        artifacts_dir=artifacts_dir,
        cfg=cfg,
    )
    eval_metrics = evaluate_tabular_classifier(artifacts_dir=artifacts_dir)

    print("Train CV metrics:", train_metrics)
    print("Eval metrics keys:", sorted(eval_metrics.keys()))


if __name__ == "__main__":
    main()
