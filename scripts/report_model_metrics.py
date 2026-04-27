from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path


def discover_categories(data_root: Path) -> list[str]:
    if not data_root.is_dir():
        return []
    return sorted([p.name for p in data_root.iterdir() if p.is_dir()])


def read_metric(metrics_dir: Path, category: str) -> dict | None:
    metric_path = metrics_dir / f"{category}_metrics.json"
    if not metric_path.is_file():
        return None
    return json.loads(metric_path.read_text(encoding="utf-8"))


def build_report(data_root: Path, metrics_dir: Path) -> dict:
    categories = discover_categories(data_root)
    rows: list[dict] = []
    for category in categories:
        metric = read_metric(metrics_dir, category)
        if metric is None:
            rows.append(
                {
                    "category": category,
                    "status": "missing_metrics",
                    "pass_gate": False,
                    "auroc": None,
                    "f1": None,
                    "weights": None,
                }
            )
            continue

        rows.append(
            {
                "category": category,
                "status": "ok",
                "pass_gate": bool(metric.get("pass_gate", False)),
                "auroc": metric.get("auroc"),
                "f1": metric.get("f1"),
                "weights": metric.get("weights"),
            }
        )

    passed = sorted([r["category"] for r in rows if r["status"] == "ok" and r["pass_gate"]])
    failed = sorted([r["category"] for r in rows if r["status"] == "ok" and not r["pass_gate"]])
    missing = sorted([r["category"] for r in rows if r["status"] == "missing_metrics"])

    return {
        "generated_at_utc": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "data_root": str(data_root),
        "metrics_dir": str(metrics_dir),
        "total_categories": len(categories),
        "passed_categories": passed,
        "failed_categories": failed,
        "missing_categories": missing,
        "rows": rows,
    }


def to_markdown(report: dict) -> str:
    lines = [
        "# All Categories Model Metrics Report",
        "",
        f"- generated_at_utc: `{report['generated_at_utc']}`",
        f"- total_categories: `{report['total_categories']}`",
        f"- passed_categories: `{len(report['passed_categories'])}`",
        f"- failed_categories: `{len(report['failed_categories'])}`",
        f"- missing_categories: `{len(report['missing_categories'])}`",
        "",
        "## Per-category",
        "",
        "| category | status | pass_gate | auroc | f1 |",
        "|---|---|---:|---:|---:|",
    ]

    for row in report["rows"]:
        auroc = "-" if row["auroc"] is None else f"{float(row['auroc']):.4f}"
        f1 = "-" if row["f1"] is None else f"{float(row['f1']):.4f}"
        lines.append(
            f"| {row['category']} | {row['status']} | {row['pass_gate']} | {auroc} | {f1} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-root",
        default=str(Path("~/Downloads/mvtec_anomaly_detection").expanduser()),
    )
    parser.add_argument("--metrics-dir", default="models/eval")
    parser.add_argument("--output-json", default="reports/model-eval/all_categories_metrics.json")
    parser.add_argument("--output-md", default="reports/model-eval/all_categories_metrics.md")
    args = parser.parse_args()

    data_root = Path(args.data_root).expanduser()
    metrics_dir = Path(args.metrics_dir)
    output_json = Path(args.output_json)
    output_md = Path(args.output_md)

    report = build_report(data_root=data_root, metrics_dir=metrics_dir)

    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(report, indent=2), encoding="utf-8")
    output_md.write_text(to_markdown(report), encoding="utf-8")

    print(f"Report JSON: {output_json}")
    print(f"Report MD  : {output_md}")
    print(f"Passed     : {len(report['passed_categories'])}")
    print(f"Failed     : {len(report['failed_categories'])}")
    print(f"Missing    : {len(report['missing_categories'])}")


if __name__ == "__main__":
    main()
