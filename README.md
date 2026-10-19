# AgriSense

## Project structure

- `frontend/`: React + Vite user interface.
- `backend/`: Flask API, MongoDB authentication and persistence, ML training script, datasets, and model output folders.

## Requirements

- Node.js 20+
- Python 3.11 recommended
- MongoDB Atlas account or local MongoDB

## 1. Configure MongoDB and backend

Open `backend/.env.example`, copy it to `backend/.env`, and fill `MONGO_URI` with your MongoDB connection string. Set a long random `JWT_SECRET`. Add `http://localhost:5173` to `FRONTEND_ORIGIN`. Never commit `.env`.

PowerShell from the project root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python train_models.py
python app.py
```

`train_models.py` reads the included CSVs and creates `backend/models/fertilizer_pipeline.joblib` and `backend/models/irrigation_pipeline.joblib`. It also writes evaluation reports under `backend/reports/`. The model files are generated locally because joblib binaries are environment/version dependent.

Check `http://127.0.0.1:5000/api/health`. It should show MongoDB connected and both models ready.

## 2. Run frontend

Open a second terminal from the project root:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. Keep both terminals running.

## User flow

1. Sign up or log in. Passwords are hashed before storage.
2. Add a field. Field data is stored in MongoDB and associated with the signed-in user.
3. Run an analysis from the Soil Analysis page.
4. Both ML models run and the complete input, both predictions, class probabilities, field ID, and timestamp are stored as a new document in `analyses`.
5. The history page retrieves prior analyses from MongoDB. Re-running with changed inputs creates another record rather than overwriting the previous result.

## MongoDB collections

- `users`: name, email, password hash, creation time.
- `fields`: each user's field details.
- `analyses`: every prediction run and its input values.

## API routes

- `GET /api/health`
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/fields`, `POST /api/fields`, `GET /api/fields/<id>`, `DELETE /api/fields/<id>`
- `POST /api/analyze`
- `GET /api/analyses`, `GET /api/analyses/<id>`

## Important model limitation

The supplied datasets support Cotton/Soybean, Black/Red/Alluvial/Laterite soil, and Germination/Vegetative/Flowering/Maturity stages. The models classify fertilizer category and irrigation need only. They do not calculate fertilizer dosage, water volume, or timing. Predictions are prototype outputs and must not be treated as verified agricultural prescriptions.


## Local ports and backend configuration
- Frontend (Vite): `http://localhost:3000`
- Flask backend: `http://127.0.0.1:5000`
- Set `FRONTEND_ORIGIN=http://localhost:3000,http://127.0.0.1:3000` in `backend/.env` for CORS.
- Set a non-empty, private `JWT_SECRET` in `backend/.env`; the backend now stops at startup if it is missing instead of failing during token generation.
- Set `MONGO_URI` and `MONGO_DB_NAME` in `backend/.env`. Never commit the real `.env` file.

### Start backend (PowerShell)
```powershell
cd C:\IdeaLab\backend
.\.venv\Scripts\Activate.ps1
python app.py
```

### Start frontend (second terminal)
```powershell
cd C:\IdeaLab\frontend
npm install
npm run dev
```

Copy `backend/.env.example` to `backend/.env` and replace the MongoDB URI and JWT secret placeholders before starting.
