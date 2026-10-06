from datetime import datetime

from app.services.weather import map_open_meteo, parse_coordinates

ANALYZE = {"fieldId": 1, "fieldName": "North Field", "soilMoisture": 30, "nitrogen": 40,
           "phosphorus": 30, "potassium": 40, "temperature": 30, "humidity": 60,
           "rainfall": 5, "cropType": "Wheat", "growthStage": "Vegetative"}


def test_health(client):
    assert client.get("/api/health").json["status"] == "ok"


def test_seeded_fields(client):
    fields = client.get("/api/fields").json
    assert {f["id"] for f in fields} == {1, 2, 3}
    assert all("_id" not in f for f in fields)


def test_add_field_and_validation(client):
    bad = client.post("/api/fields", json={"name": "", "area": -1})
    assert bad.status_code == 400 and {"name", "area"} <= set(bad.json["details"])

    res = client.post("/api/fields", json={"name": "Plot B", "area": "1.5", "crop": "Rice"})
    assert res.status_code == 201
    assert res.json["id"] == 4 and res.json["area"] == 1.5 and res.json["soilMoisture"] == 45
    assert client.get("/api/fields").json[0]["name"] == "Plot B"


def test_analyze_updates_field_and_active(client):
    res = client.post("/api/analyze", json=ANALYZE)
    assert res.status_code == 200
    rec = res.json
    assert rec["irrigation"]["status"] == "Irrigate Today"
    assert rec["irrigation"]["amount"] == "22–26 L/m²"
    assert (rec["fertilizer"]["nitrogen"], rec["fertilizer"]["phosphorus"], rec["fertilizer"]["potassium"]) == (35, 15, 15)
    assert rec["engine"] == "rule-based"

    field = client.get("/api/fields/1").json
    assert field["soilMoisture"] == 30 and field["lastAnalyzed"] == rec["generatedAt"]

    active = client.get("/api/recommendations/active").json
    assert active["generatedAt"] == rec["generatedAt"] and "createdAt" not in active


def test_analyze_optimal_and_validation(client):
    ok = client.post("/api/analyze", json={**ANALYZE, "soilMoisture": 60, "rainfall": 30}).json
    assert ok["irrigation"]["status"] == "Optimal Moisture" and ok["irrigation"]["urgency"] == "Low"

    bad = client.post("/api/analyze", json={**ANALYZE, "soilMoisture": 150, "nitrogen": "abc"})
    assert bad.status_code == 400 and {"soilMoisture", "nitrogen"} <= set(bad.json["details"])


def test_history_save_and_list(client):
    rec = client.post("/api/analyze", json=ANALYZE).json
    saved = client.post("/api/history", json=rec)
    assert saved.status_code == 201
    entry = saved.json
    assert entry["field"] == "North Field" and entry["statusType"] == "alert"
    assert entry["fertilizer"] == "N:35, P:15, K:15 kg/ha"
    history = client.get("/api/history").json
    assert history[0]["id"] == entry["id"] and len(history) == 6

    assert client.post("/api/history", json={}).status_code == 400


def test_analytics_switches_to_records(client):
    assert client.get("/api/analytics?fieldId=1").json["source"] == "sample"
    client.post("/api/analyze", json=ANALYZE)
    charts = client.get("/api/analytics?fieldId=1").json
    # seeded sample analysis + new one = 2 records for field 1
    assert charts["source"] == "records"
    assert charts["moistureTrend"][-1]["moisture"] == 30
    assert charts["nutrientLevels"][0]["current"] == 40


def test_settings_merge(client):
    res = client.put("/api/settings", json={"profile": {"name": "Tannu"}, "preferences": {"alertThreshold": 40}})
    assert res.status_code == 200
    s = client.get("/api/settings").json
    assert s["profile"]["name"] == "Tannu" and s["profile"]["farmName"] == "Green Valley Eco Farm"
    assert s["preferences"]["alertThreshold"] == 40
    assert client.put("/api/settings", json=[1]).status_code == 400


def test_weather_sample(client):
    w = client.get("/api/weather?fieldId=1").json
    assert w["source"] == "sample" and len(w["forecast"]) == 5


def test_unknown_routes(client):
    assert client.get("/api/nope").status_code == 404
    assert client.get("/api/fields/999").status_code == 404


def test_parse_coordinates():
    assert parse_coordinates("28.6139° N, 77.2090° E") == (28.6139, 77.209)
    assert parse_coordinates("33.8° S, 151.2° E") == (-33.8, 151.2)
    assert parse_coordinates("21.1458, 79.0882") == (21.1458, 79.0882)
    assert parse_coordinates("Farm Location") is None


def test_open_meteo_mapping():
    days = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]
    hours = [f"2026-10-04T{h:02d}:00" for h in range(24)]
    sample = {
        "current": {"temperature_2m": 29.4, "relative_humidity_2m": 71, "weather_code": 63,
                    "wind_speed_10m": 11.2, "pressure_msl": 1008.6, "dew_point_2m": 23.1, "uv_index": 5.6},
        "daily": {"time": days, "weather_code": [63, 0, 2, 95, 3],
                  "temperature_2m_max": [31, 32, 33, 30, 29], "temperature_2m_min": [23, 22, 23, 22, 21],
                  "precipitation_sum": [8.4, 0, 0.2, 21, None],
                  "precipitation_probability_max": [80, 5, 10, 90, None]},
        "hourly": {"time": hours, "temperature_2m": list(range(24)),
                   "relative_humidity_2m": [70] * 24, "precipitation_probability": [10] * 24},
    }
    w = map_open_meteo(sample, now=datetime(2026, 10, 4, 10, 0))
    assert w["current"]["condition"] == "Moderate Rain" and w["current"]["temp"] == 29
    assert [d["day"] for d in w["forecast"]] == ["Today", "Tomorrow", "Tue", "Wed", "Thu"]
    assert [d["icon"] for d in w["forecast"]] == ["cloud-rain", "sun", "cloud-sun", "cloud-lightning", "cloud-sun"]
    assert w["forecast"][4]["rainfall"] == 0 and w["forecast"][4]["rainProb"] == 0
    assert [h["time"] for h in w["hourly"]] == ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
