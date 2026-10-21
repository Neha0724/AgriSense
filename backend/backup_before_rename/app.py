from pathlib import Path
from datetime import datetime, timedelta, timezone
from functools import wraps
import os
import joblib
import pandas as pd
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from pymongo import MongoClient, DESCENDING
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from dotenv import load_dotenv
import requests
from datetime import date
from flask import request, jsonify
from irrigation_advisory import get_crop_stage, get_water_estimate

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env')
MODEL_DIR = ROOT / 'models'
app = Flask(__name__)
JWT_SECRET = os.getenv('JWT_SECRET', '').strip()
if not JWT_SECRET:
    raise RuntimeError('JWT_SECRET is missing. Add a strong JWT_SECRET to backend/.env and restart the backend.')
app.config['SECRET_KEY'] = JWT_SECRET
allowed_origins = [origin.strip() for origin in os.getenv('FRONTEND_ORIGIN', 'agri-sense-liard.vercel.app').split(',') if origin.strip()]
CORS(app, resources={r'/api/*': {'origins': allowed_origins}})

mongo_uri = os.getenv('MONGO_URI', '').strip()
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000) if mongo_uri else None
db = client[os.getenv('MONGO_DB_NAME', 'agrisense')] if client else None
if db is not None:
    try:
        client.admin.command('ping')
        db.users.create_index('email', unique=True)
        db.fields.create_index([('user_id', 1), ('created_at', -1)])
        db.analyses.create_index([('user_id', 1), ('created_at', -1)])
        print('MongoDB connected')
    except Exception as exc:
        print(f'WARNING: MongoDB connection failed: {exc}')

MODELS = {}
for name in ('fertilizer', 'irrigation'):
    p = MODEL_DIR / f'{name}_pipeline.joblib'
    if p.exists():
        MODELS[name] = joblib.load(p)

FEATURES = {
    'fertilizer': ['Soil_Type', 'Crop', 'Crop_Stage', 'pH', 'N', 'P', 'K'],
    'irrigation': [
        'district', 'location', 'latitude', 'longitude', 'Crop', 'Crop_Stage',
        'temperature_mean_c', 'humidity_mean_pct', 'rainfall_mm', 'et0_mm',
        'soil_moisture_0_7cm_m3m3', 'soil_moisture_7_28cm_m3m3',
        'soil_temperature_0_7cm_c',
    ],
}

IRRIGATION_NUMERIC_FEATURES = {
    'latitude', 'longitude', 'temperature_mean_c', 'humidity_mean_pct',
    'rainfall_mm', 'et0_mm', 'soil_moisture_0_7cm_m3m3',
    'soil_moisture_7_28cm_m3m3', 'soil_temperature_0_7cm_c',
}


def fetch_irrigation_weather(location, district='Nagpur'):
    # Fetch today's weather and soil estimates for the irrigation model.
    search_location = str(location or district or 'Nagpur').strip()
    if not search_location:
        search_location = 'Nagpur'

    geo_response = requests.get(
        'https://geocoding-api.open-meteo.com/v1/search',
        params={'name': search_location, 'count': 10, 'language': 'en', 'format': 'json'},
        timeout=15,
    )
    geo_response.raise_for_status()
    places = geo_response.json().get('results', [])
    place = next((item for item in places if item.get('country_code') == 'IN'), None)
    if not place:
        raise ValueError(f'Could not find an Indian location for: {search_location}')

    response = requests.get(
        'https://api.open-meteo.com/v1/forecast',
        params={
            'latitude': place['latitude'],
            'longitude': place['longitude'],
            'daily': 'precipitation_sum',
            'hourly': (
                'temperature_2m,relative_humidity_2m,et0_fao_evapotranspiration,'
                'soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,'
                'soil_temperature_0_to_7cm'
            ),
            'past_days': 1,
            'forecast_days': 2,
            'timezone': 'Asia/Kolkata',
        },
        timeout=20,
    )
    response.raise_for_status()
    weather = response.json()
    hourly = weather.get('hourly', {})
    daily = weather.get('daily', {})
    today = date.today().isoformat()
    times = hourly.get('time', [])
    today_indices = [i for i, timestamp in enumerate(times) if timestamp.startswith(today)]

    def mean_today(key):
        values = hourly.get(key, [])
        usable = [float(values[i]) for i in today_indices if i < len(values) and values[i] is not None]
        return round(sum(usable) / len(usable), 4) if usable else None

    et0_values = hourly.get('et0_fao_evapotranspiration', [])
    et0_today = [float(et0_values[i]) for i in today_indices if i < len(et0_values) and et0_values[i] is not None]
    daily_dates = daily.get('time', [])
    rainfall_values = daily.get('precipitation_sum', [])
    rainfall = None
    if today in daily_dates:
        idx = daily_dates.index(today)
        if idx < len(rainfall_values) and rainfall_values[idx] is not None:
            rainfall = float(rainfall_values[idx])

    if not today_indices:
        raise ValueError('Weather service returned no hourly data for today.')

    return {
        'district': str(place.get('admin2') or district or 'Nagpur').strip().title(),
        'location': str(place.get('name') or search_location),
        'latitude': float(place['latitude']),
        'longitude': float(place['longitude']),
        'temperature_mean_c': mean_today('temperature_2m'),
        'humidity_mean_pct': mean_today('relative_humidity_2m'),
        'rainfall_mm': rainfall,
        'et0_mm': round(sum(et0_today), 4) if et0_today else None,
        'soil_moisture_0_7cm_m3m3': mean_today('soil_moisture_0_to_7cm'),
        'soil_moisture_7_28cm_m3m3': mean_today('soil_moisture_7_to_28cm'),
        'soil_temperature_0_7cm_c': mean_today('soil_temperature_0_to_7cm'),
        'weather_source': 'Open-Meteo forecast/modelled soil estimates',
    }


def get_feature_importance(task, pipeline, top_n=8):
    """Return model feature importance aggregated to original input columns."""
    if not hasattr(pipeline, "named_steps"):
        return []

    model = pipeline.named_steps.get("model")
    preprocess = pipeline.named_steps.get("preprocess")
    if model is None or preprocess is None:
        return []

    # Tree models expose native feature importance. For other models, do not
    # invent explanations; return an empty list instead.
    importances = getattr(model, "feature_importances_", None)
    if importances is None:
        return []

    try:
        transformed_names = preprocess.get_feature_names_out()
    except Exception:
        return []

    original_features = FEATURES.get(task, [])
    aggregated = {name: 0.0 for name in original_features}

    for transformed_name, importance in zip(transformed_names, importances):
        name = str(transformed_name)
        # ColumnTransformer prefixes features with e.g. categorical__ or numeric__.
        if "__" in name:
            name = name.split("__", 1)[1]

        matches = [
            feature for feature in original_features
            if name == feature or name.startswith(feature + "_")
        ]
        if matches:
            source_feature = max(matches, key=len)
            aggregated[source_feature] += float(importance)

    total = sum(aggregated.values())
    if total <= 0:
        return []

    ranked = sorted(aggregated.items(), key=lambda item: item[1], reverse=True)
    return [
        {
            "feature": feature,
            "importance": round(value / total, 4),
            "importance_percent": round((value / total) * 100, 2),
        }
        for feature, value in ranked[:top_n]
        if value > 0
    ]


def serialize(doc):
    if not doc: return None
    out = dict(doc)
    if '_id' in out: out['id'] = str(out.pop('_id'))
    if 'user_id' in out and isinstance(out['user_id'], ObjectId): out['user_id'] = str(out['user_id'])
    for k, v in list(out.items()):
        if isinstance(v, datetime): out[k] = v.isoformat()
    return out

def require_db():
    if db is None:
        return jsonify({'error': 'MongoDB is not configured. Set MONGO_URI in backend/.env and restart the backend.'}), 503
    try:
        client.admin.command('ping')
    except Exception:
        return jsonify({'error': 'Cannot connect to MongoDB. Check MONGO_URI and network access.'}), 503
    return None

def auth_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        err = require_db()
        if err: return err
        header = request.headers.get('Authorization', '')
        token = header.replace('Bearer ', '', 1) if header.startswith('Bearer ') else ''
        if not token: return jsonify({'error': 'Please log in to continue.'}), 401
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user = db.users.find_one({'_id': ObjectId(payload['sub'])}, {'password_hash': 0})
            if not user: return jsonify({'error': 'Account not found. Please log in again.'}), 401
            g.user = user
        except Exception:
            return jsonify({'error': 'Session expired or invalid. Please log in again.'}), 401
        return fn(*args, **kwargs)
    return wrapped

def make_token(user):
    return jwt.encode({'sub': str(user['_id']), 'exp': datetime.now(timezone.utc) + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm='HS256')

@app.get('/')
def home():
    return jsonify({'message': 'AgriSense API is running', 'health': '/api/health'})

@app.get('/api/health')
def health():
    mongo_ok = False
    if client:
        try: client.admin.command('ping'); mongo_ok = True
        except Exception: pass
    return jsonify({'status':'ok', 'loaded_models':list(MODELS.keys()), 'models_ready':len(MODELS)==2, 'mongodb_configured':bool(mongo_uri), 'mongodb_connected':mongo_ok})

@app.post('/api/auth/signup')
def signup():
    err = require_db()
    if err: return err
    data = request.get_json(silent=True) or {}
    name, email, password = str(data.get('name','')).strip(), str(data.get('email','')).strip().lower(), str(data.get('password',''))
    if not name or not email or len(password) < 8:
        return jsonify({'error':'Name and email are required; password must be at least 8 characters.'}), 400
    if db.users.find_one({'email': email}): return jsonify({'error':'An account with this email already exists.'}), 409
    user = {'name':name, 'email':email, 'password_hash':generate_password_hash(password), 'created_at':datetime.now(timezone.utc)}
    try: result = db.users.insert_one(user)
    except Exception: return jsonify({'error':'Could not create account. Please try again.'}), 500
    user['_id'] = result.inserted_id
    return jsonify({'token':make_token(user), 'user':{'id':str(user['_id']),'name':name,'email':email}}), 201

@app.post('/api/auth/login')
def login():
    err = require_db()
    if err: return err
    data = request.get_json(silent=True) or {}
    email, password = str(data.get('email','')).strip().lower(), str(data.get('password',''))
    user = db.users.find_one({'email':email})
    if not user or not check_password_hash(user.get('password_hash',''), password): return jsonify({'error':'Invalid email or password.'}), 401
    return jsonify({'token':make_token(user), 'user':{'id':str(user['_id']),'name':user['name'],'email':user['email']}})

@app.get('/api/auth/me')
@auth_required
def me(): return jsonify({'user':{'id':str(g.user['_id']),'name':g.user['name'],'email':g.user['email']}})

@app.get('/api/fields')
@auth_required
def get_fields():
    docs = db.fields.find({'user_id':g.user['_id']}).sort('created_at', DESCENDING)
    return jsonify([serialize(x) for x in docs])

@app.post('/api/fields')
@auth_required
def add_field():
    data = request.get_json(silent=True) or {}
    name = str(data.get('name','')).strip()
    if not name: return jsonify({'error':'Field name is required.'}), 400
    now = datetime.now(timezone.utc)
    doc = {k:data.get(k) for k in ['name','cropType','soilType','growthStage','district','pH','nitrogen','phosphorus','potassium','soilMoisture','soilMoistureVolume','area']}
    doc['cropType'] = doc.get('cropType') or data.get('crop')
    doc['crop'] = doc.get('crop') or data.get('crop') or doc.get('cropType')
    doc['soilType'] = str(doc.get('soilType') or 'Black').replace(' Soil','').strip().title()
    doc['growthStage'] = str(doc.get('growthStage') or 'Vegetative').title()
    doc['district'] = doc.get('district') or 'Nagpur'
    doc['pH'] = float(doc.get('pH') or 7.1)
    doc['district'] = str(doc.get('district') or 'Nagpur').strip().title()
    doc['soilMoisture'] = float(doc.get('soilMoisture') or 25)
    doc['soilMoistureVolume'] = float(doc.get('soilMoistureVolume') or 1059.165)
    doc['nitrogen'] = float(doc.get('nitrogen') or 108)
    doc['phosphorus'] = float(doc.get('phosphorus') or 11.59)
    doc['potassium'] = float(doc.get('potassium') or 130)
    doc.update({'user_id':g.user['_id'], 'created_at':now, 'updated_at':now})
    result = db.fields.insert_one(doc); doc['_id'] = result.inserted_id
    return jsonify(serialize(doc)), 201

@app.get('/api/fields/<field_id>')
@auth_required
def get_field(field_id):
    try: oid = ObjectId(field_id)
    except Exception: return jsonify({'error':'Invalid field ID.'}), 400
    doc = db.fields.find_one({'_id':oid,'user_id':g.user['_id']})
    if not doc: return jsonify({'error':'Field not found.'}), 404
    return jsonify(serialize(doc))

@app.delete('/api/fields/<field_id>')
@auth_required
def delete_field(field_id):
    try: oid = ObjectId(field_id)
    except Exception: return jsonify({'error':'Invalid field ID.'}), 400
    result = db.fields.delete_one({'_id':oid,'user_id':g.user['_id']})
    if not result.deleted_count: return jsonify({'error':'Field not found.'}), 404
    db.analyses.update_many({'user_id':g.user['_id'],'field_id':field_id},{'$set':{'field_deleted':True}})
    return jsonify({'message':'Field deleted.'})

def predict(task, payload):
    if task not in MODELS:
        return None, (jsonify({'error': f'{task} model is not trained. Run python train_models.py.'}), 503)

    payload = dict(payload or {})

    if task == 'irrigation':
        # The retrained model needs weather and location features, not the old
        # soil_moisture_pct/soil_moisture_volume fields.
        required_context = ['Crop', 'Crop_Stage']
        missing_context = [key for key in required_context if payload.get(key) in (None, '')]
        if missing_context:
            return None, (jsonify({
                'error': 'Missing required crop inputs for irrigation prediction.',
                'fields': missing_context,
            }), 400)

        district = payload.get('district') or 'Nagpur'
        location = payload.get('location') or district
        missing_weather = [
            key for key in FEATURES['irrigation']
            if key not in payload or payload[key] in (None, '')
        ]
        if missing_weather:
            try:
                weather_features = fetch_irrigation_weather(location, district)
                # Caller-provided values take priority; missing values come from weather.
                for key, value in weather_features.items():
                    if payload.get(key) in (None, ''):
                        payload[key] = value
            except requests.RequestException:
                return None, (jsonify({'error': 'Weather service unavailable for irrigation prediction.'}), 502)
            except ValueError as exc:
                return None, (jsonify({'error': str(exc)}), 400)

    missing = [
        key for key in FEATURES[task]
        if key not in payload or payload[key] is None or payload[key] == ''
    ]
    if missing:
        return None, (jsonify({
            'error': 'Missing required fields for prediction.',
            'fields': missing,
        }), 400)

    row = {key: payload[key] for key in FEATURES[task]}

    if 'Soil_Type' in row:
        soil = str(row['Soil_Type']).strip().replace(' Soil', '').title()
        row['Soil_Type'] = f'{soil} Soil'

    for key in ('Crop', 'Crop_Stage'):
        if key in row:
            row[key] = str(row[key]).strip().title()

    if 'district' in row:
        row['district'] = str(row['district']).strip().title()
    if 'location' in row:
        row['location'] = str(row['location']).strip()

    numeric_keys = {'pH', 'N', 'P', 'K'}
    if task == 'irrigation':
        numeric_keys |= IRRIGATION_NUMERIC_FEATURES

    for key in numeric_keys:
        if key in row:
            try:
                row[key] = float(row[key])
            except (ValueError, TypeError):
                return None, (jsonify({'error': f'{key} must be numeric.'}), 400)

    try:
        frame = pd.DataFrame([row], columns=FEATURES[task])
        prediction = str(MODELS[task].predict(frame)[0])
        pipeline = MODELS[task]
        model = pipeline.named_steps.get('model') if hasattr(pipeline, 'named_steps') else pipeline
        response = {
            'task': task,
            'prediction': prediction,
            'model_based': True,
            'model_name': model.__class__.__name__,
            'disclaimer': 'Prototype prediction based on the supplied training labels; not a field-validated irrigation prescription.',
        }
        if hasattr(pipeline, 'predict_proba') and hasattr(model, 'classes_'):
            probabilities = pipeline.predict_proba(frame)[0]
            response['class_probabilities'] = {
                str(label): round(float(probability), 4)
                for label, probability in zip(model.classes_, probabilities)
            }
        # Native tree-model importance, aggregated from encoded columns back
        # to the original user-facing feature names.
        response['feature_importance'] = get_feature_importance(task, pipeline)
        response['explainability_source'] = (
            'Tree model feature importance; indicates model reliance, not causation.'
            if response['feature_importance'] else
            'This model does not expose native feature importance.'
        )

        if task == 'irrigation':
            response['weather_source'] = payload.get('weather_source', 'Caller-provided weather inputs')
            response['weather_inputs'] = row
        return response, None
    except Exception as exc:
        return None, (jsonify({'error': f'Model prediction failed: {str(exc)}'}), 500)

@app.post('/api/fertilizer/predict')
def fertilizer_predict():
    result, error=predict('fertilizer',request.get_json(silent=True) or {})
    return error if error else jsonify(result)
@app.post('/api/irrigation/predict')
def irrigation_predict():
    result, error = predict('irrigation', request.get_json(silent=True) or {})
    return error if error else jsonify(result)

@app.post('/api/analyze')
@auth_required
def analyze():
    data = request.get_json(silent=True) or {}
    field_id = str(data.get('fieldId', ''))
    field = None

    if field_id:
        try:
            field = db.fields.find_one({'_id': ObjectId(field_id), 'user_id': g.user['_id']})
        except Exception:
            return jsonify({'error': 'Invalid field ID.'}), 400
        if not field:
            return jsonify({'error': 'Field not found or access denied.'}), 404

    inputs = data.get('inputs') or data
    district = inputs.get('district') or (field or {}).get('district') or 'Nagpur'
    crop = inputs.get('Crop', inputs.get('cropType', inputs.get('crop', '')))
    stage = inputs.get('Crop_Stage', inputs.get('growthStage', inputs.get('current_stage', '')))

    fert_payload = {
        'Soil_Type': str(inputs.get('Soil_Type', inputs.get('soilType', ''))).lower(),
        'Crop': str(crop).lower(),
        'Crop_Stage': str(stage).lower(),
        'pH': inputs.get('pH', 6.5),
        'N': inputs.get('N', inputs.get('nitrogen')),
        'P': inputs.get('P', inputs.get('phosphorus')),
        'K': inputs.get('K', inputs.get('potassium')),
    }

    # New irrigation model uses real-time weather/location fields. Missing
    # weather fields are filled by fetch_irrigation_weather inside predict().
    irr_payload = {
        'district': district,
        'location': inputs.get('location') or district,
        'Crop': crop,
        'Crop_Stage': stage,
    }
    for key in FEATURES['irrigation']:
        if key in inputs and inputs[key] not in (None, ''):
            irr_payload[key] = inputs[key]

    fertilizer_result, error = predict('fertilizer', fert_payload)
    if error:
        return error

    irrigation_result, error = predict('irrigation', irr_payload)
    if error:
        return error

    # Preserve the submitted inputs, but fill report/history weather fields
    # from the actual weather inputs used by the irrigation model.
    # This does not change the model prediction or overwrite unrelated inputs.
    saved_inputs = dict(inputs)
    weather_inputs = irrigation_result.get('weather_inputs', {})

    if weather_inputs:
        saved_inputs.update({
            'temperature': weather_inputs.get('temperature_mean_c'),
            'humidity': weather_inputs.get('humidity_mean_pct'),
            'rainfall': weather_inputs.get('rainfall_mm'),
            'et0_mm': weather_inputs.get('et0_mm'),
            'soil_moisture_0_7cm_m3m3':
                weather_inputs.get('soil_moisture_0_7cm_m3m3'),
            'soil_moisture_7_28cm_m3m3':
                weather_inputs.get('soil_moisture_7_28cm_m3m3'),
            'soil_temperature_0_7cm_c':
                weather_inputs.get('soil_temperature_0_7cm_c'),
            'weather_source': irrigation_result.get('weather_source'),
        })

    now = datetime.now(timezone.utc)
    doc = {
        'user_id': g.user['_id'],
        'field_id': field_id or None,
        'field_name': (field or {}).get('name', data.get('fieldName', 'Unnamed Field')),
        'inputs': saved_inputs,
        'fertilizer': fertilizer_result,
        'irrigation': irrigation_result,
        'created_at': now,
    }
    inserted = db.analyses.insert_one(doc)
    doc['_id'] = inserted.inserted_id
    return jsonify(serialize(doc)), 201

@app.get('/api/analyses')
@auth_required
def get_analyses():
    query={'user_id':g.user['_id']}
    field_id=request.args.get('fieldId')
    if field_id: query['field_id']=field_id
    limit=min(max(int(request.args.get('limit',100)),1),500)
    return jsonify([serialize(x) for x in db.analyses.find(query).sort('created_at',DESCENDING).limit(limit)])

@app.get('/api/analyses/<analysis_id>')
@auth_required
def get_analysis(analysis_id):
    try: oid=ObjectId(analysis_id)
    except Exception: return jsonify({'error':'Invalid analysis ID.'}),400
    doc=db.analyses.find_one({'_id':oid,'user_id':g.user['_id']})
    if not doc: return jsonify({'error':'Analysis not found.'}),404
    return jsonify(serialize(doc))

@app.get('/api/weather')
def get_weather():
    location = request.args.get('location', '').strip()

    if not location:
        return jsonify({'error': 'Location is required.'}), 400

    try:
        # Find location coordinates
        geo_response = requests.get(
            'https://geocoding-api.open-meteo.com/v1/search',
            params={
                'name': location,
                'count': 10,
                'language': 'en',
                'format': 'json'
            },
            timeout=15
        )
        geo_response.raise_for_status()

        places = geo_response.json().get('results', [])

        # Select an Indian location
        place = next(
            (p for p in places if p.get('country_code') == 'IN'),
            None
        )

        if not place:
            return jsonify({'error': 'Indian location not found.'}), 404

        # Fetch recent weather and forecast
        weather_response = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params={
                'latitude': place['latitude'],
                'longitude': place['longitude'],
                'daily': (
                    'precipitation_sum,'
                    'temperature_2m_max,'
                    'temperature_2m_min'
                ),
                'past_days': 3,
                'forecast_days': 7,
                'timezone': 'Asia/Kolkata'
            },
            timeout=20
        )
        weather_response.raise_for_status()

        weather = weather_response.json()
        daily = weather.get('daily', {})

        return jsonify({
            'location': {
                'name': place.get('name'),
                'district': place.get('admin2'),
                'state': place.get('admin1'),
                'latitude': place['latitude'],
                'longitude': place['longitude']
            },
            'weather': daily,
            'units': weather.get('daily_units', {}),
            'source': 'Open-Meteo'
        }), 200

    except requests.RequestException:
        return jsonify({
            'error': 'Weather service unavailable. Please try again.'
        }), 502

    
@app.post('/api/irrigation/advisory')
def irrigation_advisory():
    data = request.get_json(silent=True) or {}

    crop = str(data.get('crop', '')).strip().title()
    location = str(data.get('location', '')).strip()
    sowing_date = data.get('sowing_date')
    current_stage = data.get('current_stage')

    soil_type = str(data.get('soil_type', '')).strip().title()
    
    if soil_type not in ('Black', 'Red', 'Clay', 'Alluvial', 'Laterite'):
        return jsonify({
            'error': 'soil_type must be Black, Red, Clay, Alluvial, or Laterite.'
        }), 400

    farmer_moisture = data.get('farmer_soil_moisture_pct')

    if farmer_moisture is not None:
        try:
            farmer_moisture = float(farmer_moisture)
        except (TypeError, ValueError):
            return jsonify({
                'error': 'farmer_soil_moisture_pct must be a number.'
            }), 400
        
        if not 0 <= farmer_moisture <= 100:
            return jsonify({
                'error': 'farmer_soil_moisture_pct must be between 0 and 100.'
            }), 400

    if crop not in ('Cotton', 'Soybean'):
        return jsonify({
            'error': 'Crop must be Cotton or Soybean.'
        }), 400

    if not location:
        return jsonify({
            'error': 'Location is required.'
        }), 400

    try:
        stage, stage_source = get_crop_stage(
            crop,
            sowing_date=sowing_date,
            current_stage=current_stage
        )

        # Fetch weather using the existing weather endpoint logic
        # directly through the existing Open-Meteo API.
        geo_response = requests.get(
            'https://geocoding-api.open-meteo.com/v1/search',
            params={
                'name': location,
                'count': 10,
                'language': 'en',
                'format': 'json'
            },
            timeout=15
        )
        geo_response.raise_for_status()

        places = geo_response.json().get('results', [])
        place = next(
            (p for p in places if p.get('country_code') == 'IN'),
            None
        )

        if not place:
            return jsonify({
                'error': 'Indian location not found.'
            }), 404

        weather_response = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params={
                'latitude': place['latitude'],
                'longitude': place['longitude'],
                'daily': 'precipitation_sum',
                'hourly': (
                    'et0_fao_evapotranspiration,'
                    'soil_moisture_0_to_7cm,'
                    'soil_moisture_7_to_28cm'
                ),
                'past_days': 1,
                'forecast_days': 2,
                'timezone': 'Asia/Kolkata'
            },
            timeout=20
        )
        weather_response.raise_for_status()
        weather = weather_response.json()

        daily = weather.get('daily', {})
        hourly = weather.get('hourly', {})

        soil_moisture_surface = hourly.get('soil_moisture_0_to_7cm', [])
        soil_moisture_deep = hourly.get('soil_moisture_7_to_28cm', [])

        today = date.today().isoformat()
        hourly_times = hourly.get('time', [])

        surface_today = [
            float(value)
            for timestamp, value in zip(hourly_times, soil_moisture_surface)
            if timestamp.startswith(today) and value is not None
        ]

        deep_today = [
            float(value)
            for timestamp, value in zip(hourly_times, soil_moisture_deep)
            if timestamp.startswith(today) and value is not None
        ]

        soil_moisture = {
            'surface_mean_m3_m3': (
                round(sum(surface_today) / len(surface_today), 4)
                if surface_today else None
            ),
            'deep_mean_m3_m3': (
                round(sum(deep_today) / len(deep_today), 4)
                if deep_today else None
            ),
            'source': 'Open-Meteo modelled estimate'
        }

        print("Today's surface moisture values:", len(surface_today))
        print("Today's deep moisture values:", len(deep_today))
        print("Surface moisture observations:", len(soil_moisture_surface))
        print("Deep moisture observations:", len(soil_moisture_deep))

        # Use today's daily rainfall and sum today's hourly ET0.
        dates = daily.get('time', [])
        rainfall_values = daily.get('precipitation_sum', [])

        if today not in dates:
            return jsonify({
                'error': 'Today weather data is unavailable.'
            }), 502

        index = dates.index(today)
        rainfall = float(rainfall_values[index] or 0)

        hourly_times = hourly.get('time', [])
        hourly_et0 = hourly.get('et0_fao_evapotranspiration', [])
        et0_values = [
            float(value)
            for timestamp, value in zip(hourly_times, hourly_et0)
            if timestamp.startswith(today) and value is not None
        ]

        if not et0_values:
            return jsonify({
                'error': 'ET0 data is unavailable for today.'
            }), 502

        et0 = sum(et0_values)

        # Illustrative coefficient only. Stage-specific values
        # need locally validated crop guidance.
        kc = 1.10 if crop == 'Soybean' else 1.15

        surface_value = (
            round(sum(surface_today) / len(surface_today), 4)
            if surface_today else None
        )
        
        deep_value = (
            round(sum(deep_today) / len(deep_today), 4)
            if deep_today else None
        )
        
        water = get_water_estimate(
            et0_mm=et0,
            crop=crop,
            crop_stage=stage,
            effective_rain_mm=rainfall,
            soil_type=soil_type,
            surface_moisture=surface_value,
            deep_moisture=deep_value,
        )


        return jsonify({
            'crop': crop,
            'location': place.get('name'),
            'crop_stage': stage,
            'stage_source': stage_source,
            'weather_source': 'Open-Meteo',
            'today_rainfall_mm': rainfall,
            'today_et0_mm': round(et0, 2),
            'soil_moisture': soil_moisture,
            'water_estimate': water,
            'farmer_entered_soil_moisture_pct': farmer_moisture,
            'status': (
                'Experimental advisory only. '
                'Not a field-validated irrigation prescription.'
            )
        }), 200

    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    except requests.RequestException:
        return jsonify({
            'error': 'Weather service unavailable.'
        }), 502

if __name__=='__main__':
    app.run(host=os.getenv('FLASK_HOST','127.0.0.1'),port=int(os.getenv('FLASK_PORT','5000')),debug=os.getenv('FLASK_DEBUG','false').lower()=='true')