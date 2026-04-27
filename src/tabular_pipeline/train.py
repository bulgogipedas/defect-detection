from __future__ import annotations

import json
import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline

from src.tabular_pipeline.config import PipelineConfig
from src.tabular_pipeline.preprocess import split_and_prepare

log = logging.getLogger(__name__)


def train_tabular_classifier(
    data_csv: Path,
    artifacts_dir: Path,
    cfg: PipelineConfig,
    ordinal_cols: list[str] | None = None,
    ordinal_categories: list[list[str]] | None = None,
    nominal_cols: list[str] | None = None,
    numeric_cols: list[str] | None = None,
) -> dict:
    df = pd.read_csv(data_csv)
    X_train, X_test, y_train, y_test, preprocessor = split_and_prepare(
        df,
        cfg,
        ordinal_cols=ordinal_cols,
        ordinal_categories=ordinal_categories,
        nominal_cols=nominal_cols,
        numeric_cols=numeric_cols,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=cfg.random_state,
        n_jobs=-1,
        class_weight="balanced",
    )
    pipeline = Pipeline([("preprocessor", preprocessor), ("model", model)])
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=cfg.random_state)
    cv_scores = cross_val_score(
        pipeline,
        X_train,
        y_train,
        cv=cv,
        scoring="f1_weighted",
        n_jobs=-1,
    )
    log.info("cv_f1_weighted mean=%.4f std=%.4f", cv_scores.mean(), cv_scores.std())
    pipeline.fit(X_train, y_train)

    artifacts_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline.named_steps["preprocessor"], artifacts_dir / "preprocessor.joblib")
    joblib.dump(pipeline.named_steps["model"], artifacts_dir / "model.joblib")
    X_test.to_csv(artifacts_dir / "X_test.csv", index=False)
    y_test.to_csv(artifacts_dir / "y_test.csv", index=False)

    metrics = {
        "cv_f1_weighted_mean": float(cv_scores.mean()),
        "cv_f1_weighted_std": float(cv_scores.std()),
    }
    (artifacts_dir / "cv_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics
