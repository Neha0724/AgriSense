# AgriSense

**Smart Crop Insights & Field Management Platform**

AgriSense is a web-based agricultural platform that helps farmers manage field information and access crop-specific fertilizer recommendations, irrigation assessments, and weather-based insights through a single dashboard.

It combines a React frontend, Flask REST API, machine learning models, MongoDB storage, and weather data from Open-Meteo.

## Live Application

- **Frontend:** https://agri-sense-liard.vercel.app
- **Backend API:** https://agrisense-backend-d3ap.onrender.com

*Note: The backend URL provides API services; it is not a separate frontend website.*

## Features

- **User Authentication:** Account registration and login.
- **Field Management:** Add and manage agricultural field information.
- **Fertilizer Recommendation:** Predict fertilizer categories using soil, crop, crop stage, and nutrient information.
- **Irrigation Assessment:** Classify irrigation requirements as Low, Medium, or High.
- **Weather Insights:** Retrieve weather information using Open-Meteo.
- **Field Analysis:** Combine field inputs, predictions, and weather-related information into one analysis.
- **Dashboard:** View field insights and recommendations.
- **Analysis History:** Access saved field analyses.
- **Field Reports:** Print reports and share analysis summaries.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, Flask, Flask-CORS |
| Machine Learning | scikit-learn, Decision Tree, Random Forest |
| Database | MongoDB, PyMongo |
| Weather Data | Open-Meteo API |
| Authentication | JWT, Werkzeug |
| Deployment | Vercel (frontend), Render (backend) |
| Model Persistence | Joblib |

## Machine Learning

AgriSense uses separate trained models for fertilizer recommendation and irrigation assessment.

| Task | Selected Model | Accuracy | Macro F1-Score |
|---|---|---:|---:|
| Irrigation assessment | Decision Tree | 96.75% | 96.76% |
| Fertilizer recommendation | Random Forest | 90.38% | 75.73% |

These metrics were obtained from held-out evaluation data. They describe model performance on that evaluation split and do not establish real-world agricultural effectiveness.

### Prediction Categories

- **Fertilizer:** DAP, Urea, and 10:26:26.
- **Irrigation:** Low, Medium, and High.

Recommendations depend on the inputs provided and the information available to the application. They should be checked against local soil conditions and agricultural guidance before field application.

## System Architecture

```text
User
  |
  v
React + Vite Frontend
  |
  v
Flask REST API
  |
  +---- User Authentication
  |
  +---- Field Management
  |
  +---- Fertilizer Model
  |
  +---- Irrigation Model
  |
  +---- Open-Meteo Weather Data
  |
  v
MongoDB
  |
  v
Dashboard, Analysis History and Reports
```

## Project Structure

```text
AgriSense/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── app.py
│   ├── irrigation_advisory.py
│   ├── train_models.py
│   ├── build_crop_dataset.py
│   ├── models/
│   │   ├── fertilizer_pipeline.joblib
│   │   └── irrigation_pipeline.joblib
│   ├── requirements.txt
│   └── ...
├── data/
├── reports/
└── README.md
```

*The structure above summarizes the main components; individual files may vary by version.*

## Local Setup

### Prerequisites

- Python 3.11 or another compatible Python version
- Node.js and npm
- MongoDB connection string
- Git

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AgriSense
```

Replace the placeholder with your repository URL.

### 2. Configure the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment.

**Windows:**

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `backend/.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
FRONTEND_ORIGIN=http://localhost:5173
FLASK_HOST=127.0.0.1
FLASK_PORT=5000
FLASK_DEBUG=false
```

Use your own credentials. Never commit `.env` or expose secrets in frontend code.

Ensure the trained model files are available in the backend's configured model directory.

Start the backend:

```bash
python app.py
```

The local API runs at `http://localhost:5000` with the default configuration.

### 3. Configure the frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Deployment Configuration

### Frontend — Vercel

Deploy the `frontend` directory as the project root.

Configure this environment variable:

```env
VITE_API_URL=https://agrisense-backend-d3ap.onrender.com
```

The frontend must read the same variable name using `import.meta.env.VITE_API_URL`. Redeploy after changing environment variables.

### Backend — Render

Configure the `backend` directory as the root directory.

**Build command:**

```bash
pip install -r requirements.txt
```

**Start command:**

```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

Set the required environment variables in Render:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

Set `FRONTEND_ORIGIN` to the deployed Vercel origin, including `https://` and without a trailing slash. Add any other Vercel deployment origins that need access, separated by commas.

Ensure the model files are included in the deployment and load successfully at startup.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Root endpoint |
| GET | `/api/health` | Service health check |
| POST | `/api/auth/signup` | Register an account |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve authenticated user information |
| GET | `/api/fields` | List fields |
| POST | `/api/fields` | Create a field |
| GET | `/api/fields/<field_id>` | Retrieve field details |
| POST | `/api/fertilizer/predict` | Generate a fertilizer prediction |
| POST | `/api/irrigation/predict` | Generate an irrigation assessment |
| POST | `/api/analyze` | Analyze field information |
| GET | `/api/analyses` | Retrieve analysis history |
| GET | `/api/analyses/<analysis_id>` | Retrieve a saved analysis |
| GET | `/api/weather` | Retrieve weather information |
| POST | `/api/irrigation/advisory` | Generate irrigation advisory information |

Protected endpoints may require authentication. Refer to the backend implementation for request fields and response formats.

## Security and Usage Notes

- Store database credentials and authentication secrets in deployment environment variables.
- Configure CORS to allow only the intended frontend origins.
- Keep trained model files available to the backend at runtime.
- Predictions are decision-support information, not guaranteed crop outcomes or substitutes for local agricultural expertise.

## License

Add a license file to the repository if you intend to distribute the project under an open-source license.