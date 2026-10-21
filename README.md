# AgriSense --- Smart Field Insights

A data-driven agricultural advisory platform providing crop-specific
fertilizer recommendations, irrigation predictions, weather insights,
and field report management.

## Table of Contents

-   [Overview](#overview)
-   [Objectives](#objectives)
-   [Features](#features)
-   [Technology Stack](#technology-stack)
-   [Architecture](#architecture)
-   [Machine Learning Models](#machine-learning-models)
-   [Dataset and Evaluation](#dataset-and-evaluation)
-   [Project Structure](#project-structure)
-   [Installation](#installation)
-   [Environment Variables](#environment-variables)
-   [API Endpoints](#api-endpoints)
-   [Testing](#testing)
-   [Limitations](#limitations)
-   [Future Scope](#future-scope)
-   [Contributing](#contributing)
-   [License](#license)

## Overview

AgriSense is a web-based agricultural advisory platform that brings
crop, soil, and weather-related information into a single interface. It
provides fertilizer-category predictions, irrigation-need
classification, weather-informed crop water insights, model
feature-importance information, and field report management.

## Objectives

-   Classify irrigation requirements using crop, growth-stage, weather,
    and soil-related inputs.
-   Recommend fertilizer categories using soil characteristics, crop
    information, growth stage, and nutrient values.
-   Integrate weather data from Open-Meteo.
-   Calculate indicative crop water-use and climate water-deficit
    estimates.
-   Present model feature importance to help users understand model
    behaviour.
-   Store field information and reports in MongoDB.

## Features

### Irrigation Need Prediction

Classifies irrigation need as **Low**, **Medium**, or **High** using a
trained Decision Tree classifier.

### Fertilizer Recommendation

Predicts one of the configured fertilizer categories: **DAP**, **Urea**,
or **10:26:26**, using a trained Random Forest classifier.

### Weather and Crop Water Insights

Uses Open-Meteo weather data, including rainfall and reference
evapotranspiration (ET₀), alongside crop-stage information to calculate
indicative crop water use and climate water deficit. Modelled
soil-moisture values may also be displayed.

### Model Insights

Displays feature-importance information for the selected models. Feature
importance describes model reliance; it does not establish causation for
an individual prediction.

### Field and Report Management

Supports field-related workflows, saving field reports, and accessing
saved reports through History. The interface also provides print and
summary-sharing actions.

### User Authentication

Includes signup, login, and authenticated-user endpoints.

## Technology Stack

  -----------------------------------------------------------------------
  Category                            Technologies
  ----------------------------------- -----------------------------------
  Frontend                            React.js, JavaScript, HTML, CSS

  Backend                             Python, Flask

  Machine Learning                    scikit-learn

  Data Processing                     pandas, NumPy

  Models Evaluated                    Decision Tree, Random Forest,
                                      Artificial Neural Network (ANN)

  Database                            MongoDB

  Weather Data                        Open-Meteo API

  HTTP Requests                       Python Requests

  Model Persistence                   joblib

  API Communication                   REST API, JSON

  Development Tools                   Git, GitHub, VS Code, Postman

  Package Management                  npm, Python pip
  -----------------------------------------------------------------------

Confirm the exact dependencies and versions in `package.json` and the
backend dependency file before publishing.

## Architecture

AgriSense uses a client-server architecture.

``` text
User
 |
 v
React.js Frontend
 |
 | REST API / JSON
 v
Flask Backend
 |-------------------|
 v         v         v
Irrigation Fertilizer Weather
Model     Model     Service
 |         |         |
 +---------+---------+
           |
           v
     Response Processing
           |
      +----+----+
      v         v
  Dashboard   MongoDB
  and Insights  |
                v
          Saved Field Reports
```

### Prediction Workflow

1.  The user enters or selects field and crop information.
2.  The frontend sends a JSON request to the Flask backend.
3.  The backend validates the input and prepares the model features.
4.  The relevant trained model generates a prediction.
5.  The backend returns the prediction and available supporting
    information.
6.  The frontend displays the results.

## Machine Learning Models

### Irrigation Model

-   **Selected model:** Decision Tree Classifier
-   **Target:** `Irrigation_Need`
-   **Classes:** Low, Medium, High
-   **Features:** District, location, latitude, longitude, crop, crop
    stage, temperature, humidity, rainfall, ET₀, surface soil moisture,
    deeper soil moisture, and soil temperature.

### Fertilizer Model

-   **Selected model:** Random Forest Classifier
-   **Target:** `Fertilizer_Recommendation`
-   **Classes:** DAP, Urea, 10:26:26
-   **Features:** Soil type, crop, crop stage, pH, nitrogen (N),
    phosphorus (P), and potassium (K).

Decision Tree, Random Forest, and ANN models were evaluated during
training. The selected model for each task is determined by the
project's training pipeline.

## Dataset and Evaluation

  ---------------------------------------------------------------------------------
  Dataset                                             Records Purpose
  ------------------------------ ---------------------------- ---------------------
  `irrigation_model_ready.csv`                          2,920 Irrigation-need
                                                              classification

  `fertilizer.csv`                                        257 Fertilizer-category
                                                              prediction
  ---------------------------------------------------------------------------------

### Reported Evaluation Results

  Task         Selected Model     Accuracy   Macro F1-Score
  ------------ ---------------- ---------- ----------------
  Irrigation   Decision Tree        96.75%           96.76%
  Fertilizer   Random Forest        90.38%           75.73%

These results are based on the held-out test splits used during
training. The fertilizer dataset has an uneven class distribution, so
accuracy alone does not fully describe performance across all classes.
These metrics do not establish real-world agricultural accuracy;
independent validation using representative field observations is
required.

## Project Structure

The main files and folders identified during development are shown
below. Adjust this overview to match the final repository.

``` text
AgriSense/
├── backend/
│   ├── app.py
│   ├── irrigation_advisory.py
│   ├── build_crop_dataset.py
│   ├── train_models.py
│   ├── data/
│   │   ├── fertilizer.csv
│   │   ├── irrigation.csv
│   │   ├── irrigation_model_ready.csv
│   │   ├── irrigation_real_weather_enriched.csv
│   │   └── nagpur_crop_water_demand.csv
│   ├── models/
│   │   ├── irrigation_pipeline.joblib
│   │   └── fertilizer_pipeline.joblib
│   ├── reports/
│   │   ├── irrigation_evaluation.json
│   │   └── fertilizer_evaluation.json
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

## Installation

### Prerequisites

-   Python 3.11 or another compatible Python version
-   Node.js and npm
-   MongoDB, locally or hosted
-   Git

### 1. Clone the repository

``` bash
git clone <YOUR_REPOSITORY_URL>
cd AgriSense
```

Replace `<YOUR_REPOSITORY_URL>` and `AgriSense` with the actual
repository URL and folder name.

### 2. Set up the backend

``` cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

If `requirements.txt` is not present, create it from the project's
verified dependencies before sharing the repository.

### 3. Configure environment variables

Create a `.env` file in the backend directory using the variable names
expected by `app.py`. For example:

``` env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
```

Do not commit credentials, tokens, or private connection strings.

### 4. Train the models

If trained model files are not available, run:

``` cmd
python train_models.py
```

### 5. Start the backend

``` cmd
python app.py
```

The backend used port `5000` during development. Check the health
endpoint:

``` bash
curl http://127.0.0.1:5000/api/health
```

A successful response should report the application status, model
readiness, and database connection status.

### 6. Set up the frontend

Open a second terminal:

``` bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by the development server and confirm that
the frontend API configuration points to the backend.

## Environment Variables

  Variable       Purpose
  -------------- --------------------------------------------
  `MONGO_URI`    MongoDB connection string
  `JWT_SECRET`   Secret used for JWT-related authentication

Document any additional variables required by the final configuration.
Consider providing a `.env.example` file with placeholder values.

## API Endpoints

The Flask backend exposes the following routes.

### Health

  Method   Endpoint        Purpose
  -------- --------------- ------------------------------------------------
  GET      `/`             API welcome/status information
  GET      `/api/health`   Check model readiness and MongoDB connectivity

### Authentication

  Method   Endpoint             Purpose
  -------- -------------------- -----------------------------------------
  POST     `/api/auth/signup`   Register a user
  POST     `/api/auth/login`    Authenticate a user
  GET      `/api/auth/me`       Retrieve authenticated-user information

### Field Management

  Method   Endpoint                   Purpose
  -------- -------------------------- ---------------------------
  GET      `/api/fields`              Retrieve fields
  POST     `/api/fields`              Create a field
  GET      `/api/fields/<field_id>`   Retrieve a specific field

### Predictions and Advisory

  ----------------------------------------------------------------------------
  Method                  Endpoint                     Purpose
  ----------------------- ---------------------------- -----------------------
  POST                    `/api/fertilizer/predict`    Predict a fertilizer
                                                       category

  POST                    `/api/irrigation/predict`    Predict irrigation need

  POST                    `/api/analyze`               Run the combined
                                                       analysis workflow

  POST                    `/api/irrigation/advisory`   Retrieve
                                                       weather-informed crop
                                                       water insights
  ----------------------------------------------------------------------------

### Weather and Saved Analyses

  -------------------------------------------------------------------------------
  Method                  Endpoint                        Purpose
  ----------------------- ------------------------------- -----------------------
  GET                     `/api/weather`                  Retrieve weather
                                                          information

  GET                     `/api/analyses`                 Retrieve saved analyses

  GET                     `/api/analyses/<analysis_id>`   Retrieve a specific
                                                          saved analysis
  -------------------------------------------------------------------------------

Some endpoints may require authentication. Use the authorization
mechanism implemented by the backend.

### Example: Fertilizer Prediction

Request:

``` http
POST /api/fertilizer/predict
Content-Type: application/json
```

``` json
{
  "Soil_Type": "Black Soil",
  "Crop": "Cotton",
  "Crop_Stage": "Vegetative",
  "pH": 6.8,
  "N": 40,
  "P": 25,
  "K": 30
}
```

Example response:

``` json
{
  "task": "fertilizer",
  "prediction": "Urea",
  "model_based": true,
  "model_name": "RandomForestClassifier"
}
```

The actual response may also contain class probabilities, feature
importance, and explanatory metadata. The result depends on the supplied
input and trained model.

### Example: Irrigation Prediction

Request:

``` http
POST /api/irrigation/predict
Content-Type: application/json
```

``` json
{
  "district": "Nagpur",
  "location": "Nagpur",
  "latitude": 21.1458,
  "longitude": 79.0882,
  "Crop": "Cotton",
  "Crop_Stage": "Vegetative",
  "temperature_mean_c": 30,
  "humidity_mean_pct": 55,
  "rainfall_mm": 2,
  "et0_mm": 5,
  "soil_moisture_0_7cm_m3m3": 0.20,
  "soil_moisture_7_28cm_m3m3": 0.24,
  "soil_temperature_0_7cm_c": 28
}
```

These values demonstrate the request format; they are not verified field
measurements.

## Testing

The following checks were performed during development: - Training and
evaluation of both models. - Confirmation that selected model pipelines
were saved. - Backend health endpoint verification. - Verification of
MongoDB connectivity and model loading. - Successful requests to
fertilizer and irrigation prediction endpoints. - Frontend rendering of
predictions, probabilities, and feature-importance information. - Field
report saving and History retrieval. - Climate water-deficit display
verification after correcting the frontend field mapping. - Source and
dataset text scans for unwanted terminology.

The reported metrics are dataset-based results, not independent
field-validation results. Before production deployment, also test
authentication, invalid inputs, external-service failures, database
errors, and report actions in the intended deployment environment.

## Limitations

-   Predictions depend on the quality and coverage of the training data.
-   The fertilizer dataset has an imbalanced class distribution.
-   Evaluation scores do not guarantee performance on unseen
    agricultural conditions.
-   Weather and soil-moisture values from external services are
    estimates and may differ from field conditions.
-   Crop coefficients and growth-stage mapping require local validation.
-   Climate water deficit is an estimate, not a validated irrigation
    dose.
-   The platform does not independently establish fertilizer quantity,
    irrigation volume, or watering schedule.
-   Confirm agricultural decisions with field observations, soil tests,
    and local agricultural guidance.

## Future Scope

-   Validate models using field-collected agricultural data.
-   Improve class balance and dataset coverage.
-   Add more crops, soil types, and geographical regions.
-   Monitor model performance and retrain with verified observations.
-   Expand automated API and error-handling tests.
-   Add historical weather analysis and trend visualization.
-   Improve report export, deployment monitoring, and logging.

## Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Implement and test your changes.
4.  Commit changes with a descriptive message.
5.  Open a pull request describing the changes.

Do not commit credentials, private data, or unverified agricultural
recommendations.

## License

A license has not been specified in this document. Add an appropriate
license file before distributing the project publicly.

------------------------------------------------------------------------

**AgriSense --- Smart Field Insights**

A data-driven platform for agricultural predictions, weather-informed
insights, and field report management.
