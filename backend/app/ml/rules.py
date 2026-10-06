"""Rule-based recommendation logic.

This is the same logic the frontend used to run in the browser, moved to the
server. It is used whenever no trained model is configured, and it also
supplies the human-readable "reasons" shown next to model predictions.
"""

TARGET_N, TARGET_P, TARGET_K = 75, 45, 55


def irrigation_rules(moisture, rain, growth_stage):
    if moisture < 35 or (moisture < 45 and rain < 10):
        return {
            "status": "Irrigate Today", "amount": "22–26 L/m²", "litres": 24,
            "timing": "Early morning (06:00 - 08:00 AM)", "confidence": 93,
            "reasons": [
                f"Soil moisture ({moisture:g}%) is significantly below target range.",
                f"Expected rainfall ({rain:g} mm) is insufficient to meet crop evapotranspiration.",
                f"Crop in {growth_stage} stage requires sustained root moisture.",
            ],
        }
    if moisture < 48:
        return {
            "status": "Irrigate Today", "amount": "18–22 L/m²", "litres": 20,
            "timing": "Early morning (06:00 - 08:00 AM)", "confidence": 91,
            "reasons": [
                f"Soil moisture ({moisture:g}%) is moderate but declining.",
                f"Low rain forecast ({rain:g} mm) over next 24h.",
                "Optimal timing prevents thermal stress during peak daytime temperature.",
            ],
        }
    return {
        "status": "Optimal Moisture", "amount": "0 L/m²", "litres": 0,
        "timing": "Re-check in 24 hours", "confidence": 96,
        "reasons": [
            f"Soil moisture ({moisture:g}%) is adequate for active growth.",
            f"Rainfall level ({rain:g} mm) supports current field capacity.",
        ],
    }


def fertilizer_rules(n, p, k):
    return (
        max(0, round(TARGET_N - n)),
        max(0, round(TARGET_P - p)),
        max(0, round(TARGET_K - k)),
    )


def fertilizer_reasons(n, p, k, n_need, p_need, k_need):
    return [
        f"Nitrogen deficit detected ({n:g} mg/kg). Supplement {n_need} kg/ha." if n_need > 20
        else f"Nitrogen ({n:g} mg/kg) is adequate.",
        f"Phosphorus supplementation recommended ({p_need} kg/ha)." if p_need > 10
        else f"Phosphorus ({p:g} mg/kg) is healthy.",
        f"Potassium boost of {k_need} kg/ha recommended." if k_need > 10
        else f"Potassium level ({k:g} mg/kg) is in range.",
    ]
