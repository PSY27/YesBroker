import { Listing, RankedListing, TrustReport, AgentResult } from './types';

// The URL of our live FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

export interface SearchParams {
  area: string;
  pincode: string;
  max_rent: number;
  bhk: string;
  power_backup: boolean;
  non_veg: boolean;
}

/**
 * Normalizes the BHK input to the format expected by the backend (e.g., "3BHK" -> "3")
 */
function normalizeBHK(bhk: string): string {
  if (!bhk) return "2";
  return bhk.replace(/\D/g, ''); // strip any non-digits, e.g. "3BHK" -> "3"
}

/**
 * Standard POST /search endpoint call to fetch matching listings from the backend.
 */
export async function fetchSearchListings(params: SearchParams): Promise<RankedListing[]> {
  const payload = {
    area: params.area || '',
    pincode: params.pincode || '',
    max_rent: Number(params.max_rent) || 100000,
    bhk: normalizeBHK(params.bhk),
    power_backup: Boolean(params.power_backup),
    non_veg: Boolean(params.non_veg)
  };

  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status: ${response.status}`);
  }

  return response.json();
}

/**
 * Standard GET /listing endpoint call to fetch detailed info for a single property.
 */
export async function fetchListingDetails(id: string): Promise<Listing> {
  const response = await fetch(`${API_BASE_URL}/listing?id=${id}`);
  if (!response.ok) {
    throw new Error(`Listing fetch failed with status: ${response.status}`);
  }
  return response.json();
}

/**
 * Establishes a live Server-Sent Events (SSE) stream to backend /investigate/stream?id=...
 * and triggers real-time callbacks as the multi-agent orchestration runs.
 */
export function streamInvestigation(
  listingId: string,
  callbacks: {
    onStart?: (listingTitle: string) => void;
    onTrace?: (agent: string, message: string) => void;
    onDone?: (report: TrustReport) => void;
    onError?: (err: any) => void;
  }
) {
  const url = `${API_BASE_URL}/investigate/stream?id=${listingId}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const { type } = payload;

      if (type === 'start') {
        callbacks.onStart?.(payload.title || 'Property Investigation');
      } else if (type === 'trace') {
        callbacks.onTrace?.(payload.agent || 'System', payload.message || '');
      } else if (type === 'done') {
        callbacks.onDone?.(payload.report);
        eventSource.close(); // Success close
      }
    } catch (err) {
      callbacks.onError?.(err);
      eventSource.close();
    }
  };

  eventSource.onerror = (err) => {
    callbacks.onError?.(err);
    eventSource.close();
  };

  return {
    close: () => eventSource.close()
  };
}
