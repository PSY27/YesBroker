import { motion } from 'framer-motion';
import { RankedListing, TrustReport as TrustReportType } from '@/lib/types';
import { TrustReport } from '@/components/trust-report/TrustReport';
import { TerminalReasoning } from '@/components/trust-report/TerminalReasoning';

interface TrustReportPanelProps {
  selectedListing: RankedListing | null;
  report: TrustReportType | null;
  isLoading: boolean;
  traceLogs?: string[];
}

export function TrustReportPanel({
  selectedListing,
  report,
  isLoading,
  traceLogs = [],
}: TrustReportPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col h-full bg-white/2"
    >
      {!selectedListing ? (
        // Empty state
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center h-full text-center px-4"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Select a Listing
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Choose a property from the left panel to launch our AI-powered
            investigation
          </p>
        </motion.div>
      ) : isLoading ? (
        // Live streaming loading state
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4 h-full p-4 overflow-hidden"
        >
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#7c5cff]" />
            </motion.div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI Agents Auditing</h3>
              <p className="text-xs text-muted-foreground">Running 5 specialists in staged parallel concurrency...</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TerminalReasoning lines={traceLogs} />
          </div>
        </motion.div>
      ) : report ? (
        // Report view
        <TrustReport listing={selectedListing} report={report} />
      ) : null}
    </motion.div>
  );
}
