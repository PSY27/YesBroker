import os
import sys
import json

# Align path imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock Chinnappanahalli listings database
CHINNAPPANAHALLI_LISTINGS = [
    {
        "id": "CPH_001",
        "title": "2 BHK Premium Flat - Chinnappanahalli Layout",
        "rent": 32000,
        "pincode": "560037",
        "description": "Spacious 2 BHK on the 3rd floor. Comes with complete 100% power backup, modular kitchen, and covered parking. Open to all tenants (non-veg allowed). Very close to outer ring road.",
        "has_backup": True,
        "veg_only": False
    },
    {
        "id": "CPH_002",
        "title": "Charming 2BHK near Chinnappanahalli Lake",
        "rent": 28000,
        "pincode": "560037",
        "description": "Cozy 2BHK flat with beautiful lake view. Very quiet residential area. Please note: strictly pure vegetarians only. No power backup available in this building.",
        "has_backup": False,
        "veg_only": True
    },
    {
        "id": "CPH_003",
        "title": "2 BHK Semi-Furnished - Chinnappanahalli Main Road",
        "rent": 30000,
        "pincode": "560037",
        "description": "Well maintained 2BHK close to bus stop. Non-veg families are welcome. Safe neighborhood. Power backup is not available, but inverter line is provided.",
        "has_backup": False,
        "veg_only": False
    }
]

def run_simulation():
    # User Preferences
    user_prefs = {
        "bhk": "2",
        "area": "Chinnappanahalli",
        "power_backup_needed": True,
        "non_veg_needed": True
    }

    print("=" * 70)
    print("   YESBROKER (GHARCHECK) - PREFERENCE MATCH & SCAM SCANNER")
    print("=" * 70)
    print(f"Target Preferences: {user_prefs['bhk']} BHK in {user_prefs['area']}")
    print(f"Required Amenities: Power Backup [YES] | Non-Veg Allowed [YES]")
    print("-" * 70)
    print(f"Scanning {len(CHINNAPPANAHALLI_LISTINGS)} scraped Chinnappanahalli properties...\n")

    for i, listing in enumerate(CHINNAPPANAHALLI_LISTINGS):
        print(f"PROPERTY {i+1}: {listing['title']}")
        print(f"Rent: ₹{listing['rent']:,} | Pincode: {listing['pincode']}")
        print(f"Description: \"{listing['description']}\"")
        
        # Agent Analysis Engine
        print("\n  [Agent Findings & Text Analysis]:")
        
        conflicts = []
        warnings = []
        score = 100
        
        # 1. Power Backup check
        extracted_backup = listing['has_backup']
        
        if user_prefs["power_backup_needed"]:
            if extracted_backup:
                print("   🟢 Text-Tells Agent: Verified! Power backup is active and confirmed.")
            else:
                print("   ⚠️ Text-Tells Agent: Warning! Power backup requested but not available.")
                warnings.append("No active generator power backup available.")
                score -= 20

        # 2. Vegetarian restriction check
        extracted_veg_only = listing['veg_only']
        
        if user_prefs["non_veg_needed"]:
            if extracted_veg_only:
                print("   ❌ Text-Tells Agent: Conflict! Pure vegetarian restriction detected in listing.")
                conflicts.append("Strictly vegetarian policy - Non-veg families restricted.")
                score -= 40
            else:
                print("   🟢 Text-Tells Agent: Verified! Non-veg cooking is permitted.")

        # Final verdict calculation
        print(f"  \n  [Arbiter Summary Dashboard]:")
        if conflicts:
            verdict = "❌ BLOCKED (PREFERENCE CONFLICT)"
            color_verdict = "\033[91m" + verdict + "\033[0m" # red text for terminal if supported
        elif warnings:
            verdict = "⚠️ PARTIAL MATCH (AMENITY WARNING)"
            color_verdict = "\033[93m" + verdict + "\033[0m" # yellow
        else:
            verdict = "✅ PERFECT MATCH (PREFERENCES SATISFIED)"
            color_verdict = "\033[92m" + verdict + "\033[0m" # green

        print(f"   Match Score: {score}/100")
        print(f"   Verdict: {verdict}")
        
        if conflicts:
            for conflict in conflicts:
                print(f"   - CONFLICT: {conflict}")
        if warnings:
            for warning in warnings:
                print(f"   - WARNING: {warning}")
                
        print("-" * 70)

if __name__ == "__main__":
    run_simulation()
