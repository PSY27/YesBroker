'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchSharedReport } from '@/lib/api';
import { SharedReportSnapshot } from '@/lib/types';
import { PhotoForensicsPanel } from '@/components/trust-report/PhotoForensicsPanel';
import { CommuteTruthMap } from '@/components/trust-report/CommuteTruthMap';
import { AgentFindingCard } from '@/components/trust-report/AgentFindingCard';
import { Printer } from 'lucide-react';

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;
  const [snapshot, setSnapshot] = useState<SharedReportSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedReport(token)
      .then(setSnapshot)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d17] flex items-center justify-center text-muted-foreground">
        Loading trust report...
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-[#0b0d17] flex items-center justify-center text-red-400">
        {error ?? 'Report not found'}
      </div>
    );
  }

  const { report, listing: listingSnap } = snapshot;
  const photoFinding = report.flags.find((f) => f.agent === 'photo');
  const commuteFinding = report.flags.find((f) => f.agent === 'commute');

  const verdictColor =
    report.verdict === 'SAFE'
      ? 'text-green-400'
      : report.verdict === 'CAUTION'
        ? 'text-yellow-400'
        : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#0b0d17] text-foreground print-report">
      <div className="aurora-gradient" />
      <div className="relative z-10 max-w-3xl mx-auto p-6 space-y-6">
        <header className="flex items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">GharCheck</h1>
            <p className="text-sm text-muted-foreground">AI-verified rental trust report</p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:border-white/20"
          >
            <Printer className="w-4 h-4" />
            Print report
          </button>
        </header>

        <div className="glassmorphic-card p-6">
          <h2 className="text-xl font-bold mb-2">
            {listingSnap.bhk} BHK · {listingSnap.title}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {listingSnap.address} · ₹{listingSnap.rent.toLocaleString()}/mo
          </p>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#0b0d17] border border-white/10 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{report.score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
            <div>
              <p className={`text-lg font-bold ${verdictColor}`}>{report.verdict}</p>
              <p className="text-xs text-muted-foreground">
                Generated {new Date(snapshot.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {photoFinding && <PhotoForensicsPanel photoFinding={photoFinding} />}
        {commuteFinding && <CommuteTruthMap commuteFinding={commuteFinding} />}

        <div className="glassmorphic-card p-5">
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wide">Red flags</h3>
          <div className="space-y-3">
            {report.flags
              .filter((f) => f.verdict !== 'CLEAN')
              .slice(0, 5)
              .map((finding, idx) => (
                <AgentFindingCard key={finding.agent} finding={finding} index={idx} />
              ))}
          </div>
        </div>

        <div className="glassmorphic-card p-5 border-l-4 border-l-[#7c5cff]">
          <h3 className="text-sm font-bold mb-3">Questions to ask before paying</h3>
          <ol className="space-y-2">
            {report.questions_to_ask.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {i + 1}. {q}
              </li>
            ))}
          </ol>
        </div>

        <footer className="text-center text-xs text-muted-foreground py-6 border-t border-white/5">
          Verified by GharCheck multi-agent AI · Do not pay token before visiting in person
        </footer>
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .glassmorphic-card { border: 1px solid #ccc !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}
