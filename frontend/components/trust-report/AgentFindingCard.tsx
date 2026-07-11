'use client';

import { motion } from 'framer-motion';
import { AgentResult } from '@/lib/types';

interface AgentFindingCardProps {
  finding: AgentResult;
  index: number;
}

export function AgentFindingCard({ finding, index }: AgentFindingCardProps) {
  const getIcon = (agent: string) => {
    switch (agent) {
      case 'price': return '💰';
      case 'text': return '💬';
      case 'photo': return '🖼️';
      case 'web': return '🌐';
      case 'commute': return '🚗';
      default: return '🔍';
    }
  };

  // Only show details and evidence
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05 }}
      className="mb-4"
    >
      <div className="flex gap-3">
        <span className="text-lg leading-none">{getIcon(finding.agent)}</span>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {finding.detail}
          </h4>
          {finding.evidence && finding.evidence.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {finding.evidence.map((ev, i) => (
                <li key={i}>{ev}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
