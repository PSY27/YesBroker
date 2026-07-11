"""In-memory store for live-scraped listings and cached trust reports."""

from __future__ import annotations

from schema import Listing, TrustReport

_live_listings: dict[str, Listing] = {}
_report_cache: dict[str, TrustReport] = {}


def clear_session() -> None:
    """Clear listings + reports when a new search starts."""
    _live_listings.clear()
    _report_cache.clear()


def register_live_listings(rows: list[dict]) -> list[Listing]:
    listings: list[Listing] = []
    for row in rows:
        listing = Listing(**row)
        _live_listings[listing.id] = listing
        listings.append(listing)
    return listings


def get_live_listing(listing_id: str) -> Listing | None:
    return _live_listings.get(listing_id)


def all_live_listings() -> list[Listing]:
    return list(_live_listings.values())


def cache_report(report: TrustReport) -> None:
    _report_cache[report.listing_id] = report


def get_cached_report(listing_id: str) -> TrustReport | None:
    return _report_cache.get(listing_id)


def all_cached_reports() -> dict[str, TrustReport]:
    return dict(_report_cache)
