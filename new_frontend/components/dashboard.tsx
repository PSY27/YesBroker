'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { RankedListing } from '@/lib/data'
import { Logo } from './logo'
import { ResultsList } from './results-list'
import { SearchForm } from './search-form'
import { TrustReport } from './trust-report'

export function Dashboard() {
  const [selected, setSelected] = useState<RankedListing | null>(null)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="glow-brand rounded-xl">
            <Logo size={44} className="rounded-xl" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight tracking-tight">
              <span className="text-gradient">Yes</span>Broker
            </p>
            <p className="text-xs text-muted-foreground">Genuine flats float up. Scams sink to the bottom.</p>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <SearchForm />
          <div>
            <p className="mb-2.5 px-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Trust-ranked results
            </p>
            <ResultsList selectedId={selected?.id ?? null} onSelect={setSelected} />
          </div>
        </div>

        {/* Right */}
        <div>
          <TrustReport listing={selected} />
        </div>
      </div>
    </div>
  )
}
