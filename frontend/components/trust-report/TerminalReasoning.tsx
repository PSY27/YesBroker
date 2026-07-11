'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

interface TerminalReasoningProps {
  lines: string[];
  live?: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  system: 'text-slate-400',
  planner: 'text-[#a78bfa]',
  photo: 'text-[#67e8f9]',
  price: 'text-[#fbbf24]',
  text: 'text-[#86efac]',
  web: 'text-[#93c5fd]',
  commute: 'text-[#c4b5fd]',
  reflection: 'text-[#e879f9]',
  result: 'text-[#7dd3fc]',
};

function agentColor(name: string): string {
  const key = name.toLowerCase();
  if (AGENT_COLORS[key]) return AGENT_COLORS[key];
  if (key.includes('photo')) return AGENT_COLORS.photo;
  if (key.includes('planner')) return AGENT_COLORS.planner;
  return 'text-[#a78bfa]';
}

function normalizeLines(lines: string[] | undefined | null): string[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((line) => (line == null ? '' : String(line).trim()))
    .filter((line) => line.length > 0);
}

function parseTraceLine(line: string | undefined | null): { agent: string | null; message: string } {
  const safe = line == null ? '' : String(line);
  const match = safe.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!match) return { agent: null, message: safe };
  return { agent: match[1], message: match[2] };
}

function TraceLine({
  line,
  live,
  isLatest,
  stillStreaming,
}: {
  line: string;
  live: boolean;
  isLatest: boolean;
  stillStreaming: boolean;
}) {
  const { agent, message } = parseTraceLine(line);

  if (live && agent) {
    return (
      <span>
        <span className={`font-semibold ${agentColor(agent)}`}>[{agent}]</span>
        <span className="text-foreground/80"> {message}</span>
        {isLatest && stillStreaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="inline-block w-2 h-3.5 bg-[#7c5cff] ml-1 align-middle"
          />
        )}
      </span>
    );
  }

  return (
    <span className={getLineColor(line, live)}>
      {line}
      {isLatest && stillStreaming && !live && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-current ml-1"
        />
      )}
    </span>
  );
}

function getLineColor(line: string | undefined, live: boolean) {
  if (!line) return 'text-foreground';

  if (live) {
    if (line.startsWith('[')) return 'text-foreground/80';
    return 'text-muted-foreground';
  }

  if (line.includes('escalation') || line.includes('WARNING')) {
    return 'text-[#f59e0b]';
  }
  if (line.includes('conflict') || line.includes('scam') || line.includes('HIGH_RISK') || line.includes('LIE')) {
    return 'text-[#f59e0b]';
  }
  if (line.includes('resolved') || line.includes('consistent')) {
    return 'text-[#22c55e]';
  }
  if (line.startsWith('[')) {
    const { agent } = parseTraceLine(line);
    if (agent) return `${agentColor(agent)} font-semibold`;
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

export function TerminalReasoning({ lines, live = false }: TerminalReasoningProps) {
  const safeLines = useMemo(() => normalizeLines(lines), [lines]);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (live) {
      setDisplayedLines(safeLines);
      return;
    }

    setDisplayedLines([]);
    let currentLine = 0;

    const interval = setInterval(() => {
      if (currentLine < safeLines.length) {
        setDisplayedLines((prev) => [...prev, safeLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [safeLines, live]);

  useEffect(() => {
    if (live && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLines, live]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="glass-terminal font-mono text-xs"
    >
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#7c5cff]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#67e8f9]/40" />
          </div>
          <span className="text-muted-foreground">GHAR_CHECK:~</span>
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#a78bfa] font-bold text-[10px] tracking-widest"
        >
          {live ? '● LIVE' : 'DONE'}
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        className={`space-y-1.5 overflow-y-auto pr-2 custom-scrollbar ${
          live ? 'max-h-[calc(100vh-280px)]' : 'max-h-64'
        }`}
      >
        {displayedLines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="whitespace-pre-wrap break-words leading-relaxed"
          >
            <TraceLine
              line={line}
              live={live}
              isLatest={idx === displayedLines.length - 1}
              stillStreaming={displayedLines.length < safeLines.length}
            />
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-3 pt-3 border-t border-white/8 text-muted-foreground text-[10px]"
      >
        $ Lines: {safeLines.length} | {live ? 'Streaming live...' : 'Analysis complete'}
      </motion.p>
    </motion.div>
  );
}
