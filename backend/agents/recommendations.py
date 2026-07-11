"""Rule-based next-agent recommendations from specialist verdicts."""

from __future__ import annotations

from schema import AgentResult

_ALL_DEEP = ["photo", "web", "commute"]


def recommend_next_for(result: AgentResult) -> list[str]:
    agent = result.agent
    verdict = result.verdict

    if agent == "price":
        if verdict == "BAIT":
            return ["photo", "web"]
        if verdict == "SUSPICIOUS":
            return ["photo", "web"]
        return []

    if agent == "text":
        if verdict == "SUSPICIOUS":
            return ["photo", "web"]
        return []

    if agent == "photo":
        if verdict == "SUSPICIOUS":
            return ["web", "commute"]
        return []

    if agent == "web":
        if verdict == "SUSPICIOUS":
            return ["commute"]
        return []

    if agent == "commute":
        if verdict in ("LIE", "SUSPICIOUS"):
            return ["web"]
        return []

    return []


def collect_agent_recommendations(findings: list[AgentResult]) -> list[str]:
    """Union of per-agent recommendations, preserving order."""
    seen: set[str] = set()
    ordered: list[str] = []
    for finding in findings:
        for agent in finding.recommend_next:
            if agent not in seen:
                seen.add(agent)
                ordered.append(agent)
    return ordered
