"""
Planner + Arbiter orchestration with maximum parallel execution.

Stage 1 — parallel: Price + Text  (~fast filters)
Stage 2 — parallel: Photo + Web + Commute  (3 agents concurrently)
Stage 3 — conditional re-run: Commute if photo handoff needed
Stage 4 — arbiter: re-dispatch Photo on conflicts
"""

from __future__ import annotations

import asyncio

from schema import AgentResult, CaseState, Listing
from agents.price import run_price_agent
from agents.text import run_text_agent
from agents.photo import run_photo_agent
from agents.web import run_web_agent
from agents.commute import run_commute_agent
from trace import TraceKind, get_tracer, trace_emit
from tools.gemini_client import get_model, is_configured


async def _run_agent(name: str, runner, state: CaseState) -> AgentResult:
    directives = {k: v for k, v in state.directives.items() if k == name or name in k}
    trace_emit(
        TraceKind.AGENT,
        name,
        f"Starting {name} agent",
        directives=directives or None,
        listing_id=state.listing.id,
    )
    result = await runner(state)
    trace_emit(
        TraceKind.RESULT,
        name,
        f"→ {result.verdict}: {result.detail[:120]}",
        confidence=round(result.confidence, 2),
        evidence_count=len(result.evidence),
    )
    return result


def _apply_escalation_directives(
    state: CaseState,
    price_result: AgentResult,
    text_result: AgentResult,
) -> None:
    if price_result.verdict == "BAIT" or text_result.verdict == "SUSPICIOUS":
        state.directives["photo"] = "deep_scan"
        state.directives["web"] = "check_phone_and_dupes"
        trace_emit(
            TraceKind.PLANNER,
            "planner",
            f"ESCALATION: price={price_result.verdict}, text={text_result.verdict} "
            "→ deep Photo + Web-Recon",
        )
        trace_emit(TraceKind.HANDOFF, "planner", "HANDOFF #1 → Photo + Web (escalated)")
        state.trace.append(
            f"Planner: Flagged ({price_result.verdict}/{text_result.verdict}) "
            "→ escalating to deep Photo scan + Web-Recon."
        )
    else:
        state.directives["photo"] = "standard_scan"
        state.directives["web"] = "standard_lookup"
        state.trace.append("Planner: No obvious flags in first pass. Standard validation.")


async def run_investigation(listing: Listing) -> CaseState:
    tracer = get_tracer()
    gemini_status = f"live ({get_model()})" if is_configured() else "offline fallback"
    if tracer:
        tracer.emit(
            TraceKind.SYSTEM,
            "system",
            f"Investigation started for {listing.id}: {listing.title}",
            gemini=gemini_status,
            rent=listing.rent,
        )

    state = CaseState(listing=listing)

    # ── Stage 1: parallel cheap filters ─────────────────────────────────
    trace_emit(TraceKind.PLANNER, "planner", "Stage 1 — asyncio.gather(Price, Text)")
    price_result, text_result = await asyncio.gather(
        _run_agent("price", run_price_agent, state),
        _run_agent("text", run_text_agent, state),
    )
    state.findings.extend([price_result, text_result])
    state.trace.append("Planner: Dispatched cheap parallel checks (Price + Text).")

    _apply_escalation_directives(state, price_result, text_result)

    # ── Stage 2: parallel deep agents (photo + web + commute) ───────────
    state.directives.setdefault("commute", "standard_route")
    trace_emit(
        TraceKind.PLANNER,
        "planner",
        "Stage 2 — asyncio.gather(Photo, Web, Commute) in parallel",
    )

    photo_result, web_result, commute_result = await asyncio.gather(
        _run_agent("photo", run_photo_agent, state),
        _run_agent("web", run_web_agent, state),
        _run_agent("commute", run_commute_agent, state),
    )
    state.findings.extend([photo_result, web_result, commute_result])
    state.trace.append("Planner: Dispatched Photo, Web & Commute in parallel.")

    # ── Stage 3: photo → commute handoff re-run if needed ───────────────
    if photo_result.verdict == "SUSPICIOUS" and "verify address" not in state.directives.get("commute", ""):
        evidence_ref = photo_result.evidence[0] if photo_result.evidence else "photo conflict"
        state.directives["commute"] = f"verify address vs {evidence_ref}"
        trace_emit(TraceKind.HANDOFF, "planner", "HANDOFF #2 → Re-run Commute with address verification")
        state.trace.append("Planner: Photo conflict → re-running Commute with address check.")
        commute_result = await _run_agent("commute", run_commute_agent, state)
        state.findings = [f for f in state.findings if f.agent != "commute"] + [commute_result]

    # ── Stage 4: arbiter conflict resolution ────────────────────────────
    verdicts = {f.agent: f.verdict for f in state.findings}
    photo_clean_but_others_flag = (
        verdicts.get("photo") == "CLEAN"
        and (
            verdicts.get("text") == "SUSPICIOUS"
            or verdicts.get("price") == "BAIT"
            or verdicts.get("web") == "SUSPICIOUS"
        )
    )

    if photo_clean_but_others_flag:
        trace_emit(TraceKind.ARBITER, "arbiter", "CONFLICT — re-dispatching Photo (dedup_lowthreshold)")
        state.trace.append("Arbiter: CONFLICT — re-dispatching Photo with within-batch dedup.")
        state.directives["photo"] = "dedup_lowthreshold"
        redispatch_photo = await _run_agent("photo", run_photo_agent, state)
        state.findings = [f for f in state.findings if f.agent != "photo"] + [redispatch_photo]
        state.trace.append(f"Arbiter: Re-scan complete → photo now {redispatch_photo.verdict}.")
    else:
        trace_emit(TraceKind.ARBITER, "arbiter", "Findings consistent — no conflict")
        state.trace.append("Arbiter: Specialist findings are consistent.")

    if tracer:
        summary = ", ".join(f"{f.agent}={f.verdict}" for f in state.findings)
        tracer.emit(TraceKind.SYSTEM, "system", f"Investigation complete — {summary}")

    return state
