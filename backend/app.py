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
allowed_origins = [origin.strip() for origin in os.getenv('FRONTEND_ORIGIN', 'http://localhost:3000,http://127.0.0.1:3000').split(',') if origin.strip()]
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
    'irrigation': ['district', 'Soil_Type', 'Crop', 'Crop_Stage', 'soil_moisture_pct', 'soil_moisture_volume'],
}

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
    if task not in MODELS: return None, (jsonify({'error':f'{task} model is not trained. Run python train_models.py.'}),503)
    missing=[k for k in FEATURES[task] if k not in payload or payload[k] is None or payload[k]=='']
    if missing: return None,(jsonify({'error':'Missing required fields','fields':missing}),400)
    row={k:payload[k] for k in FEATURES[task]}
    for key in ('Soil_Type',):
        if key in row:
            soil=str(row[key]).strip().replace(' Soil','').title()
            row[key]=f'{soil} Soil'
    for key in ('Crop', 'Crop_Stage'):
        if key in row:
            row[key]=str(row[key]).strip().title()
    if task == 'irrigation' and 'district' in row:
        row['district']=str(row['district']).strip().title()
    for k in row:
        if k in ('pH','N','P','K','soil_moisture_pct','soil_moisture_volume'):
            try: row[k]=float(row[k])
            except (ValueError,TypeError): return None,(jsonify({'error':f'{k} must be numeric'}),400)
    try:
        pred=str(MODELS[task].predict(pd.DataFrame([row]))[0])
        response={'task':task,'prediction':pred,'model_based':True,'model_name':str(MODELS[task].named_steps.get('model', MODELS[task]).__class__.__name__) if hasattr(MODELS[task], 'named_steps') else MODELS[task].__class__.__name__,'disclaimer':'Prototype prediction based on supplied dataset labels; not a validated field prescription.'}
        model=MODELS[task].named_steps.get('model') if hasattr(MODELS[task],'named_steps') else None
        if hasattr(model,'predict_proba'):
            probs=MODELS[task].predict_proba(pd.DataFrame([row]))[0]
            response['class_probabilities']={str(label):round(float(prob),4) for label,prob in zip(model.classes_,probs)}
        return response,None
    except Exception as exc: return None,(jsonify({'error':f'Model prediction failed: {str(exc)}'}),500)

@app.post('/api/fertilizer/predict')
def fertilizer_predict():
    result, error=predict('fertilizer',request.get_json(silent=True) or {})
    return error if error else jsonify(result)
@app.post('/api/irrigation/predict')
def irrigation_predict():
    result, error=predict('irrigation',request.get_json(silent=True) or {})
    return error if error else jsonify(result)

@app.post('/api/analyze')
@auth_required
def analyze():
    data=request.get_json(silent=True) or {}
    field_id=str(data.get('fieldId',''))
    field=None
    if field_id:
        try: field=db.fields.find_one({'_id':ObjectId(field_id),'user_id':g.user['_id']})
        except Exception: return jsonify({'error':'Invalid field ID.'}),400
        if not field: return jsonify({'error':'Field not found or access denied.'}),404
    inputs=data.get('inputs') or data
    fert_payload={'Soil_Type':inputs.get('Soil_Type',inputs.get('soilType','')).lower(),'Crop':inputs.get('Crop',inputs.get('cropType','')).lower(),'Crop_Stage':inputs.get('Crop_Stage',inputs.get('growthStage','')).lower(),'pH':inputs.get('pH',6.5),'N':inputs.get('N',inputs.get('nitrogen')),'P':inputs.get('P',inputs.get('phosphorus')),'K':inputs.get('K',inputs.get('potassium'))}
    irr_payload={'district':inputs.get('district',field.get('district','Nagpur') if field else 'Nagpur'),'Soil_Type':fert_payload['Soil_Type'],'Crop':fert_payload['Crop'],'Crop_Stage':fert_payload['Crop_Stage'],'soil_moisture_pct':inputs.get('soil_moisture_pct',inputs.get('soilMoisture')),'soil_moisture_volume':inputs.get('soil_moisture_volume',inputs.get('soilMoistureVolume',inputs.get('soilMoisture')))}
    fert,err=predict('fertilizer',fert_payload)
    if err: return err
    irr,err=predict('irrigation',irr_payload)
    if err: return err
    now=datetime.now(timezone.utc)
    doc={'user_id':g.user['_id'],'field_id':field_id or None,'field_name':(field or {}).get('name',data.get('fieldName','Unnamed Field')),'inputs':inputs,'fertilizer':fert,'irrigation':irr,'created_at':now}
    inserted=db.analyses.insert_one(doc); doc['_id']=inserted.inserted_id
    return jsonify(serialize(doc)),201

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