"""Train prototype classification pipelines and write honest evaluation reports."""
from pathlib import Path
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
MODELS = ROOT / 'models'
REPORTS = ROOT / 'reports'
RANDOM_STATE = 42

TASKS = {
    'irrigation': {
        'file': DATA / 'irrigation.csv',
        'target': 'Irrigation_Need',
        'features': ['district', 'Soil_Type', 'Crop', 'Crop_Stage', 'soil_moisture_pct', 'soil_moisture_volume'],
        'drop': ['date'],
    },
    'fertilizer': {
        'file': DATA / 'fertilizer.csv',
        'target': 'Fertilizer_Recommendation',
        'features': ['Soil_Type', 'Crop', 'Crop_Stage', 'pH', 'N', 'P', 'K'],
        'drop': ['Sample'],
    },
}

def build_pipeline(X, model_name):
    cat = X.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
    num = [c for c in X.columns if c not in cat]
    transformers = []
    if cat:
        transformers.append(('cat', Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore')),
        ]), cat))
    if num:
        transformers.append(('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scale', StandardScaler()),
        ]), num))
    prep = ColumnTransformer(transformers=transformers, remainder='drop')
    if model_name == 'DecisionTree':
        clf = DecisionTreeClassifier(class_weight='balanced', random_state=RANDOM_STATE, min_samples_leaf=2)
    elif model_name == 'RandomForest':
        clf = RandomForestClassifier(n_estimators=300, class_weight='balanced', random_state=RANDOM_STATE, min_samples_leaf=2)
    elif model_name == 'XGBoost':
        from xgboost import XGBClassifier
        clf = XGBClassifier(n_estimators=180, max_depth=3, learning_rate=0.05, subsample=0.9,
                            colsample_bytree=0.9, objective='multi:softprob', eval_metric='mlogloss',
                            random_state=RANDOM_STATE)
    elif model_name == 'ANN':
        clf = MLPClassifier(hidden_layer_sizes=(32, 16), alpha=0.01, max_iter=1200,
                            early_stopping=True, random_state=RANDOM_STATE)
    return Pipeline([('preprocess', prep), ('model', clf)])

def train_task(task_name, cfg):
    path = cfg['file']
    if not path.exists():
        raise FileNotFoundError(f'Missing {path}. Copy the supplied dataset into backend/data and name it {path.name}.')
    df = pd.read_csv(path)
    required = cfg['features'] + [cfg['target']]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f'{task_name}: missing required columns: {missing}. Found: {df.columns.tolist()}')
    df = df[required].copy()
    df = df.dropna(subset=[cfg['target']])
    X = df[cfg['features']]
    y = df[cfg['target']].astype(str).str.strip()
    if y.nunique() < 2:
        raise ValueError(f'{task_name}: target has fewer than 2 classes.')
    counts = y.value_counts()
    if counts.min() < 2:
        raise ValueError(f'{task_name}: every target class needs at least 2 examples for stratified split; counts={counts.to_dict()}')
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y)

    candidates = ['DecisionTree', 'RandomForest', 'ANN', 'XGBoost']
    results = []
    fitted = {}
    for name in candidates:
        try:
            pipe = build_pipeline(X_train, name)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore')
                pipe.fit(X_train, y_train)
                pred = pipe.predict(X_test)
            result = {
                'model': name,
                'accuracy': round(float(accuracy_score(y_test, pred)), 4),
                'macro_f1': round(float(f1_score(y_test, pred, average='macro', zero_division=0)), 4),
                'weighted_f1': round(float(f1_score(y_test, pred, average='weighted', zero_division=0)), 4),
                'classification_report': classification_report(y_test, pred, output_dict=True, zero_division=0),
                'confusion_matrix': confusion_matrix(y_test, pred, labels=sorted(y.unique())).tolist(),
                'confusion_matrix_labels': sorted(y.unique()),
            }
            results.append(result)
            fitted[name] = pipe
            print(f'{task_name:10s} {name:12s} accuracy={result["accuracy"]:.3f} macro_f1={result["macro_f1"]:.3f}')
        except Exception as exc:
            results.append({'model': name, 'error': f'{type(exc).__name__}: {exc}'})
            print(f'{task_name:10s} {name:12s} FAILED: {exc}')

    valid = [r for r in results if 'macro_f1' in r and r['model'] in fitted]
    if not valid:
        raise RuntimeError(f'{task_name}: no model trained successfully.')
    # Primary selection metric is macro-F1 to avoid choosing solely for majority class accuracy.
    best = max(valid, key=lambda r: (r['macro_f1'], r['accuracy']))
    best_name = best['model']
    MODELS.mkdir(exist_ok=True)
    REPORTS.mkdir(exist_ok=True)
    joblib.dump(fitted[best_name], MODELS / f'{task_name}_pipeline.joblib')
    summary = {
        'task': task_name,
        'rows_used': int(len(df)),
        'features': cfg['features'],
        'target': cfg['target'],
        'class_counts': {str(k): int(v) for k, v in counts.items()},
        'split': {'train': int(len(X_train)), 'test': int(len(X_test)), 'random_state': RANDOM_STATE},
        'selection_metric': 'macro_f1, then accuracy',
        'selected_model': best_name,
        'models': results,
        'warning': 'Prototype evaluation only. Label provenance, units, duplicate/leakage risk, and independent field validation must be checked before real-world claims.',
    }
    (REPORTS / f'{task_name}_evaluation.json').write_text(json.dumps(summary, indent=2, default=float), encoding='utf-8')
    return summary

if __name__ == '__main__':
    for task, cfg in TASKS.items():
        summary = train_task(task, cfg)
        print(f'\n{task}: selected {summary["selected_model"]}; report: reports/{task}_evaluation.json')
