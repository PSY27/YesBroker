import requests
import json
import sys

def main():
    print("🚀 YesBroker Backend Flow Test: Starting verification...\n")

    # 1. Prepare search payload
    search_payload = {
        "area": "", # Match any area
        "pincode": "",
        "max_rent": 100000,
        "bhk": "3",
        "power_backup": True,
        "non_veg": False
    }

    print(f"🔍 [SEARCH] Sending POST /search with criteria:")
    print(json.dumps(search_payload, indent=2))
    print()

    # Send search request to running backend
    try:
        r = requests.post("http://127.0.0.1:8000/search", json=search_payload)
        r.raise_for_status()
        results = r.json()
    except Exception as e:
        print(f"❌ Backend search failed: {e}")
        print("Please ensure the backend is running at http://127.0.0.1:8000")
        sys.exit(1)

    print(f"✅ Found {len(results)} matching 3BHK listings:")
    for rank in results:
        print(f"  Rank #{rank['rank']} | ID: {rank['id']} | {rank['title']} | Rent: ₹{rank['rent']} | Verdict: {rank['verdict']} | Score: {rank['score']} - {rank['one_liner']}")
    print()

    if not results:
        print("⚠️ No matching listings found. Let's broaden search or inspect the database.")
        sys.exit(0)

    # 2. Pick the first listing for live AI multi-agent investigation!
    target = results[0]
    listing_id = target['id']
    print(f"🤖 [INVESTIGATE] Initiating Live AI Multi-Agent Safety Verification for Listing {listing_id} ({target['title']})...")
    print("⏳ Running live Gemini model (gemini-3.1-pro-preview). This runs five specialized agents in parallel...")
    print()

    # Trigger live investigation
    try:
        # We will stream the logs so we see the live agent decision trace in real-time!
        r_stream = requests.get(f"http://127.0.0.1:8000/investigate/stream?id={listing_id}", stream=True)
        r_stream.raise_for_status()

        # Parse SSE stream chunk-by-chunk
        print("📜 --- LIVE AGENT DECISION LOGS / STREAM ---")
        for line in r_stream.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith("data: "):
                    payload = json.loads(decoded[6:])
                    p_type = payload.get("type")
                    if p_type == "start":
                        print(f"🚦 [START] Verifying: {payload.get('title')}")
                    elif p_type == "trace":
                        # Print agent's live reasoning step!
                        agent_name = payload.get("agent", "System")
                        message = payload.get("message", "")
                        print(f"💬 [{agent_name.upper()}] -> {message}")
                    elif p_type == "done":
                        # Output the final generated trust report and verdict!
                        report = payload.get("report", {})
                        print("\n📊 --- FINAL AGENT TRUST REPORT GENERATED ---")
                        print(f"🏆 Final Safety Score: {report.get('score')}/100")
                        print(f"🚨 Final Verdict: {report.get('verdict')}")
                        print("\n🚩 Detected Flags:")
                        for flag in report.get("flags", []):
                            print(f"  - [{flag.get('agent').upper()}] Verdict: {flag.get('verdict')} (Confidence: {flag.get('confidence')*100}%)")
                            print(f"    Detail: {flag.get('detail')}")
                        print("\n💡 Questions to Ask Landlord:")
                        for q in report.get("questions_to_ask", []):
                            print(f"  - {q}")
                        print()
    except Exception as e:
        print(f"❌ Investigation failed: {e}")

if __name__ == "__main__":
    main()
