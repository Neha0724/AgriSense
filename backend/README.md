# AgriSense Backend (Flask + MongoDB)

REST API for the AgriSense React frontend. It stores fields, analyses, history and
settings in MongoDB, runs the irrigation + fertilizer recommendation engine, and
serves weather from the free Open-Meteo API.

## 1. Setup

You need **Python 3.10+** and **MongoDB** (either installed locally, or a free
MongoDB Atlas cluster).

```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
```

Edit `.env` if needed (MongoDB URI etc.). No MongoDB yet? Set
`MONGO_URI=mongomock://` and `pip install mongomock` to try the app with an
in-memory database (data disappears when the server stops).

## 2. Run

```bash
python run.py
```

The API runs on http://localhost:5000. Check http://localhost:5000/api/health.
On first start, the database is filled with the same sample fields, history and
settings the frontend used to show.

Then in another terminal, from the project root:

```bash
npm install
npm run dev
```

The frontend (http://localhost:3000) forwards all `/api` calls to the backend.

## 3. API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server status |
| GET | `/api/fields` | All fields (newest first) |
| GET | `/api/fields/<id>` | One field |
| POST | `/api/fields` | Register a field (`name`, `area` required) |
| POST | `/api/analyze` | Run analysis; returns irrigation + fertilizer recommendation and updates the field |
| GET | `/api/recommendations/active?fieldId=` | Latest analysis (optionally for one field) |
| GET | `/api/history` | Saved recommendations |
| POST | `/api/history` | Save a recommendation (send the analysis result) |
| GET | `/api/weather?fieldId=` | Current + 5-day + hourly weather for the field's coordinates |
| GET | `/api/analytics?fieldId=` | Chart data for the dashboard |
| GET | `/api/settings` | Farmer profile, preferences, notifications |
| PUT | `/api/settings` | Update any of those sections (merged, not replaced) |

Invalid input returns HTTP 400 with `{"error": "Invalid input", "details": {field: message}}`.

`/api/analyze` body:

```json
{
  "fieldId": 1, "soilMoisture": 42, "nitrogen": 48, "phosphorus": 32, "potassium": 41,
  "temperature": 28, "humidity": 65, "rainfall": 12,
  "cropType": "Wheat", "growthStage": "Vegetative"
}
```

**Weather:** with `WEATHER_SOURCE=live`, coordinates are read from the field
(format `21.1458° N, 79.0882° E`, or plain `21.1458, 79.0882`), falling back to
`DEFAULT_LAT`/`DEFAULT_LON`. If Open-Meteo can't be reached, sample data is
served and the response has `"source": "sample"`.

**Analytics:** moisture and rainfall trends come from real analysis records once a
field has 2 or more; until then sample trends are shown (`"source": "sample"`).
Nutrient levels always reflect the field's current N-P-K. Irrigation history is
sample data (the app doesn't record water actually applied yet).

## 4. Plugging in your ML model

Until a model is configured, `/api/analyze` uses the rule-based logic in
`app/ml/rules.py` (responses include `"engine": "rule-based"`).

To use your trained model:

1. `pip install -r requirements-ml.txt`
2. Train scikit-learn **Pipelines** that take raw columns (do your encoding,
   e.g. `OneHotEncoder` for `cropType`/`growthStage`, inside the pipeline):
   - `irrigation_model`: predicts water needed in **L/m²** (one number)
   - `fertilizer_model`: predicts **[N, P, K] in kg/ha** (three numbers)

   Input columns: `soilMoisture, nitrogen, phosphorus, potassium, temperature,
   humidity, rainfall, cropType, growthStage`
3. Save them together:

   ```python
   import joblib
   joblib.dump({
       "irrigation_model": irrigation_pipeline,
       "fertilizer_model": fertilizer_pipeline,
       "features": ["soilMoisture", "nitrogen", "phosphorus", "potassium",
                    "temperature", "humidity", "rainfall", "cropType", "growthStage"],
       "irrigation_confidence": 92,   # optional: e.g. from your validation score
       "fertilizer_confidence": 89,   # optional
   }, "models/agrisense_model.joblib")
   ```
4. Set `MODEL_PATH=models/agrisense_model.joblib` in `.env` and restart.

Responses will then show `"engine": "ml-model"`. You can provide just one of the
two models; the other part keeps using the rules. If the file is missing or
broken, the server logs an error and falls back to the rules instead of failing.
`tests/test_model_hook.py` shows a complete working example.

## 5. Tests

```bash
pip install -r requirements-dev.txt
python -m pytest
```

Tests use an in-memory database, so MongoDB doesn't need to be running.

## Project layout

```
backend/
├── run.py                 # entry point
├── app/
│   ├── __init__.py        # create_app(): config, CORS, error handlers
│   ├── config.py          # reads .env
│   ├── db.py              # MongoDB connection + id counters
│   ├── seed.py, seed_data.py
│   ├── ml/
│   │   ├── engine.py      # recommend(): model if configured, else rules
│   │   └── rules.py       # rule-based irrigation & fertilizer logic
│   ├── services/weather.py  # Open-Meteo client + fallback
│   └── routes/            # fields, analysis, weather, analytics, settings
└── tests/
```

## Note

There is no login yet: the API serves a single farm profile, which matches the
current frontend (it has no sign-in screen). Add authentication before putting
real user data online.
