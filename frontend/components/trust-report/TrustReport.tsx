'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { RankedListing } from '@/lib/types';
import { TrustReport as TrustReportType } from '@/lib/types';
import { TrustScoreGauge } from './TrustScoreGauge';
import { AgentPipeline } from './AgentPipeline';
import { AgentFindingCard } from './AgentFindingCard';
import { TerminalReasoning } from './TerminalReasoning';
import { Download } from 'lucide-react';

interface TrustReportProps {
  listing: RankedListing;
  report: TrustReportType;
}

export function TrustReport({ listing, report }: TrustReportProps) {
  // Sort findings: bad first
  const sortedFindings = [...report.flags].sort((a, b) => {
    const verdictOrder: Record<string, number> = {
      LIE: 0,
      BAIT: 1,
      SUSPICIOUS: 2,
      CLEAN: 3,
    };
    return (verdictOrder[a.verdict] || 99) - (verdictOrder[b.verdict] || 99);
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar"
    >
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative h-40 rounded-xl overflow-hidden"
      >
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover brightness-50"
        />
        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-t from-[#0b0d17] via-transparent to-transparent" />

        {/* Overlay content */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-end p-4 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-2 line-clamp-2">
            {listing.title}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white/10 backdrop-blur px-2 py-1 rounded">
              {listing.bhk}
            </span>
            <span className="bg-white/10 backdrop-blur px-2 py-1 rounded">
              {listing.area}
            </span>
            <span className="bg-white/10 backdrop-blur px-2 py-1 rounded">
              {listing.pincode}
            </span>
          </div>
          <div className="mt-2 text-lg font-bold">
            ₹{listing.rent.toLocaleString()}/month
          </div>
        </motion.div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left column: Score + Agents */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="glassmorphic-card flex justify-center">
            <TrustScoreGauge score={report.score} />
          </div>

          <AgentPipeline agents={report.flags} />
        </motion.div>

        {/* Right column: Terminal + Export */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TerminalReasoning lines={report.reasoning} />

          <button className="w-full glassmorphic-card hover:bg-white/8 transition-all flex items-center justify-center gap-2 py-3 text-sm font-medium text-foreground">
            <Download className="w-4 h-4" />
            Export PDF Report
          </button>
        </motion.div>
      </div>

      {/* Findings section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="glassmorphic-card"
      >
        <h3 className="text-base font-bold text-foreground mb-4">
          Agent Findings
        </h3>
        <div className="space-y-3">
          {sortedFindings.map((finding, idx) => (
            <AgentFindingCard
              key={finding.agent}
              finding={finding}
              index={idx}
            />
          ))}
        </div>
      </motion.div>

      {/* Questions section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glassmorphic-card"
      >
        <h3 className="text-base font-bold text-foreground mb-3">
          Questions to Ask
        </h3>
        <div className="space-y-2">
          {report.questions_to_ask.map((question, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
              className="flex gap-3 text-sm"
            >
              <span className="text-[#7c5cff] font-bold flex-shrink-0">
                {idx + 1}.
              </span>
              <p className="text-muted-foreground">{question}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
