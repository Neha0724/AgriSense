from flask import jsonify, request

from ..db import get_db
from . import api
from .validation import ValidationError

SECTIONS = ("profile", "preferences", "notifications")


@api.get("/settings")
def get_settings():
    doc = get_db().settings.find_one({"_id": "default"}, {"_id": 0}) or {s: {} for s in SECTIONS}
    return jsonify(doc)


@api.put("/settings")
def update_settings():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationError({"settings": "must be a JSON object"})
    update = {}
    for section in SECTIONS:
        if section in data:
            if not isinstance(data[section], dict):
                raise ValidationError({section: "must be an object"})
            for key, value in data[section].items():
                update[f"{section}.{key}"] = value
    if not update:
        raise ValidationError({"settings": f"provide at least one of: {', '.join(SECTIONS)}"})

    db = get_db()
    db.settings.update_one({"_id": "default"}, {"$set": update}, upsert=True)
    return jsonify(db.settings.find_one({"_id": "default"}, {"_id": 0}))
