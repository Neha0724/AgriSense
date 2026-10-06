from flask import Blueprint

api = Blueprint("api", __name__, url_prefix="/api")

# Import route modules so they register on the blueprint
from . import analysis, analytics, fields, settings, weather  # noqa: E402,F401
