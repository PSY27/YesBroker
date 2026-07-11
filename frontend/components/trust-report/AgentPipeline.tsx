'use client';

import { motion } from 'framer-motion';
import { AgentResult } from '@/lib/types';

interface AgentPipelineProps {
  agents: AgentResult[];
}

export function AgentPipeline({ agents }: AgentPipelineProps) {
  const agentLabels: Record<string, string> = {
    price: 'Price',
    text: 'Text',
    photo: 'Photo',
    web: 'Web',
    commute: 'Commute',
  };

  const getAgentColor = (verdict: string) => {
    switch (verdict) {
      case 'CLEAN':
        return 'bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]';
      case 'SUSPICIOUS':
        return 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]';
      case 'BAIT':
      case 'LIE':
        return 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]';
      default:
        return 'bg-white/4 border-white/10 text-foreground';
    }
  };

  const getAgentBgPulse = (verdict: string) => {
    if (verdict === 'CLEAN') return 'none';
    return 'shadow-lg shadow-current/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glassmorphic-card"
    >
      <h3 className="text-sm font-bold text-foreground mb-4">Agent Pipeline</h3>

      {/* Agent chips with connecting arrows */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.agent}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {/* Agent chip */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${getAgentColor(agent.verdict)} ${
                agent.verdict !== 'CLEAN'
                  ? 'animate-pulse shadow-lg'
                  : 'shadow-sm'
              }`}
            >
              {agentLabels[agent.agent]}
            </motion.div>

            {/* Arrow (except for last) */}
            {idx < agents.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.35 + idx * 0.1 }}
                className="text-muted-foreground origin-left"
              >
                →
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-4 pt-4 border-t border-white/5"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          Clean
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          Suspicious
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
          Flagged
        </div>
      </motion.div>
    </motion.div>
  );
}
