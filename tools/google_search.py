import os
import re
from typing import Any

from tools.gemini_client import generate_json, is_configured


class GoogleSearchWrapper:
    """
    Web recon via Gemini Google Search grounding.
    Checks broker phone numbers and listing addresses against scam reports.
    """

    # Offline demo corpus when GEMINI_API_KEY is not set
    _SCAM_DATABASE: dict[str, list[dict[str, str]]] = {
        "93003 40056": [
            {
                "title": "GPay Token advance fraud list - Bangalore Police",
                "snippet": "Warning: Phone number +91 93003 40056 has been added to the local cyber crime directory for rental deposit scams in Indiranagar.",
                "url": "https://karnatakapolice.gov.in/cybercrime/blacklist",
            },
            {
                "title": "Beware of GPay scammer using UK relocating story",
                "snippet": "User report: This person +91 9300340056 posted an ad in HAL 3rd stage for 18k rent. Demanded 5k GPay deposit before showing flat and then switched off phone.",
                "url": "https://complaintboard.in/realestate/scammer-9300340056",
            },
        ],
        "94004 50067": [
            {
                "title": "Defence Colony token scam report #20391",
                "snippet": "The holder of 9400450067 has multiple complaints filed for posing as direct landlord and asking for ₹5000 fast token transfers on Paytm.",
                "url": "https://consumerforum.org/scam/9400450067",
            },
        ],
        "95005 11223": [
            {
                "title": "Military Officer gatepass rental cheat",
                "snippet": "Avoid +91 9500511223. Claimed to be an army officer relocated to Jammu, asked for 3k refundable security gatepass fee.",
                "url": "https://quikrscams.blogspot.com/army-officer-fraud",
            },
        ],
        "9300340056": [
            {
                "title": "GPay Token advance fraud list - Bangalore Police",
                "snippet": "Warning: Phone number +91 93003 40056 has been added to the local cyber crime directory.",
                "url": "https://karnatakapolice.gov.in/cybercrime/blacklist",
            },
        ],
    }

    async def search_query(self, query: str) -> list[dict[str, Any]]:
        print(f"[Tools/Search] Querying via Gemini Google Search: '{query}'...")

        if is_configured():
            prompt = (
                f"Search the web for rental scam complaints related to: {query}\n"
                "Focus on Bangalore rental fraud, phone blacklists, and cross-portal duplicate listings.\n"
                'Return JSON: {"results": [{"title": "...", "snippet": "...", "url": "..."}], "is_scam": true/false}'
            )
            data = await generate_json(prompt, google_search=True)
            if data and data.get("results"):
                results = data["results"]
                if data.get("is_scam"):
                    print(f"[Tools/Search] Gemini grounding: {len(results)} scam-related hits.")
                else:
                    print("[Tools/Search] Gemini grounding: query appears clean.")
                return results

        return self._offline_search(query)

    def _offline_search(self, query: str) -> list[dict[str, Any]]:
        cleaned_query = re.sub(r"\D", "", query)
        for key, value in self._SCAM_DATABASE.items():
            cleaned_key = re.sub(r"\D", "", key)
            if cleaned_key and cleaned_key in cleaned_query:
                print(f"[Tools/Search] Offline blacklist: {len(value)} hits for {query}.")
                return value

        print("[Tools/Search] Offline search: query appears clean.")
        return [
            {
                "title": f"Contact search: {query}",
                "snippet": "No immediate scam complaints found. Listings or reviews relate to normal business interactions.",
                "url": f"https://scandirectory.com/search?q={query}",
            }
        ]
