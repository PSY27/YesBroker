'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { LISTINGS, type RankedListing } from '@/lib/data'

function verdictColor(v: RankedListing['verdict']) {
  if (v === 'SAFE') return 'var(--safe)'
  if (v === 'CAUTION') return 'var(--caution)'
  return 'var(--risk)'
}

export function ResultsList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (l: RankedListing) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {LISTINGS.map((l, i) => {
        const color = verdictColor(l.verdict)
        const selected = selectedId === l.id
        return (
          <motion.button
            key={l.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 220, damping: 24 }}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(l)}
            className={`glass group flex items-center gap-3 rounded-2xl p-3 text-left transition-all ${
              selected ? 'glow-brand border-[color:var(--brand)]/60' : 'hover:border-white/25'
            }`}
          >
            <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{l.rank}</span>
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
              <Image src={l.imageUrl} alt={l.title} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{l.title}</p>
              <p className="truncate text-xs text-muted-foreground">{l.one_liner}</p>
              <p className="mt-1 text-sm font-semibold">₹{l.rent.toLocaleString('en-IN')}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
            >
              {l.verdict} · {l.score}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
