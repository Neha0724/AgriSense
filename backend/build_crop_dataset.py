
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent

INPUT_FILE = (
    ROOT / "data" /
    "nagpur_historical_weather_soil_moisture.csv"
)

OUTPUT_FILE = (
    ROOT / "data" /
    "nagpur_crop_water_demand_experimental.csv"
)

weather = pd.read_csv(INPUT_FILE, parse_dates=["date"])

# Illustrative crop-coefficient assumptions.
# Replace with locally validated values for the selected
# cultivar, growth stage and farming conditions.
#
# These are NOT verified Nagpur-specific recommendations.
CROP_COEFFICIENTS = {
    "Cotton": {
        "Initial": 0.35,
        "Development": 0.70,
        "Mid-season": 1.15,
        "Late-season": 0.70,
    },
    "Soybean": {
        "Initial": 0.40,
        "Development": 0.75,
        "Mid-season": 1.10,
        "Late-season": 0.50,
    },
}

# This creates scenario rows, not actual crop observations.
# Stage must eventually be determined from planting date
# and locally appropriate crop-stage durations.
scenarios = []

for crop, stages in CROP_COEFFICIENTS.items():
    for stage, kc in stages.items():
        part = weather.copy()
        part["crop"] = crop
        part["crop_stage_scenario"] = stage
        part["kc_assumption"] = kc

        # Climate-based crop evapotranspiration estimate.
        part["etc_estimate_mm_day"] = (
            part["et0_mm"] * kc
        )

        # Simplified climate-only deficit proxy.
        # Assumes all rainfall is effective, which is not
        # realistic in every condition.
        part["climate_deficit_proxy_mm"] = (
            part["etc_estimate_mm_day"]
            - part["rainfall_mm"]
        ).clip(lower=0)

        # 1 mm over 1 hectare = 10,000 litres.
        part["climate_deficit_proxy_litres_ha"] = (
            part["climate_deficit_proxy_mm"] * 10000
        )

        # Explicitly mark that this is not ground truth.
        part["label_status"] = "experimental_proxy_not_field_truth"

        scenarios.append(part)

result = pd.concat(scenarios, ignore_index=True)
result.to_csv(OUTPUT_FILE, index=False)

print("Saved:", OUTPUT_FILE)
print("Rows:", len(result))
print("\nRows per crop:")
print(result.groupby("crop").size())

print("\nSample:")
print(result[[
    "date",
    "crop",
    "crop_stage_scenario",
    "et0_mm",
    "rainfall_mm",
    "etc_estimate_mm_day",
    "climate_deficit_proxy_mm",
    "climate_deficit_proxy_litres_ha",
]].head(10).to_string(index=False))

print(
    "\nWARNING: These are climate-based estimates, "
    "not validated irrigation recommendations."
)