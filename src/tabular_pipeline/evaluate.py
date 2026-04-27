from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def evaluate_tabular_classifier(artifacts_dir: Path) -> dict:
    preprocessor = joblib.load(artifacts_dir / "preprocessor.joblib")
    model = joblib.load(artifacts_dir / "model.joblib")
    X_test = pd.read_csv(artifacts_dir / "X_test.csv")
    y_test = pd.read_csv(artifacts_dir / "y_test.csv").iloc[:, 0]

    X_test_t = preprocessor.transform(X_test)
    y_pred = model.predict(X_test_t)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision_weighted": float(
            precision_score(y_test, y_pred, average="weighted", zero_division=0)
        ),
        "recall_weighted": float(
            recall_score(y_test, y_pred, average="weighted", zero_division=0)
        ),
        "f1_weighted": float(f1_score(y_test, y_pred, average="weighted", zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(
            y_test,
            y_pred,
            output_dict=True,
            zero_division=0,
        ),
    }
    if y_test.nunique() == 2 and hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test_t)[:, 1]
        metrics["roc_auc"] = float(roc_auc_score(y_test, y_prob))

    (artifacts_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics
