import os
import asyncio
from typing import List, Dict, Callable, Awaitable, Optional

from schema import CaseState, Listing, AgentResult
from agents.price import run_price_agent
from agents.text import run_text_agent
from agents.commute import run_commute_agent
from agents.photo import run_photo_agent
from agents.web import run_web_agent

class Planner:
    @staticmethod
    async def plan_and_dispatch(
        listing: Listing, 
        on_trace: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> CaseState:
        """
        Coordinates the multi-agent execution pipeline:
        1. Cheap parallel checks (Price + Text).
        2. Escalation logic based on first-pass verdicts.
        3. High-Value parallel checks (Photo + Web-Recon).
        4. Commute check matching route conditions.
        """
        state = CaseState(listing=listing)
        
        async def log_step(msg: str):
            state.trace.append(msg)
            if on_trace:
                await on_trace(msg)

        # --- Stage 1: Cheap parallel checks (Price and Text) ---
        await log_step("Planner: Initiating cheap parallel checks...")
        p_task = run_price_agent(state)
        t_task = run_text_agent(state)
        
        p_res, t_res = await asyncio.gather(p_task, t_task)
        state.findings.extend([p_res, t_res])
        await log_step(f"Planner: Completed first-pass. Price Verdict: '{p_res.verdict}', Text Verdict: '{t_res.verdict}'.")
        
        # --- Stage 2: Escalation Logic ---
        if p_res.verdict == "BAIT" or t_res.verdict == "SUSPICIOUS":
            state.directives["photo"] = "deep_scan"
            state.directives["web"] = "check_phone_and_dupes"
            await log_step(
                f"Planner: Escalating due to indicators ({p_res.verdict}/{t_res.verdict}) "
                "→ Triggering deep Photo-Forensics & Web-Recon."
            )
        else:
            state.directives["photo"] = "standard_scan"
            state.directives["web"] = "standard_lookup"
            await log_step("Planner: Initial scan clean. Proceeding with standard validation.")

        # --- Stage 3: High-Value parallel checks (Photo and Web-Recon) ---
        ph_task = run_photo_agent(state)
        web_task = run_web_agent(state)
        
        ph_res, web_res = await asyncio.gather(ph_task, web_task)
        state.findings.extend([ph_res, web_res])
        await log_step(f"Planner: Finished deep scans. Photo Verdict: '{ph_res.verdict}', Web Verdict: '{web_res.verdict}'.")

        # --- Stage 4: Address Verification Handoff to Commute ---
        if ph_res.verdict == "SUSPICIOUS":
            conflict_src = ph_res.evidence[0] if ph_res.evidence else "NoBroker duplicate"
            state.directives["commute"] = f"verify address vs {conflict_src}"
            await log_step("Planner: Photo duplicates detected → requesting Commute Agent address verification.")
        else:
            state.directives["commute"] = "standard_route"
            await log_step("Planner: Standard routing dispatched to Commute Agent.")

        # --- Stage 5: Commute Agent Execution ---
        c_res = await run_commute_agent(state)
        state.findings.append(c_res)
        await log_step(f"Planner: Commute Agent finished. Transit Verdict: '{c_res.verdict}'.")

        return state
