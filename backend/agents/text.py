import re
from schema import CaseState, AgentResult

async def run_text_agent(state: CaseState) -> AgentResult:
    """
    Text-Tells Agent: Scans listing description for scam linguistic patterns,
    coercive payment language, and off-platform communication bypasses.
    """
    listing = state.listing
    desc = (listing.description or "").lower()
    
    scam_patterns = {
        "owner abroad": [r"owner (?:is )?going abroad", r"owner abroad", r"living abroad", r"out of country"],
        "token to hold": [r"token (?:to )?hold", r"pay token", r"reserve the flat", r"refundable token", r"advance token"],
        "whatsapp direct": [r"whatsapp me", r"whatsapp directly", r"message on whatsapp", r"no calls", r"direct owner contact"],
        "coercive urgency": [r"urgent listing", r"huge queue", r"first come first served", r"rent out urgently"]
    }
    
    flagged_reasons = []
    evidence = []
    
    for key, regexes in scam_patterns.items():
        for regex in regexes:
            match = re.search(regex, desc)
            if match:
                flagged_reasons.append(key)
                evidence.append(f"Found phrase matching '{match.group(0)}'")
                break # Move to next pattern category
                
    if len(flagged_reasons) >= 2:
        return AgentResult(
            agent="text",
            verdict="SUSPICIOUS",
            detail=f"Scam linguistics found: {', '.join(flagged_reasons)}. High indicators of bait-and-switch.",
            evidence=evidence,
            confidence=0.90,
            weight=0.10
        )
    elif len(flagged_reasons) == 1:
        return AgentResult(
            agent="text",
            verdict="SUSPICIOUS",
            detail=f"Suspicious pattern found: {flagged_reasons[0]}. Directing verification.",
            evidence=evidence,
            confidence=0.70,
            weight=0.10
        )
    else:
        return AgentResult(
            agent="text",
            verdict="CLEAN",
            detail="Description text appears normal and professional with no known scam linguistic markers.",
            evidence=["No scam keywords flagged"],
            confidence=0.85,
            weight=0.10
        )
