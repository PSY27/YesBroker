"""
Agentic orchestration: dynamic Planner → selective parallel agents → Reflection.

The planner receives investigation context and agent recommendations, then decides
which specialists run next. Reflection reviews evidence before finalizing.
"""

from __future__ import annotations

import asyncio

from agents.commute import run_commute_agent
from agents.photo import run_photo_agent
from agents.price import run_price_agent
from agents.result_utils import enrich_agent_result
from agents.text import run_text_agent
from agents.web import run_web_agent
from planner_agent import MAX_ROUNDS, plan_next_step, prepare_directives_for_batch
from reflection import reflect
from schema import AgentResult, CaseState, Listing
from trace import TraceKind, get_tracer, trace_emit
from tools.gemini_client import get_model, is_configured

AGENT_RUNNERS = {
    "price": run_price_agent,
    "text": run_text_agent,
    "photo": run_photo_agent,
    "web": run_web_agent,
    "commute": run_commute_agent,
}


async def _run_agent(name: str, state: CaseState) -> AgentResult:
    runner = AGENT_RUNNERS[name]
    directives = {k: v for k, v in state.directives.items() if k == name or name in k}
    trace_emit(
        TraceKind.AGENT,
        name,
        f"Starting {name} agent",
        directives=directives or None,
        listing_id=state.listing.id,
    )
    result = await runner(state)
    result = enrich_agent_result(result, state)

    trace_emit(
        TraceKind.RESULT,
        name,
        f"→ {result.verdict}: {result.detail[:120]}",
        confidence=round(result.confidence, 2),
        recommend_next=result.recommend_next,
    )

    if result.recommend_next:
        rec_label = ", ".join(result.recommend_next)
        trace_emit(TraceKind.AGENT, name, f"Recommendation: verify via {rec_label}")
        state.trace.append(f"{name.title()}: recommends {rec_label}.")

    return result


def _upsert_finding(state: CaseState, result: AgentResult) -> None:
    state.findings = [f for f in state.findings if f.agent != result.agent] + [result]


async def _run_batch(state: CaseState, agents: list[str]) -> list[AgentResult]:
    prepare_directives_for_batch(state, agents)
    if len(agents) == 1:
        result = await _run_agent(agents[0], state)
        return [result]

    trace_emit(
        TraceKind.PLANNER,
        "planner",
        f"Executing in parallel: {', '.join(agents)}",
    )
    state.trace.append(f"Planner: Executing in parallel — {', '.join(agents)}.")
    results = await asyncio.gather(*[_run_agent(name, state) for name in agents])
    return list(results)


async def run_investigation(listing: Listing, office: str | None = None) -> CaseState:
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
    if office:
        state.directives["office"] = office

    completed: set[str] = set()
    rounds = 0

    while rounds < MAX_ROUNDS:
        decision = await plan_next_step(state, completed)
        if decision.stop or not decision.next_agents:
            break

        to_run = [a for a in decision.next_agents if a not in completed and a in AGENT_RUNNERS]
        if not to_run:
            break

        results = await _run_batch(state, to_run)
        for result in results:
            _upsert_finding(state, result)
            completed.add(result.agent)

        rounds += 1

    reflection = await reflect(state, completed)
    if not reflection.sufficient and reflection.additional_agent:
        agent = reflection.additional_agent
        if agent in AGENT_RUNNERS:
            if agent == "photo":
                state.directives["photo"] = "dedup_lowthreshold"
            results = await _run_batch(state, [agent])
            for result in results:
                _upsert_finding(state, result)
                completed.add(result.agent)

    if tracer:
        summary = ", ".join(f"{f.agent}={f.verdict}" for f in state.findings)
        tracer.emit(TraceKind.SYSTEM, "system", f"Investigation complete — {summary}")

    return state
