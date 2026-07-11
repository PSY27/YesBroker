'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { AgentResult } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

interface AgentFindingCardProps {
  finding: AgentResult;
  index: number;
}

export function AgentFindingCard({ finding, index }: AgentFindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(finding.verdict !== 'CLEAN');

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'CLEAN':
        return 'text-[#22c55e]';
      case 'SUSPICIOUS':
        return 'text-[#f59e0b]';
      case 'BAIT':
      case 'LIE':
        return 'text-[#ef4444]';
      default:
        return 'text-foreground';
    }
  };

  const getBorderColor = (verdict: string) => {
    switch (verdict) {
      case 'CLEAN':
        return 'border-[#22c55e]/20';
      case 'SUSPICIOUS':
        return 'border-[#f59e0b]/20';
      case 'BAIT':
      case 'LIE':
        return 'border-l-[#ef4444] border-l-2';
      default:
        return 'border-white/10';
    }
  };

  const agentLabels: Record<string, string> = {
    price: 'Price Agent',
    text: 'Text Agent',
    photo: 'Photo Agent',
    web: 'Web Recon',
    commute: 'Commute Verify',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05 }}
      className={`glassmorphic-card border ${getBorderColor(finding.verdict)}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-foreground">
                {agentLabels[finding.agent]}
              </h4>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${getVerdictColor(finding.verdict)} ${
                  finding.verdict === 'CLEAN'
                    ? 'bg-[#22c55e]/10'
                    : finding.verdict === 'SUSPICIOUS'
                      ? 'bg-[#f59e0b]/10'
                      : 'bg-[#ef4444]/10'
                }`}
              >
                {finding.verdict}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{finding.detail}</p>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Evidence section */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 12 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="flex gap-4">
          {/* Confidence bar */}
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">
              Confidence: {Math.round(finding.confidence)}%
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="h-full bg-gradient-to-r from-[#7c5cff] to-[#5b8cff] origin-left"
                style={{ width: `${finding.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Evidence bullets */}
        {finding.evidence.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4 pt-4 border-t border-white/5 space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground">Evidence:</p>
            <ul className="space-y-1">
              {finding.evidence.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="text-xs text-muted-foreground flex gap-2"
                >
                  <span className="text-[#7c5cff] flex-shrink-0">•</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
