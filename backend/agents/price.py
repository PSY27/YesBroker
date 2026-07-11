from schema import CaseState, AgentResult

async def run_price_agent(state: CaseState) -> AgentResult:
    """
    Price-Sanity Agent: Compares listing rent to neighborhood medians.
    If rent is significantly below the median, flags it as BAIT.
    """
    listing = state.listing
    rent = listing.rent
    bhk = listing.bhk
    area = listing.pincode or "560038" # default to Indiranagar
    
    # Static neighborhood medians for 2BHK
    medians = {
        "560038": 35000, # Indiranagar
        "560075": 32000, # Jeevan Bima Nagar
        "560071": 30000, # Domlur
        "560066": 28000, # Whitefield
        "560034": 33000, # Koramangala
    }
    
    median = medians.get(area, 35000)
    
    # Let's adjust median based on BHK if not 2
    if bhk == "1":
        median = int(median * 0.5)
    elif bhk == "3":
        median = int(median * 1.6)
        
    deviation = (median - rent) / median
    
    if deviation >= 0.40:
        pct = int(deviation * 100)
        return AgentResult(
            agent="price",
            verdict="BAIT",
            detail=f"Rent ₹{rent:,} is {pct}% BELOW the ₹{median:,} area median for a {bhk} BHK.",
            evidence=[f"Area median: ₹{median:,}", f"Listing rent: ₹{rent:,}", f"Deviation: {pct}% below median"],
            confidence=0.95,
            weight=0.15
        )
    elif deviation >= 0.20:
        pct = int(deviation * 100)
        return AgentResult(
            agent="price",
            verdict="SUSPICIOUS",
            detail=f"Rent ₹{rent:,} is {pct}% below the ₹{median:,} area median. Slightly underpriced.",
            evidence=[f"Area median: ₹{median:,}", f"Deviation: {pct}% below median"],
            confidence=0.80,
            weight=0.15
        )
    else:
        return AgentResult(
            agent="price",
            verdict="CLEAN",
            detail=f"Rent ₹{rent:,} is in line with the ₹{median:,} area median.",
            evidence=[f"Area median: ₹{median:,}"],
            confidence=0.90,
            weight=0.15
        )
