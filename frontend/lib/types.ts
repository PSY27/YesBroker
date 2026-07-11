export type VerdictType = 'SAFE' | 'CAUTION' | 'RISK' | 'HIGH_RISK';
export type AgentVerdictType = 'CLEAN' | 'SUSPICIOUS' | 'BAIT' | 'LIE';
export type AgentName = 'price' | 'text' | 'photo' | 'web' | 'commute';

export interface PhotoMatch {
  source_url: string;
  match_url: string;
  portal: string;
  label: string;
}

export interface PhotoEvidence {
  is_stolen: boolean;
  matches_count: number;
  stolen_urls: string[];
  watermarks: string[];
  photos_scanned: number;
  is_live_vision: boolean;
  source_photo: string;
  matches: PhotoMatch[];
}

export interface CommuteEvidence {
  distance_km: number;
  drive_minutes: number;
  metro_minutes: number;
  target_office: string;
  claimed_minutes: number;
  discrepancy_minutes: number;
  is_live_maps: boolean;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  origin_label?: string;
}

export interface AgentResult {
  agent: AgentName;
  verdict: AgentVerdictType;
  detail: string;
  evidence: string[];
  confidence: number;
  weight: number;
  structured_evidence?: Record<string, unknown>;
}

export interface TrustReport {
  listing_id: string;
  score: number;
  verdict: VerdictType;
  flags: AgentResult[];
  reasoning: string[];
  questions_to_ask: string[];
}

export interface SharedListingSnapshot {
  id: string;
  title: string;
  rent: number;
  bhk: string;
  area: string;
  address: string;
  imageUrl?: string | null;
}

export interface SharedReportSnapshot {
  token: string;
  created_at: string;
  listing: SharedListingSnapshot;
  report: TrustReport;
}

export interface SearchPrefs {
  area: string;
  pincode?: string | null;
  max_rent: number;
  bhk: string;
  office?: string | null;
  power_backup?: boolean;
  non_veg?: boolean;
}

export interface RankedListing {
  rank: number;
  id: string;
  title: string;
  rent: number;
  score: number;
  verdict: VerdictType;
  one_liner: string;
  imageUrl?: string;
  bhk?: string;
  area?: string;
  pincode?: string;
}

export const DEFAULT_SEARCH_PREFS: SearchPrefs = {
  area: 'Indiranagar',
  pincode: '560038',
  max_rent: 35000,
  bhk: '2',
  office: 'Embassy GolfLinks',
  power_backup: false,
  non_veg: false,
};
