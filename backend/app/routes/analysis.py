from datetime import datetime

from flask import current_app, jsonify, request

from ..db import NO_ID, get_db, next_id
from ..ml import engine
from . import api
from .validation import ValidationError, number


@api.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    errors = {}
    inputs = {
        "soilMoisture": number(data, "soilMoisture", errors, 0, 100),
        "nitrogen": number(data, "nitrogen", errors, 0, 500),
        "phosphorus": number(data, "phosphorus", errors, 0, 500),
        "potassium": number(data, "potassium", errors, 0, 500),
        "temperature": number(data, "temperature", errors, -20, 60),
        "humidity": number(data, "humidity", errors, 0, 100),
        "rainfall": number(data, "rainfall", errors, 0, 1000),
        "fieldId": number(data, "fieldId", errors, required=False),
        "fieldName": data.get("fieldName"),
        "cropType": data.get("cropType"),
        "growthStage": data.get("growthStage"),
    }
    if errors:
        raise ValidationError(errors)

    db = get_db()
    field = db.fields.find_one({"id": inputs["fieldId"]}, NO_ID) if inputs["fieldId"] else None
    if field:
        inputs["fieldName"] = inputs["fieldName"] or field["name"]
        inputs["cropType"] = inputs["cropType"] or field.get("crop")
        inputs["growthStage"] = inputs["growthStage"] or field.get("growthStage")

    result = engine.recommend(inputs, current_app.config["MODEL_PATH"])

    db.analyses.insert_one({**result, "createdAt": datetime.now()})

    # Keep the field card in sync with the latest readings
    if field:
        f = result["fertilizer"]
        db.fields.update_one({"id": field["id"]}, {"$set": {
            "soilMoisture": inputs["soilMoisture"], "nitrogen": inputs["nitrogen"],
            "phosphorus": inputs["phosphorus"], "potassium": inputs["potassium"],
            "temperature": inputs["temperature"], "humidity": inputs["humidity"],
            "rainfall": inputs["rainfall"], "growthStage": result["growthStage"],
            "lastAnalyzed": result["generatedAt"],
            "healthStatus": engine.health_status(inputs["soilMoisture"], f["nitrogen"],
                                                 f["phosphorus"], f["potassium"]),
        }})

    return jsonify(result)


@api.get("/recommendations/active")
def active_recommendation():
    query = {}
    if request.args.get("fieldId"):
        try:
            query["fieldId"] = int(request.args["fieldId"])
        except ValueError:
            return jsonify(error="fieldId must be a number"), 400
    rec = get_db().analyses.find_one(query, {"_id": 0, "createdAt": 0}, sort=[("createdAt", -1)])
    if not rec:
        return jsonify(error="No recommendation yet. Run a soil analysis first."), 404
    return jsonify(rec)


@api.get("/history")
def list_history():
    docs = get_db().history.find({}, {"_id": 0, "createdAt": 0}).sort("createdAt", -1)
    return jsonify(list(docs))


@api.post("/history")
def save_history():
    rec = request.get_json(silent=True) or {}
    irrigation = rec.get("irrigation") or {}
    fert = rec.get("fertilizer") or {}
    if not irrigation or not fert:
        raise ValidationError({"recommendation": "must include irrigation and fertilizer results"})

    db = get_db()
    now = datetime.now()
    status = irrigation.get("status", "Irrigate Today")
    entry = {
        "id": f"REC-{now:%Y%m%d}-{next_id(db, 'history'):04d}",
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%I:%M %p"),
        "field": rec.get("fieldName") or "Unknown Field",
        "crop": rec.get("cropType") or "Unknown",
        "soilMoisture": rec.get("soilMoisture"),
        "irrigation": irrigation.get("amount", ""),
        "fertilizer": f"N:{fert.get('nitrogen', 0)}, P:{fert.get('phosphorus', 0)}, "
                      f"K:{fert.get('potassium', 0)} kg/ha",
        "confidence": f"{irrigation.get('confidence', 90)}%",
        "status": status,
        "statusType": "alert" if status == "Irrigate Today" else "success",
    }
    db.history.insert_one({**entry, "createdAt": now})
    return jsonify(entry), 201
