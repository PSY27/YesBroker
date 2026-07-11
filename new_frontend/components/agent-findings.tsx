'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ChevronDown, Globe, IndianRupee, MapPin, Type } from 'lucide-react'
import { useState } from 'react'
import type { AgentResult } from '@/lib/data'

const ICON: Record<AgentResult['agent'], React.ReactNode> = {
  price: <IndianRupee className="size-4" />,
  text: <Type className="size-4" />,
  photo: <Camera className="size-4" />,
  web: <Globe className="size-4" />,
  commute: <MapPin className="size-4" />,
}

const NAME: Record<AgentResult['agent'], string> = {
  price: 'Price Agent',
  text: 'Text Agent',
  photo: 'Photo Agent',
  web: 'Web-Recon Agent',
  commute: 'Commute Agent',
}

function verdictColor(v: AgentResult['verdict']) {
  if (v === 'CLEAN') return 'var(--safe)'
  if (v === 'SUSPICIOUS') return 'var(--caution)'
  return 'var(--risk)'
}

const RANK: Record<AgentResult['verdict'], number> = { LIE: 0, BAIT: 1, SUSPICIOUS: 2, CLEAN: 3 }

export function AgentFindings({ flags }: { flags: AgentResult[] }) {
  const sorted = [...flags].sort((a, b) => RANK[a.verdict] - RANK[b.verdict])
  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((f, i) => (
        <FindingCard key={f.agent} f={f} index={i} />
      ))}
    </div>
  )
}

function FindingCard({ f, index }: { f: AgentResult; index: number }) {
  const [open, setOpen] = useState(f.verdict === 'LIE' || f.verdict === 'BAIT')
  const color = verdictColor(f.verdict)
  const bad = f.verdict !== 'CLEAN'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="glass overflow-hidden rounded-2xl"
      style={{ borderLeft: bad ? `3px solid ${color}` : undefined }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
        >
          {ICON[f.agent]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{NAME[f.agent]}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
              style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}
            >
              {f.verdict}
            </span>
            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
              {Math.round(f.confidence * 100)}% conf
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.detail}</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ul className="flex flex-col gap-1.5 border-t border-white/5 px-4 py-3 pl-16">
              {f.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  {e}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
