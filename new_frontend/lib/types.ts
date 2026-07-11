export type VerdictType = 'SAFE' | 'CAUTION' | 'RISK' | 'HIGH_RISK';
export type AgentVerdictType = 'CLEAN' | 'SUSPICIOUS' | 'BAIT' | 'LIE';
export type AgentName = 'price' | 'text' | 'photo' | 'web' | 'commute';

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
