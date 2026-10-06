from flask import jsonify, request

from ..db import NO_ID, get_db, next_id
from . import api
from .validation import ValidationError, number


@api.get("/fields")
def list_fields():
    db = get_db()
    return jsonify(list(db.fields.find({}, NO_ID).sort("id", -1)))


@api.get("/fields/<int:field_id>")
def get_field(field_id):
    field = get_db().fields.find_one({"id": field_id}, NO_ID)
    if not field:
        return jsonify(error=f"Field {field_id} not found"), 404
    return jsonify(field)


@api.post("/fields")
def create_field():
    data = request.get_json(silent=True) or {}
    errors = {}

    name = str(data.get("name", "")).strip()
    if not name:
        errors["name"] = "Field name is required"
    area = number(data, "area", errors, lo=0.01, hi=100000)

    field = {
        "name": name,
        "crop": data.get("crop") or "Wheat",
        "area": area,
        "unit": data.get("unit") or "hectares",
        "soilType": data.get("soilType") or "Loamy",
        "growthStage": data.get("growthStage") or "Vegetative",
        "soilMoisture": number(data, "soilMoisture", errors, 0, 100, default=45, required=False),
        "nitrogen": number(data, "nitrogen", errors, 0, 500, default=50, required=False),
        "phosphorus": number(data, "phosphorus", errors, 0, 500, default=30, required=False),
        "potassium": number(data, "potassium", errors, 0, 500, default=40, required=False),
        "temperature": number(data, "temperature", errors, -20, 60, default=28, required=False),
        "humidity": number(data, "humidity", errors, 0, 100, default=65, required=False),
        "rainfall": number(data, "rainfall", errors, 0, 1000, default=10, required=False),
        "coordinates": (data.get("coordinates") or "").strip(),
        "healthStatus": "Good",
        "lastAnalyzed": "Not analyzed yet",
    }
    if errors:
        raise ValidationError(errors)

    db = get_db()
    field["id"] = next_id(db, "fields")
    db.fields.insert_one(field)
    field.pop("_id", None)
    return jsonify(field), 201
