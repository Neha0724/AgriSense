
"""Train AgriSense prototype models and save evaluation reports."""

from pathlib import Path
import json
import warnings

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
RANDOM_STATE = 42

# These columns are metadata or values calculated directly
# from the climate-water formula. Do not use them as inputs
# when the irrigation target was derived from those formulas.
IRRIGATION_EXCLUDE = {
    "date",
    "label_status",
    "label_basis",
    "Irrigation_Need",
    "kc_assumption",
    "etc_estimate_mm_day",
    "climate_deficit_proxy_mm",
    "climate_deficit_proxy_litres_ha",
    "irrigation_need_proxy",
}

TASKS = {
    "irrigation": {
        "file": DATA / "irrigation_model_ready.csv",
        "target": "Irrigation_Need",
        "features": None,  # Automatically select input columns
        "exclude": IRRIGATION_EXCLUDE,
    },
    "fertilizer": {
        "file": DATA / "fertilizer.csv",
        "target": "Fertilizer_Recommendation",
        "features": [
            "Soil_Type",
            "Crop",
            "Crop_Stage",
            "pH",
            "N",
            "P",
            "K",
        ],
        "exclude": {"Sample"},
    },
}


def build_pipeline(X, model_name):
    """Build preprocessing and classification pipeline."""

    categorical = X.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    numeric = [
        column for column in X.columns
        if column not in categorical
    ]

    transformers = []

    if categorical:
        categorical_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ])

        transformers.append(
            ("categorical", categorical_pipeline, categorical)
        )

    if numeric:
        numeric_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ])

        transformers.append(
            ("numeric", numeric_pipeline, numeric)
        )

    if not transformers:
        raise ValueError("No usable input features found.")

    preprocessing = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    if model_name == "DecisionTree":
        classifier = DecisionTreeClassifier(
            class_weight="balanced",
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
        )

    elif model_name == "RandomForest":
        classifier = RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced",
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    elif model_name == "ANN":
        classifier = MLPClassifier(
            hidden_layer_sizes=(32, 16),
            alpha=0.01,
            max_iter=1200,
            early_stopping=True,
            random_state=RANDOM_STATE,
        )

    else:
        raise ValueError(f"Unknown model: {model_name}")

    return Pipeline([
        ("preprocess", preprocessing),
        ("model", classifier),
    ])


def get_features(df, cfg, task_name):
    """Validate columns and select features."""

    target = cfg["target"]

    if target not in df.columns:
        raise ValueError(
            f"{task_name}: target column '{target}' not found.\n"
            f"Available columns: {df.columns.tolist()}"
        )

    if cfg["features"] is None:
        excluded = set(cfg["exclude"])
        excluded.add(target)

        features = [
            column for column in df.columns
            if column not in excluded
        ]
    else:
        features = cfg["features"]

        missing = [
            column for column in features
            if column not in df.columns
        ]

        if missing:
            raise ValueError(
                f"{task_name}: missing input columns: {missing}\n"
                f"Available columns: {df.columns.tolist()}"
            )

    if not features:
        raise ValueError(
            f"{task_name}: no input features were selected."
        )

    # Remove columns that contain no usable values.
    features = [
        column for column in features
        if df[column].notna().any()
    ]

    if not features:
        raise ValueError(
            f"{task_name}: all selected features are empty."
        )

    return features


def train_task(task_name, cfg):
    """Train candidate models and save the best pipeline."""

    path = cfg["file"]

    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {path}\n"
            f"Place the CSV in backend/data with this exact filename."
        )

    df = pd.read_csv(path)

    print(f"\n{'=' * 55}")
    print(f"Task: {task_name}")
    print(f"Dataset: {path.name}")
    print(f"Dataset shape: {df.shape}")

    features = get_features(df, cfg, task_name)
    target = cfg["target"]

    df = df[features + [target]].copy()
    df[target] = df[target].replace(r"^\s*$", pd.NA, regex=True)
    df = df.dropna(subset=[target])

    # Clean string labels.
    df[target] = df[target].astype(str).str.strip()
    df = df[df[target] != ""]

    X = df[features]
    y = df[target]

    counts = y.value_counts()

    if y.nunique() < 2:
        raise ValueError(
            f"{task_name}: target must contain at least 2 classes."
        )

    if counts.min() < 2:
        raise ValueError(
            f"{task_name}: each class needs at least 2 rows "
            f"for a stratified split. Counts: {counts.to_dict()}"
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print(f"Rows used: {len(df)}")
    print(f"Input features ({len(features)}): {features}")
    print(f"Target: {target}")
    print(f"Classes: {counts.to_dict()}")
    print(f"Train rows: {len(X_train)} | Test rows: {len(X_test)}")

    # XGBoost is omitted here to avoid the string-class encoding
    # failure in the previous script.
    candidates = ["DecisionTree", "RandomForest", "ANN"]

    results = []
    fitted = {}

    for model_name in candidates:
        try:
            model = build_pipeline(X_train, model_name)

            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model.fit(X_train, y_train)
                predictions = model.predict(X_test)

            class_names = sorted(y.unique())

            result = {
                "model": model_name,
                "accuracy": round(
                    float(accuracy_score(y_test, predictions)), 4
                ),
                "macro_f1": round(
                    float(
                        f1_score(
                            y_test,
                            predictions,
                            average="macro",
                            zero_division=0,
                        )
                    ),
                    4,
                ),
                "weighted_f1": round(
                    float(
                        f1_score(
                            y_test,
                            predictions,
                            average="weighted",
                            zero_division=0,
                        )
                    ),
                    4,
                ),
                "classification_report": classification_report(
                    y_test,
                    predictions,
                    labels=class_names,
                    output_dict=True,
                    zero_division=0,
                ),
                "confusion_matrix": confusion_matrix(
                    y_test,
                    predictions,
                    labels=class_names,
                ).tolist(),
                "confusion_matrix_labels": class_names,
            }

            results.append(result)
            fitted[model_name] = model

            print(
                f"{model_name:14s} "
                f"Accuracy={result['accuracy']:.4f} "
                f"Macro-F1={result['macro_f1']:.4f}"
            )

        except Exception as exc:
            results.append({
                "model": model_name,
                "error": f"{type(exc).__name__}: {exc}",
            })
            print(f"{model_name} FAILED: {exc}")

    valid_results = [
        result for result in results
        if "macro_f1" in result
        and result["model"] in fitted
    ]

    if not valid_results:
        raise RuntimeError(
            f"{task_name}: no model trained successfully."
        )

    # Select by macro-F1 first, then accuracy.
    best = max(
        valid_results,
        key=lambda result: (
            result["macro_f1"],
            result["accuracy"],
        ),
    )

    best_name = best["model"]

    MODELS.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)

    model_path = MODELS / f"{task_name}_pipeline.joblib"
    report_path = REPORTS / f"{task_name}_evaluation.json"

    # Save the selected fitted pipeline.
    joblib.dump(fitted[best_name], model_path)

    report = {
        "task": task_name,
        "dataset": path.name,
        "rows_used": int(len(df)),
        "features": features,
        "target": target,
        "class_counts": {
            str(label): int(count)
            for label, count in counts.items()
        },
        "split": {
            "train": int(len(X_train)),
            "test": int(len(X_test)),
            "random_state": RANDOM_STATE,
        },
        "selection_metric": "macro_f1_then_accuracy",
        "selected_model": best_name,
        "models": results,
        "evaluation_note": (
            "Holdout metrics measure performance on this dataset only. "
            "They do not establish field accuracy. If labels are derived "
            "from a climate-deficit formula, this is a proxy-label task, "
            "not validation against observed irrigation decisions."
        ),
    }

    report_path.write_text(
        json.dumps(report, indent=2, default=float),
        encoding="utf-8",
    )

    print(f"\nSelected model: {best_name}")
    print(f"Saved model: {model_path}")
    print(f"Saved report: {report_path}")

    return report


if __name__ == "__main__":
    for task_name, config in TASKS.items():
        try:
            train_task(task_name, config)
        except Exception as exc:
            print(f"\nERROR in {task_name}: {exc}")