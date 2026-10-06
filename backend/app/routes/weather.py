from flask import current_app, jsonify, request

from ..db import get_db
from ..services import weather as weather_service
from . import api


@api.get("/weather")
def get_weather():
    cfg = current_app.config
    lat, lon = cfg["DEFAULT_LAT"], cfg["DEFAULT_LON"]

    field_id = request.args.get("fieldId")
    if field_id and field_id.isdigit():
        field = get_db().fields.find_one({"id": int(field_id)}, {"coordinates": 1})
        coords = weather_service.parse_coordinates(field.get("coordinates")) if field else None
        if coords:
            lat, lon = coords

    return jsonify(weather_service.get_weather(cfg["WEATHER_SOURCE"], lat, lon))
