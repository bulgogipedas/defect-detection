from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

ARTIFACTS_DIR = Path("artifacts/tabular")
PREPROCESSOR = joblib.load(ARTIFACTS_DIR / "preprocessor.joblib")
MODEL = joblib.load(ARTIFACTS_DIR / "model.joblib")


class PredictRequest(BaseModel):
    features: dict[str, Any]


app = FastAPI(title="Tabular ML Inference API", version="1.0.0")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"status": True}


@app.post("/predict")
def predict(req: PredictRequest) -> dict[str, Any]:
    if not req.features:
        raise HTTPException(status_code=400, detail="Empty features payload.")

    X = pd.DataFrame([req.features])
    Xt = PREPROCESSOR.transform(X)
    pred = MODEL.predict(Xt)[0]
    out: dict[str, Any] = {"prediction": pred.item() if hasattr(pred, "item") else pred}
    if hasattr(MODEL, "predict_proba"):
        out["probabilities"] = MODEL.predict_proba(Xt)[0].tolist()
    return out
