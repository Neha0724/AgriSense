
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
FILE = ROOT / "data" / "nagpur_historical_weather_soil_moisture.csv"

df = pd.read_csv(FILE)

print("Dataset shape:", df.shape)
print("\nDate range:")
print(df["date"].min(), "to", df["date"].max())

print("\nDuplicate dates:", df["date"].duplicated().sum())

columns = [
    "rainfall_mm",
    "temperature_mean_c",
    "humidity_mean_pct",
    "soil_moisture_0_7cm_m3m3",
    "soil_moisture_7_28cm_m3m3",
]

if "et0_mm" in df.columns:
    columns.append("et0_mm")

print("\nSummary statistics:")
print(df[columns].describe().round(3))

print("\nMissing values:")
print(df[columns].isna().sum())

print("\nIrrigation target available:", "Irrigation_Need" in df.columns)
print("Crop column available:", "Crop" in df.columns)
print("Crop stage available:", "Crop_Stage" in df.columns)