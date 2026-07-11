'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { RankedListing, SearchPrefs } from '@/lib/types'
import { ShieldAlert, Sparkles, Home } from 'lucide-react'

function verdictColor(v: RankedListing['verdict']) {
  if (v === 'SAFE') return 'var(--safe)'
  if (v === 'CAUTION') return 'var(--caution)'
  return 'var(--risk)'
}

interface ResultsListProps {
  listings: RankedListing[]
  selectedId: string | null
  onSelect: (l: RankedListing) => void
  isSearching: boolean
  searchPrefs: SearchPrefs
}

export function ResultsList({
  listings,
  selectedId,
  onSelect,
  isSearching,
  searchPrefs,
}: ResultsListProps) {
  if (isSearching) {
    return (
      <div className="flex flex-col gap-2.5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="glass flex items-center gap-3 rounded-2xl p-3 animate-pulse">
            <div className="w-5 h-4 bg-white/10 rounded shrink-0" />
            <div className="size-14 bg-white/10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 bg-white/15 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-5/6" />
              <div className="h-4 bg-white/15 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-6 text-center flex flex-col items-center justify-center border-dashed border-white/10 py-10"
      >
        <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
          <ShieldAlert className="size-6 text-red-400" />
        </div>
        <p className="text-sm font-semibold text-white">No safe matches found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
          No trust-ranked properties match {searchPrefs.bhk} BHK in {searchPrefs.pincode || searchPrefs.area} under ₹{searchPrefs.max_rent.toLocaleString('en-IN')}.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 custom-scrollbar">
      {listings.map((l, i) => {
        const color = verdictColor(l.verdict)
        const selected = selectedId === l.id
        // Handle images inside/outside public dir safely
        const imgUrl = l.imageUrl && l.imageUrl.startsWith('images/') 
          ? `/${l.imageUrl}` 
          : l.imageUrl || '/flats/flat-1.png'

        return (
          <motion.button
            key={l.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 220, damping: 24 }}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(l)}
            className={`glass group flex items-center gap-3 rounded-2xl p-3 text-left transition-all ${
              selected ? 'glow-brand border-[color:var(--brand)]/60 bg-white/[0.03]' : 'hover:border-white/25'
            }`}
          >
            <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{l.rank}</span>
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              {l.imageUrl ? (
                <img src={imgUrl} alt={l.title} className="object-cover w-full h-full" />
              ) : (
                <Home className="size-6 text-muted-foreground" />
              )}
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
