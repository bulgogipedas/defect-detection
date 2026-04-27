from __future__ import annotations

import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

from src.tabular_pipeline.config import PipelineConfig

log = logging.getLogger(__name__)


def log_frame_summary(df: pd.DataFrame, stage: str) -> None:
    log.info("[%s] shape=%s", stage, df.shape)
    log.info("[%s] dtypes=\n%s", stage, df.dtypes)
    log.info("[%s] null-counts=\n%s", stage, df.isnull().sum())


def infer_column_groups(
    df: pd.DataFrame,
    target_col: str,
    ordinal_cols: list[str] | None = None,
    nominal_cols: list[str] | None = None,
    numeric_cols: list[str] | None = None,
) -> tuple[list[str], list[str], list[str]]:
    features = df.drop(columns=[target_col])
    numeric_auto = features.select_dtypes(include=["number"]).columns.tolist()
    categorical_auto = [c for c in features.columns if c not in numeric_auto]

    numeric = numeric_cols if numeric_cols is not None else numeric_auto
    ordinal = ordinal_cols or []
    if nominal_cols is not None:
        nominal = nominal_cols
    else:
        nominal = [c for c in categorical_auto if c not in ordinal]
    return numeric, ordinal, nominal


def clip_iqr_outliers(
    train_df: pd.DataFrame,
    numeric_cols: list[str],
    iqr_factor: float,
) -> pd.DataFrame:
    out = train_df.copy()
    for col in numeric_cols:
        q1 = out[col].quantile(0.25)
        q3 = out[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - iqr_factor * iqr
        upper = q3 + iqr_factor * iqr
        out[col] = out[col].clip(lower, upper)
    return out


def build_preprocessor(
    numeric_cols: list[str],
    ordinal_cols: list[str],
    nominal_cols: list[str],
    ordinal_categories: list[list[str]] | None = None,
) -> ColumnTransformer:
    numeric_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    ordinal_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "ordinal",
                OrdinalEncoder(
                    categories=ordinal_categories if ordinal_categories else "auto",
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                ),
            ),
        ]
    )
    nominal_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipe, numeric_cols),
            ("ord", ordinal_pipe, ordinal_cols),
            ("nom", nominal_pipe, nominal_cols),
        ],
        remainder="drop",
    )


def split_and_prepare(
    df: pd.DataFrame,
    cfg: PipelineConfig,
    ordinal_cols: list[str] | None = None,
    ordinal_categories: list[list[str]] | None = None,
    nominal_cols: list[str] | None = None,
    numeric_cols: list[str] | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, ColumnTransformer]:
    log_frame_summary(df, "before_preprocess")
    X = df.drop(columns=[cfg.target_col])
    y = df[cfg.target_col]
    stratify = y if y.nunique() <= 20 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=cfg.test_size,
        random_state=cfg.random_state,
        stratify=stratify,
    )

    ncols, ocols, mcols = infer_column_groups(
        df,
        cfg.target_col,
        ordinal_cols=ordinal_cols,
        nominal_cols=nominal_cols,
        numeric_cols=numeric_cols,
    )
    X_train = clip_iqr_outliers(X_train, ncols, cfg.outlier_iqr_factor)
    preprocessor = build_preprocessor(ncols, ocols, mcols, ordinal_categories=ordinal_categories)
    return X_train, X_test, y_train, y_test, preprocessor


def save_preprocessor(preprocessor: ColumnTransformer, artifact_path: Path) -> None:
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, artifact_path)
