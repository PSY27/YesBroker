"""Lightweight reflection before finalizing an investigation."""

from __future__ import annotations

import json

from schema import AgentResult, CaseState, ReflectionDecision
from tools.gemini_client import generate_json, is_configured
from trace import TraceKind, trace_emit

ALL_AGENTS = ("price", "text", "photo", "web", "commute")


def _verdicts(findings: list[AgentResult]) -> dict[str, str]:
    return {f.agent: f.verdict for f in findings}


def _offline_reflect(state: CaseState, completed: set[str]) -> ReflectionDecision:
    findings = state.findings
    verdicts = _verdicts(findings)
    flagged = [f for f in findings if f.verdict in ("BAIT", "LIE", "SUSPICIOUS")]

    photo_clean_conflict = (
        verdicts.get("photo") == "CLEAN"
        and any(verdicts.get(a) in ("BAIT", "SUSPICIOUS") for a in ("price", "text", "web"))
        and state.directives.get("photo") != "dedup_lowthreshold"
    )

    if photo_clean_conflict:
        state.trace.append("Reflection: CONFLICT — photo clean but price/text/web flagged.")
        return ReflectionDecision(
            sufficient=False,
            reason="Photo result conflicts with price/text/web flags; one more photo pass required.",
            additional_agent="photo",
            approved=False,
        )

    if flagged and len(completed) < 3:
        for agent in ("photo", "web", "commute"):
            if agent not in completed:
                return ReflectionDecision(
                    sufficient=False,
                    reason=f"Red flags present but only {len(completed)} agents ran; need {agent} verification.",
                    additional_agent=agent,
                    approved=False,
                )

    if not flagged and len(completed) >= 2:
        return ReflectionDecision(
            sufficient=True,
            reason="Current evidence is sufficient. Finalizing investigation.",
            approved=True,
        )

    missing = [a for a in ALL_AGENTS if a not in completed]
    if missing and flagged:
        return ReflectionDecision(
            sufficient=False,
            reason=f"Scam indicators found; additional {missing[0]} check recommended.",
            additional_agent=missing[0],
            approved=False,
        )

    return ReflectionDecision(
        sufficient=True,
        reason="Collected evidence supports a final verdict.",
        approved=True,
    )


async def _gemini_reflect(state: CaseState, completed: set[str]) -> ReflectionDecision | None:
    if not is_configured():
        return None

    findings_payload = [f.to_agent_output() for f in state.findings]
    prompt = (
        "You are the Reflection step in a rental-trust investigation.\n"
        "Review all evidence and answer:\n"
        "1) Is evidence sufficient for a final trust verdict?\n"
        "2) If not, which ONE additional agent should run? (price|text|photo|web|commute)\n\n"
        f"Completed agents: {sorted(completed)}\n"
        f"Findings:\n{json.dumps(findings_payload, indent=2)}\n\n"
        'Return JSON: {"sufficient": true/false, "reason": "...", '
        '"additional_agent": "photo" | null, "approved": true/false}'
    )

    data = await generate_json(prompt, caller="reflection")
    if not data:
        return None

    additional = data.get("additional_agent")
    if additional and additional not in ALL_AGENTS:
        additional = None
    if additional in completed:
        additional = None

    return ReflectionDecision(
        sufficient=bool(data.get("sufficient", False)),
        reason=str(data.get("reason", "Reflection complete.")),
        additional_agent=additional,
        approved=bool(data.get("approved", data.get("sufficient", False))),
    )


async def reflect(state: CaseState, completed: set[str]) -> ReflectionDecision:
    trace_emit(TraceKind.REFLECTION, "reflection", "Reviewing collected evidence...")

    decision = await _gemini_reflect(state, completed)
    if decision is None:
        decision = _offline_reflect(state, completed)

    if decision.sufficient or decision.approved:
        trace_emit(TraceKind.REFLECTION, "reflection", decision.reason)
    elif decision.additional_agent:
        trace_emit(
            TraceKind.REFLECTION,
            "reflection",
            f"{decision.reason} → run {decision.additional_agent}",
        )
    else:
        trace_emit(TraceKind.REFLECTION, "reflection", decision.reason)

    state.reflection_notes.append(decision.reason)
    state.trace.append(f"Reflection: {decision.reason}")
    return decision
