"""Checks that a trained scikit-learn bundle is picked up via MODEL_PATH."""
import numpy as np
import pandas as pd
import pytest

joblib = pytest.importorskip("joblib")
sklearn = pytest.importorskip("sklearn")

from sklearn.compose import ColumnTransformer  # noqa: E402
from sklearn.ensemble import RandomForestRegressor  # noqa: E402
from sklearn.pipeline import Pipeline  # noqa: E402
from sklearn.preprocessing import OneHotEncoder  # noqa: E402

from app import create_app  # noqa: E402
from app.ml import engine  # noqa: E402

NUM = ["soilMoisture", "nitrogen", "phosphorus", "potassium", "temperature", "humidity", "rainfall"]
CAT = ["cropType", "growthStage"]


def _pipeline():
    pre = ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), CAT)], remainder="passthrough")
    return Pipeline([("pre", pre), ("model", RandomForestRegressor(n_estimators=10, random_state=0))])


def test_model_bundle_used(tmp_path):
    rng = np.random.default_rng(0)
    X = pd.DataFrame(rng.uniform(0, 80, size=(60, len(NUM))), columns=NUM)
    X["cropType"] = rng.choice(["Wheat", "Rice"], 60)
    X["growthStage"] = rng.choice(["Vegetative", "Flowering"], 60)
    irr = _pipeline().fit(X, np.full(60, 15.0))
    fert = _pipeline().fit(X, np.tile([30.0, 12.0, 8.0], (60, 1)))
    path = tmp_path / "model.joblib"
    joblib.dump({"irrigation_model": irr, "fertilizer_model": fert, "features": NUM + CAT}, path)

    engine._model_path_loaded = None  # reset cache between tests
    client = create_app({"MONGO_URI": "mongomock://", "WEATHER_SOURCE": "sample",
                         "MODEL_PATH": str(path)}).test_client()
    rec = client.post("/api/analyze", json={
        "fieldId": 1, "soilMoisture": 60, "nitrogen": 40, "phosphorus": 30, "potassium": 40,
        "temperature": 30, "humidity": 60, "rainfall": 30, "cropType": "Wheat", "growthStage": "Vegetative"}).json
    assert rec["engine"] == "ml-model"
    assert rec["irrigation"]["amount"] == "13–17 L/m²" and rec["irrigation"]["status"] == "Irrigate Today"
    assert (rec["fertilizer"]["nitrogen"], rec["fertilizer"]["phosphorus"], rec["fertilizer"]["potassium"]) == (30, 12, 8)


def test_missing_model_falls_back(tmp_path):
    engine._model_path_loaded = None
    client = create_app({"MONGO_URI": "mongomock://", "WEATHER_SOURCE": "sample",
                         "MODEL_PATH": str(tmp_path / "missing.joblib")}).test_client()
    rec = client.post("/api/analyze", json={
        "soilMoisture": 30, "nitrogen": 40, "phosphorus": 30, "potassium": 40,
        "temperature": 30, "humidity": 60, "rainfall": 5}).json
    assert rec["engine"] == "rule-based"
