import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402


@pytest.fixture
def client():
    app = create_app({"MONGO_URI": "mongomock://", "WEATHER_SOURCE": "sample",
                      "MODEL_PATH": "", "TESTING": True})
    return app.test_client()
