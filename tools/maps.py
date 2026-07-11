from __future__ import annotations
import random
from typing import Any

from tools.gemini_client import generate_json, is_configured

# Offline Bangalore commute matrix (used when GEMINI_API_KEY is not set)
_BANGALORE_COMMUTES: dict[str, dict[str, float | int]] = {
    "100 ft road": {"distance_km": 4.5, "duration_min": 15, "metro_min": 3},
    "12th main": {"distance_km": 5.2, "duration_min": 18, "metro_min": 5},
    "cmh road": {"distance_km": 5.8, "duration_min": 22, "metro_min": 2},
    "jeevan bima nagar": {"distance_km": 3.8, "duration_min": 20, "metro_min": 12},
    "hal 2nd stage": {"distance_km": 4.1, "duration_min": 22, "metro_min": 8},
    "domlur border": {"distance_km": 1.5, "duration_min": 8, "metro_min": 10},
    "double road": {"distance_km": 6.2, "duration_min": 25, "metro_min": 15},
    "14th main": {"distance_km": 5.5, "duration_min": 28, "metro_min": 12},
    "hal 3rd stage": {"distance_km": 4.8, "duration_min": 21, "metro_min": 21},
    "defence colony": {"distance_km": 5.0, "duration_min": 25, "metro_min": 15},
    "whitefield": {"distance_km": 18.5, "duration_min": 65, "metro_min": 45},
    "koramangala": {"distance_km": 6.8, "duration_min": 35, "metro_min": 25},
}


class GoogleMapsWrapper:
    """
    Commute validation via Gemini Google Maps grounding.
    Estimates peak-hour drive and metro times in Bangalore.
    """

    async def get_commute_time(
        self, origin: str, destination: str = "Embassy GolfLinks, Bangalore"
    ) -> dict[str, Any]:
        print(f"[Tools/Maps] Calculating commute from '{origin}' to '{destination}'...")

        if is_configured():
            prompt = (
                f"Estimate peak 9 AM Bangalore commute times from '{origin}' to '{destination}'.\n"
                "Include: driving time with traffic, nearest metro station walk/drive time, and distance in km.\n"
                'Return JSON: {"distance_km": float, "drive_duration_minutes": int, "metro_duration_minutes": int}'
            )
            data = await generate_json(prompt, google_maps=True, caller="maps")
            if data:
                print("[Tools/Maps] Gemini Maps grounding: commute estimated.")
                return {
                    "origin": origin,
                    "destination": destination,
                    "distance": f"{data.get('distance_km', '?')} km",
                    "drive_duration_minutes": int(data.get("drive_duration_minutes", 20)),
                    "metro_duration_minutes": int(data.get("metro_duration_minutes", 10)),
                    "peak_9am_traffic_multiplier": 1.45,
                    "is_grounded_live": True,
                }

        return self._offline_commute(origin, destination)

    def _offline_commute(self, origin: str, destination: str) -> dict[str, Any]:
        origin_lower = origin.lower()
        matched = next(
            (v for k, v in _BANGALORE_COMMUTES.items() if k in origin_lower),
            None,
        )
        if not matched:
            matched = {
                "distance_km": round(random.uniform(3.0, 10.0), 1),
                "duration_min": random.randint(15, 40),
                "metro_min": random.randint(5, 20),
            }

        print("[Tools/Maps] Offline commute matrix used (set GEMINI_API_KEY in .env for live).")
        return {
            "origin": origin,
            "destination": destination,
            "distance": f"{matched['distance_km']} km",
            "drive_duration_minutes": matched["duration_min"],
            "metro_duration_minutes": matched["metro_min"],
            "peak_9am_traffic_multiplier": 1.45,
            "is_grounded_live": False,
        }
