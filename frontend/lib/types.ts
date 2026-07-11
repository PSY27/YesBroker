export type VerdictType = 'SAFE' | 'CAUTION' | 'HIGH_RISK';
export type AgentVerdictType = 'CLEAN' | 'SUSPICIOUS' | 'BAIT' | 'LIE';
export type AgentName = 'price' | 'text' | 'photo' | 'web' | 'commute';

export interface AgentResult {
  agent: AgentName;
  verdict: AgentVerdictType;
  detail: string;
  evidence: string[];
  confidence: number;
  weight: number;
}

export interface TrustReport {
  listing_id: string;
  score: number;
  verdict: VerdictType;
  flags: AgentResult[];
  reasoning: string[];
  questions_to_ask: string[];
}

export interface RankedListing {
  rank: number;
  id: string;
  title: string;
  rent: number;
  score: number;
  verdict: VerdictType;
  one_liner: string;
  imageUrl: string;
  bhk: string;
  area: string;
  pincode: string;
}
