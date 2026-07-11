'use client';

import { motion } from 'framer-motion';
import { RankedListing } from '@/lib/types';
import { TrustReport as TrustReportType } from '@/lib/types';
import { AgentFindingCard } from './AgentFindingCard';
import { TerminalReasoning } from './TerminalReasoning';
import { PhotoForensicsPanel } from './PhotoForensicsPanel';
import { CommuteTruthMap } from './CommuteTruthMap';
import { ShareReportButton } from './ShareReportButton';

interface TrustReportProps {
  listing: RankedListing;
  report: TrustReportType;
}

export function TrustReport({ listing, report }: TrustReportProps) {
  const photoFinding = report.flags.find((f) => f.agent === 'photo');
  const commuteFinding = report.flags.find((f) => f.agent === 'commute');

  const sortedFindings = [...report.flags].sort((a, b) => {
    const verdictOrder: Record<string, number> = {
      LIE: 0,
      BAIT: 1,
      SUSPICIOUS: 2,
      CLEAN: 3,
    };
    return (verdictOrder[a.verdict] || 99) - (verdictOrder[b.verdict] || 99);
  });

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'SAFE':
        return { color: 'text-green-400', icon: '🟢', label: 'SAFE', sub: 'Likely a legitimate listing' };
      case 'CAUTION':
        return { color: 'text-yellow-400', icon: '🟡', label: 'CAUTION', sub: 'Proceed with verification' };
      case 'HIGH_RISK':
      case 'RISK':
        return { color: 'text-red-400', icon: '🔴', label: 'HIGH RISK', sub: 'Likely a scam listing' };
      default:
        return { color: 'text-green-400', icon: '🟢', label: 'SAFE', sub: 'Likely a legitimate listing' };
    }
  };

  const v = getVerdictLabel(report.verdict);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar"
    >
      {/* Header */}
      <div className="glassmorphic-card p-5">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-foreground">
            {listing.bhk ? `${listing.bhk} BHK · ` : ''}&quot;{listing.title}&quot;
            {listing.area ? ` · ${listing.area}` : ''} · ₹{listing.rent.toLocaleString()}
          </h2>
          <ShareReportButton listingId={listing.id} area={listing.area} />
        </div>

        {/* Score Area */}
        <div className="flex items-center gap-6 mb-2">
          <div className="w-24 h-24 rounded-2xl bg-[#0b0d17] border border-white/10 flex flex-col items-center justify-center shadow-inner">
            <span className="text-3xl font-bold text-foreground">{report.score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <div>
            <div className={`text-xl font-bold flex items-center gap-2 mb-1 ${v.color}`}>
              {v.icon} {v.label}
            </div>
            <p className="text-sm text-muted-foreground">{v.sub}</p>
          </div>
        </div>
      </div>

      {/* Visual proof panels */}
      {photoFinding && <PhotoForensicsPanel photoFinding={photoFinding} />}
      {commuteFinding && <CommuteTruthMap commuteFinding={commuteFinding} />}

      {/* Red Flags / Agent Findings */}
      <div className="glassmorphic-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="text-red-400">🚩</span> RED FLAGS (with proof)
        </h3>
        <div className="space-y-3">
          {sortedFindings.map((finding, idx) => (
            <AgentFindingCard key={finding.agent} finding={finding} index={idx} />
          ))}
        </div>
      </div>

      {/* Questions to ask */}
      <div className="glassmorphic-card p-5 border-l-4 border-l-[#7c5cff]">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2 uppercase tracking-wide">
          <span className="text-[#7c5cff]">🛡️</span> BEFORE YOU CONTACT THIS BROKER, ASK:
        </h3>
        <ol className="space-y-2 ml-1">
          {report.questions_to_ask.map((question, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="font-semibold text-foreground">{idx + 1}.</span> {question}
            </li>
          ))}
        </ol>
      </div>

      {/* Reasoning Trace */}
      <div className="glassmorphic-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="text-foreground">🧠</span> HOW WE DECIDED (agent reasoning trace)
        </h3>
        <TerminalReasoning lines={report.reasoning} />
      </div>
    </motion.div>
  );
}
