import { RankedListing, SearchPrefs, TrustReport } from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

function normalizeBHK(bhk: string): string {
  if (!bhk) return '2';
  return bhk.replace(/\D/g, '');
}

function buildSearchPayload(prefs: SearchPrefs) {
  const rawPincode = prefs.pincode?.trim() ?? '';
  const pincode =
    rawPincode && !['null', 'undefined', ''].includes(rawPincode.toLowerCase())
      ? rawPincode
      : null;

  return {
    area: prefs.area?.trim() || '',
    pincode,
    max_rent: Number(prefs.max_rent) || 35000,
    bhk: normalizeBHK(prefs.bhk),
    office: prefs.office?.trim() || null,
    power_backup: Boolean(prefs.power_backup),
    non_veg: Boolean(prefs.non_veg),
  };
}

export async function searchListings(
  prefs: SearchPrefs
): Promise<RankedListing[]> {
  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSearchPayload(prefs)),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

export const fetchSearchListings = searchListings;

export async function investigateListing(
  id: string,
  office?: string | null
): Promise<TrustReport> {
  const response = await fetch(`${API_BASE}/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, office: office ?? null }),
  });

  if (!response.ok) {
    throw new Error(`Investigation failed: ${response.status}`);
  }

  return response.json();
}

export interface InvestigateStreamHandlers {
  onStart?: (data: { listing_id: string; title: string }) => void;
  onTrace?: (line: string) => void;
  onDone?: (report: TrustReport) => void;
  onError?: (error: Error) => void;
}

export function investigateStream(
  id: string,
  office: string | null | undefined,
  handlers: InvestigateStreamHandlers
): () => void {
  const params = new URLSearchParams({ id });
  if (office) {
    params.set('office', office);
  }

  const source = new EventSource(
    `${API_BASE}/investigate/stream?${params.toString()}`
  );

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'start') {
        handlers.onStart?.({
          listing_id: data.listing_id,
          title: data.title,
        });
      } else if (data.type === 'trace') {
        const actor = data.actor || data.kind || 'trace';
        handlers.onTrace?.(`[${actor}] ${data.message}`);
      } else if (data.type === 'done') {
        handlers.onDone?.(data.report as TrustReport);
        source.close();
      } else if (data.type === 'error') {
        handlers.onError?.(new Error(data.message || 'Stream error'));
        source.close();
      }
    } catch (e) {
      handlers.onError?.(e instanceof Error ? e : new Error('Failed to parse event data'));
      source.close();
    }
  };

  source.onerror = (err) => {
    handlers.onError?.(new Error('EventSource failed'));
    source.close();
  };

  return () => {
    source.close();
  };
}
