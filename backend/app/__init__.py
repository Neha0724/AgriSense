import logging

from flask import Flask, jsonify
from flask_cors import CORS
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from .config import Config
from .db import init_db
from .routes import api
from .routes.validation import ValidationError
from .seed import seed_if_empty


def create_app(overrides=None):
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    app = Flask(__name__)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    db = init_db(app)
    if app.config["SEED_ON_START"]:
        try:
            seed_if_empty(db)
        except ServerSelectionTimeoutError:
            raise SystemExit(
                f"\n[AgriSense] Cannot connect to MongoDB at {app.config['MONGO_URI']}.\n"
                "Start MongoDB, or set MONGO_URI in backend/.env (Atlas URI or 'mongomock://').\n"
            )

    app.register_blueprint(api)

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", weatherSource=app.config["WEATHER_SOURCE"],
                       modelConfigured=bool(app.config["MODEL_PATH"]))

    @app.errorhandler(ValidationError)
    def handle_validation(err):
        return jsonify(error="Invalid input", details=err.errors), 400

    @app.errorhandler(ServerSelectionTimeoutError)
    def handle_db_down(err):
        return jsonify(error="Database unavailable. Is MongoDB running?"), 503

    @app.errorhandler(PyMongoError)
    def handle_db_error(err):
        app.logger.exception(err)
        return jsonify(error="Database error"), 500

    @app.errorhandler(404)
    def not_found(err):
        return jsonify(error="Not found"), 404

    @app.errorhandler(405)
    def method_not_allowed(err):
        return jsonify(error="Method not allowed"), 405

    return app
