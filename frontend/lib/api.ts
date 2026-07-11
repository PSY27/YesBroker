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

/** Alias used by other team members' integration */
export const fetchSearchListings = searchListings;

export interface SearchStreamHandlers {
  onStart?: (data: { area: string; bhk: string; max_rent: number }) => void;
  onTrace?: (line: string) => void;
  onDone?: (listings: RankedListing[]) => void;
  onError?: (error: Error) => void;
}

export function searchStream(
  prefs: SearchPrefs,
  handlers: SearchStreamHandlers
): () => void {
  const payload = buildSearchPayload(prefs);
  const params = new URLSearchParams({
    area: payload.area || 'Indiranagar',
    max_rent: String(payload.max_rent),
    bhk: payload.bhk,
    power_backup: String(payload.power_backup),
    non_veg: String(payload.non_veg),
  });
  if (payload.pincode) {
    params.set('pincode', payload.pincode);
  }
  if (payload.office) {
    params.set('office', payload.office);
  }

  const source = new EventSource(
    `${API_BASE}/search/stream?${params.toString()}`
  );

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'start') {
        handlers.onStart?.({
          area: data.area,
          bhk: data.bhk,
          max_rent: data.max_rent,
        });
      } else if (data.type === 'trace') {
        const line =
          typeof data.message === 'string' && data.message.startsWith('[')
            ? data.message
            : `[${data.actor || 'system'}] ${data.message}`;
        handlers.onTrace?.(line);
      } else if (data.type === 'done') {
        handlers.onDone?.(data.listings as RankedListing[]);
        source.close();
      } else if (data.type === 'error') {
        handlers.onError?.(new Error(data.message || 'Search failed'));
        source.close();
      }
    } catch (err) {
      handlers.onError?.(
        err instanceof Error ? err : new Error('Failed to parse SSE event')
      );
      source.close();
    }
  };

  source.onerror = () => {
    handlers.onError?.(new Error('Search stream disconnected'));
    source.close();
  };

  return () => source.close();
}

export async function fetchReport(listingId: string): Promise<TrustReport> {
  const response = await fetch(`${API_BASE}/report/${encodeURIComponent(listingId)}`);
  if (!response.ok) {
    throw new Error(`Report not found: ${response.status}`);
  }
  return response.json();
}

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
      }
    } catch (err) {
      handlers.onError?.(
        err instanceof Error ? err : new Error('Failed to parse SSE event')
      );
      source.close();
    }
  };

  source.onerror = () => {
    handlers.onError?.(new Error('Investigation stream disconnected'));
    source.close();
  };

  return () => source.close();
}

/** Alias used by other team members' integration */
export function streamInvestigation(
  listingId: string,
  callbacks: {
    onStart?: (listingTitle: string) => void;
    onTrace?: (agent: string, message: string) => void;
    onDone?: (report: TrustReport) => void;
    onError?: (err: unknown) => void;
  },
  office?: string | null
) {
  return investigateStream(listingId, office, {
    onStart: (data) => callbacks.onStart?.(data.title),
    onTrace: (line) => {
      const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        callbacks.onTrace?.(match[1], match[2]);
      } else {
        callbacks.onTrace?.('System', line);
      }
    },
    onDone: callbacks.onDone,
    onError: (err) => callbacks.onError?.(err),
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
