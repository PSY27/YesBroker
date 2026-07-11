"""Enrich specialist AgentResult with recommend_next and structured output."""

from __future__ import annotations

from agents.recommendations import recommend_next_for
from schema import AgentResult, CaseState


def enrich_agent_result(result: AgentResult, state: CaseState | None = None) -> AgentResult:
    recs = list(result.recommend_next) if result.recommend_next else recommend_next_for(result)

    # Photo clean but price/text already flagged → recommend deeper photo pass
    if state and result.agent == "photo" and result.verdict == "CLEAN":
        others = {f.agent: f.verdict for f in state.findings if f.agent != "photo"}
        if others.get("price") in ("BAIT", "SUSPICIOUS") or others.get("text") == "SUSPICIOUS":
            if "photo" not in recs:
                recs.append("photo")

    structured = dict(result.structured_evidence or {})
    structured["agent_output"] = result.to_agent_output(recs)

    return result.model_copy(
        update={
            "recommend_next": recs,
            "structured_evidence": structured,
        }
    )
