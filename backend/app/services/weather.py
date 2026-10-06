"""Weather data: live from Open-Meteo (free, no API key) with sample-data fallback."""
import copy
import logging
import re
import time
from datetime import datetime

import requests

from ..seed_data import WEATHER as SAMPLE_WEATHER

log = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_SECONDS = 15 * 60
_cache = {}

# WMO weather codes -> (label, frontend icon name)
WMO = {
    0: ("Clear", "sun"), 1: ("Mainly Clear", "sun"), 2: ("Partly Cloudy", "cloud-sun"),
    3: ("Overcast", "cloud-sun"), 45: ("Fog", "cloud-sun"), 48: ("Fog", "cloud-sun"),
    51: ("Light Drizzle", "cloud-rain"), 53: ("Drizzle", "cloud-rain"), 55: ("Heavy Drizzle", "cloud-rain"),
    61: ("Light Rain", "cloud-rain"), 63: ("Moderate Rain", "cloud-rain"), 65: ("Heavy Rain", "cloud-rain"),
    80: ("Rain Showers", "cloud-rain"), 81: ("Rain Showers", "cloud-rain"), 82: ("Heavy Showers", "cloud-rain"),
    95: ("Thunderstorm", "cloud-lightning"), 96: ("Thunderstorm", "cloud-lightning"),
    99: ("Thunderstorm", "cloud-lightning"),
}


def describe(code):
    return WMO.get(int(code or 0), ("Cloudy", "cloud-sun"))


def parse_coordinates(text):
    """'28.6139° N, 77.2090° E' -> (28.6139, 77.209). Returns None if unparseable."""
    if not text:
        return None
    m = re.findall(r"(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?", str(text), re.I)
    if len(m) < 2:
        return None
    (lat, ns), (lon, ew) = m[0], m[1]
    lat, lon = float(lat), float(lon)
    if ns.upper() == "S":
        lat = -lat
    if ew.upper() == "W":
        lon = -lon
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    return lat, lon


def _r(v):
    return None if v is None else round(v)


def map_open_meteo(data, now=None):
    """Convert an Open-Meteo response into the frontend's weather shape."""
    now = now or datetime.now()
    cur = data["current"]
    d = data["daily"]
    label, _ = describe(cur.get("weather_code"))
    current = {
        "temp": _r(cur.get("temperature_2m")),
        "condition": label,
        "humidity": _r(cur.get("relative_humidity_2m")),
        "rainfall": round(d["precipitation_sum"][0] or 0, 1),
        "windSpeed": _r(cur.get("wind_speed_10m")),
        "pressure": _r(cur.get("pressure_msl")),
        "uvIndex": _r(cur.get("uv_index")) or 0,
        "dewPoint": _r(cur.get("dew_point_2m")),
    }

    forecast = []
    for i, day in enumerate(d["time"][:5]):
        date = datetime.strptime(day, "%Y-%m-%d")
        name = "Today" if i == 0 else "Tomorrow" if i == 1 else date.strftime("%a")
        label, icon = describe(d["weather_code"][i])
        forecast.append({
            "day": name,
            "temp": _r(d["temperature_2m_max"][i]),
            "tempLow": _r(d["temperature_2m_min"][i]),
            "condition": label,
            "rainProb": _r(d["precipitation_probability_max"][i]) or 0,
            "rainfall": round(d["precipitation_sum"][i] or 0, 1),
            "icon": icon,
        })

    h = data["hourly"]
    wanted = {f"{d['time'][0]}T{hh:02d}:00" for hh in (6, 9, 12, 15, 18, 21)}
    hourly = [
        {"time": t[11:16], "temp": _r(h["temperature_2m"][i]),
         "humidity": _r(h["relative_humidity_2m"][i]),
         "rainProb": _r(h["precipitation_probability"][i]) or 0}
        for i, t in enumerate(h["time"]) if t in wanted
    ]
    return {"source": "live", "updatedAt": now.strftime("%Y-%m-%d %H:%M"),
            "current": current, "forecast": forecast, "hourly": hourly}


def fetch_live(lat, lon):
    key = (round(lat, 2), round(lon, 2))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_SECONDS:
        return copy.deepcopy(hit[1])
    params = {
        "latitude": lat, "longitude": lon, "timezone": "auto", "forecast_days": 5,
        "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,"
                   "pressure_msl,dew_point_2m,uv_index",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,"
                 "precipitation_probability_max",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability",
    }
    resp = requests.get(OPEN_METEO_URL, params=params, timeout=6)
    resp.raise_for_status()
    result = map_open_meteo(resp.json())
    _cache[key] = (time.time(), result)
    return copy.deepcopy(result)


def get_weather(source, lat, lon):
    if source == "live":
        try:
            return fetch_live(lat, lon)
        except Exception as exc:
            log.warning("Live weather unavailable (%s); serving sample data.", exc)
    return copy.deepcopy(SAMPLE_WEATHER)
