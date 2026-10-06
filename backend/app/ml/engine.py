"""Recommendation engine.

`recommend(data)` returns the exact JSON shape the frontend's Recommendations
page expects. If MODEL_PATH points to a trained model file, its predictions
are used for the irrigation amount and N-P-K doses; otherwise the rule-based
logic in rules.py is used.

See README.md -> "Plugging in your ML model" for the model file format.
"""
import logging
import os
from datetime import datetime

from . import rules

log = logging.getLogger(__name__)

FEATURES = [
    "soilMoisture", "nitrogen", "phosphorus", "potassium",
    "temperature", "humidity", "rainfall", "cropType", "growthStage",
]

_model_bundle = None
_model_path_loaded = None


def load_model(path):
    """Load the model bundle once. Returns None if no usable model is configured."""
    global _model_bundle, _model_path_loaded
    if not path:
        return None
    if _model_path_loaded == path:
        return _model_bundle
    _model_path_loaded = path
    if not os.path.exists(path):
        log.warning("MODEL_PATH %s not found; using rule-based engine.", path)
        _model_bundle = None
        return None
    try:
        import joblib

        bundle = joblib.load(path)
        if "irrigation_model" not in bundle and "fertilizer_model" not in bundle:
            raise ValueError("bundle needs 'irrigation_model' and/or 'fertilizer_model'")
        _model_bundle = bundle
        log.info("Loaded ML model bundle from %s", path)
    except Exception as exc:  # keep the API working even if the model is broken
        log.error("Could not load model from %s (%s); using rule-based engine.", path, exc)
        _model_bundle = None
    return _model_bundle


def _model_predict(bundle, inputs):
    """Run the trained pipelines on one row. Returns (litres or None, (n,p,k) or None)."""
    import pandas as pd

    features = bundle.get("features", FEATURES)
    row = pd.DataFrame([{f: inputs[f] for f in features}])

    litres = npk = None
    if bundle.get("irrigation_model") is not None:
        litres = max(0.0, float(bundle["irrigation_model"].predict(row)[0]))
    if bundle.get("fertilizer_model") is not None:
        pred = bundle["fertilizer_model"].predict(row)[0]
        npk = tuple(max(0, round(float(v))) for v in pred[:3])
    return litres, npk


def recommend(data, model_path=""):
    moisture = float(data["soilMoisture"])
    n, p, k = float(data["nitrogen"]), float(data["phosphorus"]), float(data["potassium"])
    rain = float(data["rainfall"])
    crop = data.get("cropType") or "Wheat"
    stage = data.get("growthStage") or "Vegetative"

    irr = rules.irrigation_rules(moisture, rain, stage)
    n_need, p_need, k_need = rules.fertilizer_rules(n, p, k)
    fert_conf = 88
    engine = "rule-based"

    bundle = load_model(model_path)
    if bundle:
        inputs = {
            "soilMoisture": moisture, "nitrogen": n, "phosphorus": p, "potassium": k,
            "temperature": float(data["temperature"]), "humidity": float(data["humidity"]),
            "rainfall": rain, "cropType": crop, "growthStage": stage,
        }
        try:
            litres, npk = _model_predict(bundle, inputs)
            if litres is not None:
                if litres < 1:
                    irr.update(status="Optimal Moisture", amount="0 L/m²", timing="Re-check in 24 hours")
                else:
                    lo, hi = max(0, round(litres) - 2), round(litres) + 2
                    irr.update(status="Irrigate Today", amount=f"{lo}–{hi} L/m²",
                               timing="Early morning (06:00 - 08:00 AM)")
                irr["confidence"] = bundle.get("irrigation_confidence", irr["confidence"])
                irr["reasons"] = [f"ML model predicts ~{litres:.1f} L/m² of water is needed."] + irr["reasons"]
            if npk is not None:
                n_need, p_need, k_need = npk
                fert_conf = bundle.get("fertilizer_confidence", fert_conf)
            engine = "ml-model"
        except Exception as exc:
            log.error("Model prediction failed (%s); falling back to rules.", exc)

    return {
        "fieldId": data.get("fieldId"),
        "fieldName": data.get("fieldName") or "Selected Field",
        "cropType": crop,
        "growthStage": stage,
        "generatedAt": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "soilMoisture": moisture, "nitrogen": n, "phosphorus": p, "potassium": k,
        "temperature": float(data["temperature"]), "humidity": float(data["humidity"]), "rainfall": rain,
        "engine": engine,
        "irrigation": {
            "status": irr["status"],
            "amount": irr["amount"],
            "timing": irr["timing"],
            "confidence": irr["confidence"],
            "urgency": "High" if irr["status"] == "Irrigate Today" else "Low",
            "reasons": irr["reasons"],
        },
        "fertilizer": {
            "nitrogen": n_need, "phosphorus": p_need, "potassium": k_need,
            "confidence": fert_conf, "unit": "kg/ha", "timing": "Apply within 48 hours",
            "reasons": rules.fertilizer_reasons(n, p, k, n_need, p_need, k_need),
        },
        "factorWeights": [
            {"factor": "Soil Moisture", "weight": "35%", "impact": "High",
             "status": "Deficient" if moisture < 45 else "Optimal"},
            {"factor": "Rainfall & Forecast", "weight": "25%", "impact": "High",
             "status": "Low" if rain < 15 else "Sufficient"},
            {"factor": "Crop Growth Stage", "weight": "20%", "impact": "Medium", "status": stage},
            {"factor": "NPK Nutrient Balance", "weight": "20%", "impact": "Medium",
             "status": "N-Deficient" if n_need > 25 else "Balanced"},
        ],
    }


def health_status(moisture, n_need, p_need, k_need):
    """Simple field health label for the field cards."""
    deficits = sum([moisture < 35, n_need > 25, p_need > 15, k_need > 15])
    if deficits == 0:
        return "Good"
    return "Moderate" if deficits <= 2 else "Poor"
