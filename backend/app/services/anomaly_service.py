from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, Mapping

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

MODEL_DIR = Path(os.getenv("MODEL_DIR", str(Path(__file__).resolve().parents[2] / "models")))
MODEL_PATH = MODEL_DIR / "isolation_forest.joblib"
SCALER_PATH = MODEL_DIR / "scaler.joblib"

DEFAULT_CONTAMINATION = 0.05
DEFAULT_SCORE_THRESHOLD: float | None = None

FEATURES = [
    "amount_ngn",
    "hour_of_day",
    "day_of_week",
    "sender_degree",
    "receiver_fan_in",
    "is_round_amount",
]


def _resolve_paths(model_dir: Path | None) -> tuple[Path, Path]:
    base = model_dir or MODEL_DIR
    return base / "isolation_forest.joblib", base / "scaler.joblib"


def _normalize_dataframe(transactions: Iterable[Mapping[str, object]]) -> pd.DataFrame:
    df = pd.DataFrame(list(transactions))
    if df.empty:
        return df

    if "amount_ngn" not in df and "amount" in df:
        df["amount_ngn"] = df["amount"]
    if "occurred_at" not in df and "timestamp" in df:
        df["occurred_at"] = df["timestamp"]
    if "source_entity_id" not in df and "sender_id" in df:
        df["source_entity_id"] = df["sender_id"]
    if "destination_entity_id" not in df and "receiver_id" in df:
        df["destination_entity_id"] = df["receiver_id"]

    df["amount_ngn"] = pd.to_numeric(df.get("amount_ngn"), errors="coerce")
    df["occurred_at"] = pd.to_datetime(df.get("occurred_at"), errors="coerce")

    df["hour_of_day"] = df["occurred_at"].dt.hour.fillna(0).astype(int)
    df["day_of_week"] = df["occurred_at"].dt.dayofweek.fillna(0).astype(int)
    df["is_round_amount"] = (df["amount_ngn"] % 1000 == 0).fillna(False).astype(int)

    if "source_entity_id" in df and "destination_entity_id" in df:
        df["sender_degree"] = (
            df.groupby("source_entity_id")["destination_entity_id"].transform("nunique").fillna(0)
        )
        df["receiver_fan_in"] = (
            df.groupby("destination_entity_id")["source_entity_id"].transform("nunique").fillna(0)
        )
    else:
        df["sender_degree"] = 0
        df["receiver_fan_in"] = 0

    return df


def train_model(
    transactions: Iterable[Mapping[str, object]],
    model_dir: Path | None = None,
    contamination: float = DEFAULT_CONTAMINATION,
    random_state: int = 42,
) -> dict[str, object]:
    df = _normalize_dataframe(transactions)
    if df.empty:
        raise ValueError("Training data is empty")

    X = df[FEATURES].fillna(0).to_numpy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    model_path, scaler_path = _resolve_paths(model_dir)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    return {
        "model_path": str(model_path),
        "scaler_path": str(scaler_path),
        "training_rows": int(len(df)),
        "contamination": float(contamination),
    }


def score_transaction(
    txn: Mapping[str, object],
    sender_degree: int,
    receiver_fan_in: int,
    model_dir: Path | None = None,
) -> dict[str, object]:
    model_path, scaler_path = _resolve_paths(model_dir)
    if not model_path.exists() or not scaler_path.exists():
        return {
            "anomaly_score": 0.0,
            "is_anomaly": False,
            "confidence": 0.0,
        }

    model: IsolationForest = joblib.load(model_path)
    scaler: StandardScaler = joblib.load(scaler_path)

    timestamp = txn.get("occurred_at") or txn.get("timestamp")
    parsed_time = pd.to_datetime(timestamp, errors="coerce")
    amount = pd.to_numeric(txn.get("amount_ngn") or txn.get("amount"), errors="coerce")

    features = np.array(
        [
            [
                float(amount) if pd.notna(amount) else 0.0,
                int(parsed_time.hour) if pd.notna(parsed_time) else 0,
                int(parsed_time.dayofweek) if pd.notna(parsed_time) else 0,
                int(sender_degree),
                int(receiver_fan_in),
                int((float(amount) if pd.notna(amount) else 0.0) % 1000 == 0),
            ]
        ]
    )

    X_scaled = scaler.transform(features)
    score = float(model.score_samples(X_scaled)[0])
    prediction = int(model.predict(X_scaled)[0])
    confidence = max(0.0, min(1.0, -score / 0.5))

    threshold_raw = os.getenv("ANOMALY_SCORE_THRESHOLD")
    threshold = DEFAULT_SCORE_THRESHOLD
    if threshold_raw:
        try:
            threshold = float(threshold_raw)
        except ValueError:
            threshold = DEFAULT_SCORE_THRESHOLD

    if threshold is not None:
        is_anomaly = score < threshold
    else:
        is_anomaly = prediction == -1

    return {
        "anomaly_score": score,
        "is_anomaly": is_anomaly,
        "confidence": float(confidence),
    }
