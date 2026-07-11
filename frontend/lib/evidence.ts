import { AgentResult, CommuteEvidence, PhotoEvidence } from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export function resolveMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/media/')) return `${API_BASE}${path}`;
  const encoded = path.replace(/^\//, '');
  return `${API_BASE}/media/${encoded}`;
}

export function getPhotoEvidence(flag: AgentResult | undefined): PhotoEvidence | null {
  if (!flag || flag.agent !== 'photo' || !flag.structured_evidence) return null;
  return flag.structured_evidence as unknown as PhotoEvidence;
}

export function getCommuteEvidence(flag: AgentResult | undefined): CommuteEvidence | null {
  if (!flag || flag.agent !== 'commute' || !flag.structured_evidence) return null;
  return flag.structured_evidence as unknown as CommuteEvidence;
}
