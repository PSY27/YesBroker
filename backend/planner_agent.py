"""Lightweight planner: decides which agents run next (Gemini JSON or offline heuristics)."""

from __future__ import annotations

import json

from agents.recommendations import collect_agent_recommendations
from schema import AgentResult, CaseState, Listing, PlannerDecision
from tools.gemini_client import generate_json, is_configured
from trace import TraceKind, trace_emit

INVESTIGATION_GOAL = (
    "Verify whether this Bangalore rental listing is trustworthy and flag bait-and-switch or scam risk."
)

ALL_AGENTS = ("price", "text", "photo", "web", "commute")
MAX_ROUNDS = 8


def _verdicts(findings: list[AgentResult]) -> dict[str, str]:
    return {f.agent: f.verdict for f in findings}


def _apply_escalation_directives(state: CaseState, findings: list[AgentResult], agents: list[str]) -> None:
    verdicts = _verdicts(findings)
    price_flag = verdicts.get("price") in ("BAIT", "SUSPICIOUS")
    text_flag = verdicts.get("text") == "SUSPICIOUS"

    if price_flag or text_flag:
        if "photo" in agents and state.directives.get("photo") != "dedup_lowthreshold":
            state.directives["photo"] = "deep_scan"
        if "web" in agents:
            state.directives["web"] = "check_phone_and_dupes"
    else:
        if "photo" in agents:
            state.directives.setdefault("photo", "standard_scan")
        if "web" in agents:
            state.directives.setdefault("web", "standard_lookup")

    if "commute" in agents:
        state.directives.setdefault("commute", "standard_route")
        photo = verdicts.get("photo")
        if photo == "SUSPICIOUS":
            photo_finding = next((f for f in findings if f.agent == "photo"), None)
            evidence_ref = photo_finding.evidence[0] if photo_finding and photo_finding.evidence else "photo conflict"
            state.directives["commute"] = f"verify address vs {evidence_ref}"


def _offline_plan(state: CaseState, completed: set[str]) -> PlannerDecision:
    findings = state.findings
    agent_recs = collect_agent_recommendations(findings)
    pending = [a for a in ALL_AGENTS if a not in completed]

    if not completed:
        return PlannerDecision(
            next_agents=["price", "text"],
            reason="Start with fast triage agents (price sanity + text tells).",
            stop=False,
        )

    verdicts = _verdicts(findings)
    price_flag = verdicts.get("price") in ("BAIT", "SUSPICIOUS")
    text_flag = verdicts.get("text") == "SUSPICIOUS"

    if price_flag or text_flag:
        next_batch = [a for a in ("photo", "web") if a in pending]
        if next_batch:
            parts = []
            if price_flag:
                parts.append("pricing anomaly")
            if text_flag:
                parts.append("suspicious language")
            reason = (
                f"Escalating — {' and '.join(parts)} require further verification. "
                f"Specialist recommendations: {', '.join(agent_recs) or 'photo, web'}."
            )
            return PlannerDecision(next_agents=next_batch, reason=reason, stop=False)

    if verdicts.get("photo") == "SUSPICIOUS" and "commute" in pending:
        return PlannerDecision(
            next_agents=["commute"],
            reason="Photo conflict detected; re-running commute with address verification.",
            stop=False,
        )

    deep_pending = [a for a in ("photo", "web", "commute") if a in pending]
    if deep_pending and {"price", "text"} <= completed:
        # Run commute only after photo (and ideally web) when doing baseline pass
        if "photo" in pending:
            batch = [a for a in ("photo", "web") if a in pending] or ["photo"]
        elif "web" in pending:
            batch = ["web"]
        elif "commute" in pending and "photo" in completed:
            batch = ["commute"]
        else:
            batch = deep_pending[:1]
        return PlannerDecision(
            next_agents=batch,
            reason="Baseline checks complete; continuing targeted verification.",
            stop=False,
        )

    if agent_recs:
        next_from_recs = [a for a in agent_recs if a in pending]
        if next_from_recs:
            return PlannerDecision(
                next_agents=next_from_recs,
                reason=f"Following specialist recommendations: {', '.join(next_from_recs)}.",
                stop=False,
            )

    if pending:
        return PlannerDecision(
            next_agents=[pending[0]],
            reason=f"Remaining verification step: {pending[0]}.",
            stop=False,
        )

    return PlannerDecision(
        next_agents=[],
        reason="All planned specialist checks are complete.",
        stop=True,
    )


async def _gemini_plan(state: CaseState, completed: set[str]) -> PlannerDecision | None:
    if not is_configured():
        return None

    listing = state.listing
    findings_payload = [f.to_agent_output() for f in state.findings]
    agent_recs = collect_agent_recommendations(state.findings)
    pending = [a for a in ALL_AGENTS if a not in completed]

    prompt = (
        "You are the Planner for a rental-trust investigation system in Bangalore.\n"
        f"Goal: {INVESTIGATION_GOAL}\n\n"
        f"Listing: {listing.id} — {listing.title}, rent ₹{listing.rent}, {listing.bhk} BHK\n"
        f"Completed agents: {sorted(completed) or 'none'}\n"
        f"Pending agents: {pending}\n"
        f"Collected findings JSON:\n{json.dumps(findings_payload, indent=2)}\n"
        f"Union of agent recommend_next: {agent_recs}\n\n"
        "Decide which agent(s) should run next. Only pick from pending agents.\n"
        "Run independent agents together when useful (e.g. photo + web).\n"
        "Set stop=true only when no further agents are needed.\n"
        'Return JSON: {"next_agents": ["photo"], "reason": "...", "stop": false}'
    )

    data = await generate_json(prompt, caller="planner_agent")
    if not data:
        return None

    next_agents = [a for a in data.get("next_agents", []) if a in pending]
    stop = bool(data.get("stop", False))
    reason = str(data.get("reason", "Planner decision from Gemini."))

    if not next_agents and not stop and pending:
        return None

    return PlannerDecision(next_agents=next_agents, reason=reason, stop=stop or not next_agents)


async def plan_next_step(state: CaseState, completed: set[str]) -> PlannerDecision:
    trace_emit(TraceKind.PLANNER, "planner", "Reviewing evidence...")

    decision = await _gemini_plan(state, completed)
    if decision is None:
        decision = _offline_plan(state, completed)

    if decision.next_agents:
        label = " + ".join(a.title() for a in decision.next_agents)
        trace_emit(
            TraceKind.PLANNER,
            "planner",
            f"Decision: Run {label} — {decision.reason}",
        )
        state.trace.append(f"Planner: Decision → {label}. {decision.reason}")
    else:
        trace_emit(TraceKind.PLANNER, "planner", f"Decision: Stop — {decision.reason}")
        state.trace.append(f"Planner: Stop. {decision.reason}")

    return decision


def prepare_directives_for_batch(state: CaseState, agents: list[str]) -> None:
    """Set specialist directives before a batch runs."""
    _apply_escalation_directives(state, state.findings, agents)

    if "photo" in agents and state.directives.get("photo") == "dedup_lowthreshold":
        return

    verdicts = _verdicts(state.findings)
    if (
        verdicts.get("photo") == "CLEAN"
        and any(verdicts.get(a) in ("BAIT", "SUSPICIOUS") for a in ("price", "text", "web"))
        and "photo" in agents
    ):
        state.directives["photo"] = "dedup_lowthreshold"
