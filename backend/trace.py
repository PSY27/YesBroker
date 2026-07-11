"""Structured tracing for planner ↔ agent ↔ Gemini conversation logs."""

from __future__ import annotations

import contextvars
import json
import sys
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Iterator

from pydantic import BaseModel, Field


class TraceKind(str, Enum):
    SYSTEM = "system"
    PLANNER = "planner"
    ARBITER = "arbiter"
    AGENT = "agent"
    HANDOFF = "handoff"
    GEMINI = "gemini"
    DIRECTIVE = "directive"
    RESULT = "result"


class TraceEvent(BaseModel):
    ts: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    kind: TraceKind
    actor: str
    message: str
    meta: dict[str, Any] = Field(default_factory=dict)

    def terminal_line(self) -> str:
        prefix = {
            TraceKind.SYSTEM: "SYS",
            TraceKind.PLANNER: "Planner",
            TraceKind.ARBITER: "Arbiter",
            TraceKind.AGENT: self.actor.upper(),
            TraceKind.HANDOFF: "HANDOFF",
            TraceKind.GEMINI: "Gemini",
            TraceKind.DIRECTIVE: "DIRECTIVE",
            TraceKind.RESULT: "RESULT",
        }.get(self.kind, self.actor)
        return f"[{prefix}] {self.message}"


_tracer_ctx: contextvars.ContextVar["TraceLogger | None"] = contextvars.ContextVar(
    "yesbroker_tracer", default=None
)

_COLORS = {
    TraceKind.PLANNER: "\033[96m",
    TraceKind.ARBITER: "\033[95m",
    TraceKind.AGENT: "\033[92m",
    TraceKind.HANDOFF: "\033[93m",
    TraceKind.GEMINI: "\033[94m",
    TraceKind.DIRECTIVE: "\033[90m",
    TraceKind.RESULT: "\033[97m",
    TraceKind.SYSTEM: "\033[90m",
}
_RESET = "\033[0m"


class TraceLogger:
    def __init__(self, *, echo: bool = True) -> None:
        self.events: list[TraceEvent] = []
        self.echo = echo

    def emit(
        self,
        kind: TraceKind,
        actor: str,
        message: str,
        **meta: Any,
    ) -> TraceEvent:
        event = TraceEvent(kind=kind, actor=actor, message=message, meta=meta)
        self.events.append(event)
        if self.echo:
            self._print(event)
        return event

    def _print(self, event: TraceEvent) -> None:
        color = _COLORS.get(event.kind, "")
        line = event.terminal_line()
        if event.meta:
            extras = " | ".join(f"{k}={v}" for k, v in event.meta.items() if v is not None)
            if extras:
                line = f"{line}  ({extras})"
        print(f"{color}{line}{_RESET}", file=sys.stderr, flush=True)

    def lines(self) -> list[str]:
        return [e.terminal_line() for e in self.events]

    def sse_payload(self, event: TraceEvent) -> str:
        return f"data: {json.dumps(event.model_dump())}\n\n"


def get_tracer() -> TraceLogger | None:
    return _tracer_ctx.get()


def trace_emit(kind: TraceKind, actor: str, message: str, **meta: Any) -> TraceEvent | None:
    tracer = get_tracer()
    if tracer is None:
        return None
    return tracer.emit(kind, actor, message, **meta)


class TracedInvestigation:
    """Context manager that installs a TraceLogger for the current task."""

    def __init__(self, *, echo: bool = True) -> None:
        self.logger = TraceLogger(echo=echo)
        self._token: contextvars.Token | None = None

    def __enter__(self) -> TraceLogger:
        self._token = _tracer_ctx.set(self.logger)
        return self.logger

    def __exit__(self, *args: object) -> None:
        if self._token is not None:
            _tracer_ctx.reset(self._token)

    async def __aenter__(self) -> TraceLogger:
        return self.__enter__()

    async def __aexit__(self, *args: object) -> None:
        self.__exit__(*args)

    def stream(self) -> Iterator[TraceEvent]:
        yield from self.logger.events
