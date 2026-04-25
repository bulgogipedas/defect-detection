import argparse
import json
import shutil
from datetime import UTC, datetime
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", default="bottle")
    parser.add_argument("--weights", required=True)
    parser.add_argument("--metrics-json", required=True)
    parser.add_argument("--min-auroc", type=float, default=0.7)
    parser.add_argument("--min-f1", type=float, default=0.5)
    parser.add_argument("--releases-dir", default="models/releases")
    parser.add_argument("--active-manifest", default="models/active_model.json")
    args = parser.parse_args()

    weights = Path(args.weights)
    metrics_json = Path(args.metrics_json)
    if not weights.is_file():
        raise SystemExit(f"Missing model weights: {weights}")
    if not metrics_json.is_file():
        raise SystemExit(f"Missing metrics JSON: {metrics_json}")

    metrics = json.loads(metrics_json.read_text(encoding="utf-8"))
    auroc = float(metrics.get("auroc", 0.0))
    f1 = float(metrics.get("f1", 0.0))
    pass_gate = auroc >= args.min_auroc and f1 >= args.min_f1
    if not pass_gate:
        raise SystemExit(
            f"Model does not meet gate: auroc={auroc:.4f} f1={f1:.4f} "
            f"(requires auroc>={args.min_auroc}, f1>={args.min_f1})"
        )

    version = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    release_dir = Path(args.releases_dir) / args.category / version
    release_dir.mkdir(parents=True, exist_ok=True)
    release_model = release_dir / weights.name
    release_metrics = release_dir / "metrics.json"
    shutil.copy2(weights, release_model)
    shutil.copy2(metrics_json, release_metrics)

    active_manifest = {
        "category": args.category,
        "version": version,
        "artifact_path": str(release_model),
        "metrics_path": str(release_metrics),
        "auroc": auroc,
        "f1": f1,
        "promoted_at_utc": version,
    }
    active_path = Path(args.active_manifest)
    active_path.parent.mkdir(parents=True, exist_ok=True)
    active_path.write_text(json.dumps(active_manifest, indent=2), encoding="utf-8")

    print(f"Promoted model: {release_model}")
    print(f"Active manifest: {active_path}")


if __name__ == "__main__":
    main()
