from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def run_cmd(cmd: list[str]) -> tuple[int, str]:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode, proc.stdout + proc.stderr


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True)
    parser.add_argument("--data-root", required=True)
    parser.add_argument("--min-auroc", type=float, default=0.7)
    parser.add_argument("--min-f1", type=float, default=0.5)
    parser.add_argument("--output-json", default="")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    candidates = [
        {"threshold": 90, "k": 1, "metric": "euclidean", "reduction": "min"},
        {"threshold": 95, "k": 1, "metric": "euclidean", "reduction": "min"},
        {"threshold": 95, "k": 3, "metric": "euclidean", "reduction": "mean"},
        {"threshold": 90, "k": 3, "metric": "cosine", "reduction": "mean"},
        {"threshold": 95, "k": 5, "metric": "cosine", "reduction": "mean"},
        {"threshold": 97, "k": 9, "metric": "euclidean", "reduction": "mean"},
    ]

    best: dict | None = None
    attempts: list[dict] = []
    for idx, c in enumerate(candidates, start=1):
        run_name = (
            f"tune_{args.category}_t{c['threshold']}_k{c['k']}_"
            f"{c['metric']}_{c['reduction']}_{idx}"
        )

        train_cmd = [
            "uv",
            "run",
            "python",
            "-m",
            "src.training.train",
            "--model",
            "patchcore",
            "--category",
            args.category,
            "--data-root",
            args.data_root,
            "--threshold-percentile",
            str(c["threshold"]),
            "--n-neighbors",
            str(c["k"]),
            "--distance-metric",
            c["metric"],
            "--score-reduction",
            c["reduction"],
            "--run-name",
            run_name,
            "--mlflow-uri",
            "file:./mlflow/mlruns",
        ]
        code, output = run_cmd(train_cmd)
        if code != 0:
            attempts.append({"candidate": c, "status": "train_failed", "output": output[-2000:]})
            continue

        metrics_path = root / "models" / "eval" / f"{args.category}_metrics.json"
        eval_cmd = [
            "uv",
            "run",
            "python",
            "-m",
            "src.training.evaluate",
            "--model",
            "patchcore",
            "--category",
            args.category,
            "--data-root",
            args.data_root,
            "--weights",
            str(root / "models" / f"patchcore_{args.category}.pkl"),
            "--output-json",
            str(metrics_path),
            "--min-auroc",
            str(args.min_auroc),
            "--min-f1",
            str(args.min_f1),
        ]
        code, output = run_cmd(eval_cmd)
        if code != 0 or not metrics_path.is_file():
            attempts.append({"candidate": c, "status": "eval_failed", "output": output[-2000:]})
            continue

        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        row = {
            "candidate": c,
            "status": "ok",
            "auroc": float(metrics.get("auroc", 0.0)),
            "f1": float(metrics.get("f1", 0.0)),
            "pass_gate": bool(metrics.get("pass_gate", False)),
        }
        attempts.append(row)
        if best is None or row["auroc"] > best["auroc"]:
            best = row

    result = {
        "category": args.category,
        "best": best,
        "attempts": attempts,
        "min_auroc": args.min_auroc,
        "min_f1": args.min_f1,
    }

    if args.output_json:
        out = Path(args.output_json)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))

    if best is None:
        raise SystemExit(1)

    promote_cmd = [
        "uv",
        "run",
        "python",
        "-m",
        "src.training.promote",
        "--category",
        args.category,
        "--weights",
        str(root / "models" / f"patchcore_{args.category}.pkl"),
        "--metrics-json",
        str(root / "models" / "eval" / f"{args.category}_metrics.json"),
        "--min-auroc",
        str(args.min_auroc),
        "--min-f1",
        str(args.min_f1),
    ]
    code, output = run_cmd(promote_cmd)
    if code != 0:
        print(output)
        raise SystemExit(code)


if __name__ == "__main__":
    main()
