
from pathlib import Path
from datetime import date, timedelta

import requests
import pandas as pd


# Project paths
ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = DATA_DIR / "nagpur_historical_weather_soil_moisture.csv"

# Nagpur coordinates
LATITUDE = 21.1463
LONGITUDE = 79.0849

# Last complete day and the preceding one-year period
END_DATE = date.today() - timedelta(days=1)
START_DATE = END_DATE - timedelta(days=364)

URL = "https://archive-api.open-meteo.com/v1/archive"

PARAMS = {
    "latitude": LATITUDE,
    "longitude": LONGITUDE,
    "start_date": START_DATE.isoformat(),
    "end_date": END_DATE.isoformat(),
    "hourly": ",".join([
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "soil_moisture_0_to_7cm",
        "soil_moisture_7_to_28cm",
        "soil_temperature_0_to_7cm",
        "et0_fao_evapotranspiration",
    ]),
    "timezone": "Asia/Kolkata",
}

def main():
    print("Fetching historical data for Nagpur...")
    print(f"Date range: {START_DATE} to {END_DATE}")

    response = requests.get(URL, params=PARAMS, timeout=60)
    response.raise_for_status()

    result = response.json()
    hourly = result.get("hourly")

    if not hourly or not hourly.get("time"):
        raise ValueError("No hourly data received from API.")

    df = pd.DataFrame(hourly)
    df["time"] = pd.to_datetime(df["time"])

    # Convert hourly observations into daily features.
    df = df.set_index("time")

    daily = df.resample("D").agg({
        "temperature_2m": "mean",
        "relative_humidity_2m": "mean",
        "precipitation": "sum",
        "soil_moisture_0_to_7cm": "mean",
        "soil_moisture_7_to_28cm": "mean",
        "soil_temperature_0_to_7cm": "mean",
        "et0_fao_evapotranspiration": "sum",
    }).reset_index()

    daily = daily.rename(columns={
        "time": "date",
        "temperature_2m": "temperature_mean_c",
        "relative_humidity_2m": "humidity_mean_pct",
        "precipitation": "rainfall_mm",
        "soil_moisture_0_to_7cm": "soil_moisture_0_7cm_m3m3",
        "soil_moisture_7_to_28cm": "soil_moisture_7_28cm_m3m3",
        "soil_temperature_0_to_7cm": "soil_temperature_0_7cm_c",
        "et0_fao_evapotranspiration": "et0_mm",
    })

    daily["location"] = "Nagpur"
    daily["latitude"] = LATITUDE
    daily["longitude"] = LONGITUDE

    # Preserve missing observations; do not invent values.
    daily.to_csv(OUTPUT_FILE, index=False)

    print("\nData collection completed!")
    print("Rows:", len(daily))
    print("Columns:", list(daily.columns))
    print("Missing values:")
    print(daily.isna().sum().to_string())
    print("\nFirst five rows:")
    print(daily.head().to_string(index=False))
    print(f"\nCSV saved at: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()