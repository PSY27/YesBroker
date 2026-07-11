from __future__ import annotations
from abc import ABC, abstractmethod

from schema import AgentResult, CaseState


class BaseAgent(ABC):
    """Common contract for all specialist agents: async run(state) -> AgentResult."""

    name: str = "base"

    @abstractmethod
    async def run(self, state: CaseState) -> AgentResult:
        ...
