'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TerminalReasoningProps {
  lines: string[];
}

export function TerminalReasoning({ lines }: TerminalReasoningProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);

  useEffect(() => {
    setDisplayedLines([]);
    let currentLine = 0;

    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setDisplayedLines((prev) => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [lines]);

  const getLineColor = (line: string | undefined) => {
    if (!line) return 'text-foreground';
    
    if (
      line.includes('escalation') ||
      line.includes('WARNING') ||
      line.includes('high')
    ) {
      return 'text-[#f59e0b]';
    }
    if (
      line.includes('conflict') ||
      line.includes('scam') ||
      line.includes('HIGH_RISK') ||
      line.includes('LIE')
    ) {
      return 'text-[#ef4444]';
    }
    if (line.includes('resolved') || line.includes('consistent')) {
      return 'text-[#22c55e]';
    }
    if (line.startsWith('[') && line.endsWith(']')) {
      return 'text-muted-foreground';
    }
    return 'text-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="glassmorphic-card font-mono text-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          </div>
          <span className="text-muted-foreground">GHAR_CHECK:~</span>
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#22c55e] font-bold"
        >
          LIVE
        </motion.div>
      </div>

      {/* Terminal content */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {displayedLines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`${getLineColor(line)} whitespace-pre-wrap break-words`}
          >
            {idx === displayedLines.length - 1 && displayedLines.length < lines.length ? (
              <>
                {line}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-current ml-1"
                />
              </>
            ) : (
              line
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-3 pt-3 border-t border-white/5 text-muted-foreground text-xs"
      >
        $ Lines: {lines.length} | Analysis complete
      </motion.p>
    </motion.div>
  );
}
