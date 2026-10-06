import os

from dotenv import load_dotenv

load_dotenv()


def _bool(name, default):
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "agrisense")
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
    SEED_ON_START = _bool("SEED_ON_START", True)
    WEATHER_SOURCE = os.getenv("WEATHER_SOURCE", "live").strip().lower()
    DEFAULT_LAT = float(os.getenv("DEFAULT_LAT", "21.1458"))
    DEFAULT_LON = float(os.getenv("DEFAULT_LON", "79.0882"))
    MODEL_PATH = os.getenv("MODEL_PATH", "").strip()
