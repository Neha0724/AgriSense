
from datetime import date


def get_crop_stage(crop, sowing_date=None, current_stage=None):
    crop = crop.strip().lower()

    if current_stage:
        return current_stage, "farmer_selected"

    if sowing_date:
        days = (date.today() - date.fromisoformat(sowing_date)).days

        if days < 0:
            raise ValueError("Sowing date cannot be in the future.")

        # Approximate stages for the initial prototype.
        if crop == "soybean":
            stages = [
                (15, "Germination"),
                (35, "Vegetative growth"),
                (60, "Flowering"),
                (90, "Pod development"),
                (9999, "Maturity"),
            ]
        elif crop == "cotton":
            stages = [
                (15, "Initial growth"),
                (45, "Vegetative growth"),
                (75, "Flowering"),
                (120, "Boll development"),
                (9999, "Maturity"),
            ]
        else:
            raise ValueError("Crop must be Cotton or Soybean.")

        for limit, stage in stages:
            if days <= limit:
                return stage, "estimated_from_sowing_date"

    return "Unknown", "stage_information_needed"


def get_crop_coefficient(crop, crop_stage):
    """
    Experimental crop coefficients based on the project's
    existing prototype dataset.

    Stage mapping is approximate and is not field-validated.
    """
    crop = crop.strip().lower()
    stage = crop_stage.strip().lower()

    if crop == "cotton":
        if stage in ("initial growth", "germination"):
            return 0.35
        elif stage in ("vegetative", "vegetative growth"):
            return 0.70
        elif stage == "flowering":
            return 1.15
        elif stage == "boll development":
            return 1.15
        elif stage == "maturity":
            return 0.70

    elif crop == "soybean":
        if stage == "germination":
            return 0.40
        elif stage in ("vegetative", "vegetative growth"):
            return 0.75
        elif stage == "flowering":
            return 1.10
        elif stage == "pod development":
            return 1.10
        elif stage == "maturity":
            return 0.50

    raise ValueError(
        f"Unsupported crop/stage combination: {crop}, {crop_stage}"
    )


def get_water_estimate(
    et0_mm,
    crop,
    crop_stage,
    effective_rain_mm,
    soil_type,
    surface_moisture,
    deep_moisture,
):
    # Select a coefficient using both crop and crop stage.
    crop_coefficient = get_crop_coefficient(crop, crop_stage)

    # Climate-based crop water-use estimate.
    etc_mm = et0_mm * crop_coefficient
    climate_deficit_mm = max(0, etc_mm - effective_rain_mm)

    moisture_available = (
        surface_moisture is not None
        and deep_moisture is not None
    )

    if not moisture_available:
        moisture_status = "Soil moisture data unavailable."
    else:
        moisture_status = (
            "Modelled soil moisture is available, "
            "but field water availability is unverified."
        )

    if effective_rain_mm >= etc_mm:
        advisory_summary = (
            "Rainfall meets or exceeds estimated crop water use. "
            "Verify field conditions before deciding on irrigation."
        )
    elif not moisture_available:
        advisory_summary = (
            "Climate deficit estimated, but soil moisture is unavailable. "
            "Check the field before making an irrigation decision."
        )
    else:
        advisory_summary = (
            "A climate water deficit is estimated. "
            "Modelled soil moisture alone cannot confirm irrigation need. "
            "Check field conditions before deciding."
        )

    return {
        "crop": crop.title(),
        "crop_stage": crop_stage,
        "crop_coefficient": crop_coefficient,
        "soil_type": soil_type,
        "soil_moisture": {
            "surface_m3_m3": surface_moisture,
            "deep_m3_m3": deep_moisture,
            "source": "Open-Meteo modelled estimate",
        },
        "estimated_crop_water_use_mm_day": round(etc_mm, 2),
        "climate_deficit_proxy_mm": round(climate_deficit_mm, 2),
        "climate_deficit_proxy_litres_per_hectare": round(
            climate_deficit_mm * 10000, 0
        ),
        "water_balance_status": (
            "Moisture data available; soil-water storage "
            "cannot yet be calculated without validated "
            "soil parameters and effective root depth."
            if moisture_available
            else "Soil-moisture data unavailable; estimate "
                 "uses climate inputs only."
        ),
        "warning": (
            "Experimental estimate only. Crop coefficients and "
            "stage mapping are provisional. The climate deficit "
            "is not a field-validated irrigation dose. "
            "Do not use it as a direct watering instruction."
        ),
        "moisture_interpretation": moisture_status,
        "advisory_summary": advisory_summary,
    }