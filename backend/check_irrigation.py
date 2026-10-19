
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

from train_models import build_pipeline, RANDOM_STATE

df = pd.read_csv("data/irrigation.csv")

target = "Irrigation_Need"

feature_sets = {
    "All features": [
        "district", "Soil_Type", "Crop", "Crop_Stage",
        "soil_moisture_pct", "soil_moisture_volume"
    ],
    "Without moisture": [
        "district", "Soil_Type", "Crop", "Crop_Stage"
    ],
    "Moisture only": [
        "soil_moisture_pct", "soil_moisture_volume"
    ],
}

y = df[target].astype(str).str.strip()

# Same split for every experiment
train_idx, test_idx = train_test_split(
    df.index,
    test_size=0.2,
    random_state=RANDOM_STATE,
    stratify=y
)

for set_name, features in feature_sets.items():
    X = df[features]

    X_train, X_test = X.loc[train_idx], X.loc[test_idx]
    y_train, y_test = y.loc[train_idx], y.loc[test_idx]

    print(f"\n--- {set_name} ---")

    for model_name in ["DecisionTree", "RandomForest"]:
        model = build_pipeline(X_train, model_name)
        model.fit(X_train, y_train)
        pred = model.predict(X_test)

        print(
            f"{model_name}: "
            f"Accuracy={accuracy_score(y_test, pred):.4f}, "
            f"Macro-F1={f1_score(y_test, pred, average='macro'):.4f}"
        )