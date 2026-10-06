import copy

from flask import jsonify, request

from ..db import NO_ID, get_db
from ..seed_data import CHARTS
from . import api

OPTIMAL = {  # mg/kg ranges shown on the nutrient chart
    "nitrogen": ("Nitrogen (N)", 60, 80),
    "phosphorus": ("Phosphorus (P)", 30, 50),
    "potassium": ("Potassium (K)", 40, 70),
}
MOISTURE_TARGET = 50


@api.get("/analytics")
def analytics():
    """Chart data. Uses real analysis records when a field has at least 2,
    otherwise the sample trend data, so charts are never empty."""
    db = get_db()
    field_id = request.args.get("fieldId")
    if field_id and field_id.isdigit():
        field = db.fields.find_one({"id": int(field_id)}, NO_ID)
    else:
        field = db.fields.find_one({}, NO_ID, sort=[("id", 1)])

    charts = copy.deepcopy(CHARTS)
    charts["source"] = "sample"

    if field:
        records = list(
            db.analyses.find({"fieldId": field["id"]}, {"_id": 0, "createdAt": 1, "soilMoisture": 1,
                                                     "rainfall": 1, "temperature": 1})
            .sort("createdAt", -1).limit(7)
        )
        records.reverse()
        if len(records) >= 2:
            label = lambda r: r["createdAt"].strftime("%b %d %H:%M")  # noqa: E731
            charts["moistureTrend"] = [
                {"date": label(r), "moisture": r["soilMoisture"], "target": MOISTURE_TARGET} for r in records
            ]
            charts["rainfallTrend"] = [
                {"date": label(r), "rain": r["rainfall"], "temp": r["temperature"]} for r in records
            ]
            charts["source"] = "records"

        charts["nutrientLevels"] = [
            {"name": name, "current": field.get(key, 0), "optimalMin": lo, "optimalMax": hi, "unit": "mg/kg"}
            for key, (name, lo, hi) in OPTIMAL.items()
        ]
        charts["fieldId"] = field["id"]
    return jsonify(charts)
