'use client'

import { motion } from 'framer-motion'
import { FileDown, HelpCircle, Loader2, ShieldCheck } from 'lucide-react'
import { AgentFindings } from './agent-findings'
import { AgentPipeline } from './agent-pipeline'
import { ScoreGauge } from './score-gauge'
import { TerminalTrace } from './terminal-trace'
import { useToast } from './toast'
import { RankedListing, TrustReport as TrustReportType } from '@/lib/types'

const VERDICT_META = {
  SAFE: { label: 'SAFE', color: 'var(--safe)' },
  CAUTION: { label: 'CAUTION', color: 'var(--caution)' },
  RISK: { label: 'HIGH RISK', color: 'var(--risk)' },
  HIGH_RISK: { label: 'HIGH RISK', color: 'var(--risk)' },
} as const

interface TrustReportProps {
  listing: RankedListing | null
  report: TrustReportType | null
  traceLines: string[]
  isLoading: boolean
  isSearching?: boolean
}

export function TrustReport({
  listing,
  report,
  traceLines,
  isLoading,
  isSearching = false,
}: TrustReportProps) {
  const { toast } = useToast()

  if (isSearching) {
    return (
      <div className="glass rounded-3xl p-6 flex flex-col gap-4 min-h-[70vh]">
        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
          <Loader2 className="size-6 animate-spin text-[color:var(--brand)]" />
          <div>
            <h3 className="text-sm font-semibold text-white">AI Agents Auditing</h3>
            <p className="text-xs text-muted-foreground">Scraping listings and running parallel trust analysis...</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">Search progress trace</p>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TerminalTrace lines={traceLines} />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="glass flex min-h-[70vh] flex-col items-center justify-center rounded-3xl p-10 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/5 animate-pulse">
          <ShieldCheck className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Select a listing to investigate</h3>
        <p className="mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
          Our 5 AI agents will analyze pricing, listing text, photos, web reputation, and commute — then rank the
          trustworthiness of the home.
        </p>
      </div>
    )
  }

  // Handle images inside/outside public dir safely
  const imgUrl = listing.imageUrl && listing.imageUrl.startsWith('images/')
    ? `/${listing.imageUrl}`
    : listing.imageUrl || '/flats/flat-1.png'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4"
    >
      {/* Header card */}
      <div className="glass-strong relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <img src={imgUrl} alt="" className="object-cover w-full h-full opacity-30 blur-md" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d17] via-[#0b0d17]/80 to-transparent" />
        </div>
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-balance text-xl font-semibold">{listing.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-2.5 py-1">{listing.bhk} BHK</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">{listing.area || 'Unknown'}</span>
              {listing.pincode && (
                <span className="rounded-full bg-white/10 px-2.5 py-1">PIN {listing.pincode}</span>
              )}
            </div>
            <p className="mt-3 text-2xl font-semibold">
              ₹{listing.rent.toLocaleString('en-IN')}
              <span className="text-sm font-normal text-muted-foreground"> /month</span>
            </p>
            {report && (
              <div className="mt-4 flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: `color-mix(in oklab, ${VERDICT_META[report.verdict]?.color ?? 'var(--caution)'} 18%, transparent)`,
                    color: VERDICT_META[report.verdict]?.color ?? 'var(--caution)',
                  }}
                >
                  {VERDICT_META[report.verdict]?.label ?? report.verdict}
                </span>
                <button
                  onClick={() => toast('Trust report exported as PDF', 'success')}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10"
                >
                  <FileDown className="size-3.5" />
                  Export PDF
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <ScoreGauge score={report ? report.score : listing.score || 50} />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="glass rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-[color:var(--brand)]" />
            <span className="text-sm font-semibold text-white animate-pulse">Running live 5-agent investigation audit...</span>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Deploying OCR, Vision, Pricing Index, Search, and Maps agents.
          </p>
          <div className="mt-2">
            <p className="mb-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">Reasoning trace</p>
            <TerminalTrace lines={traceLines} />
          </div>
        </div>
      )}

      {report && !isLoading && (
        <>
          {/* Pipeline */}
          <div className="glass rounded-2xl p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Agent pipeline</p>
            <AgentPipeline flags={report.flags} />
          </div>

          {/* Findings */}
          <div>
            <p className="mb-2.5 text-sm font-semibold">Agent findings</p>
            <AgentFindings flags={report.flags} />
          </div>

          {/* Questions */}
          <div className="glass rounded-2xl p-5">
            <p className="mb-3 text-sm font-semibold">Before you contact this broker, ask</p>
            <ul className="flex flex-col gap-2.5">
              {report.questions_to_ask.map((q, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-start gap-2.5 text-sm text-foreground/90"
                >
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-[color:var(--brand-2)]" />
                  {q}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Terminal */}
          <div>
            <p className="mb-2.5 text-sm font-semibold">Reasoning trace</p>
            <TerminalTrace lines={traceLines.length > 0 ? traceLines : report.reasoning} />
          </div>
        </>
      )}
    </motion.div>
  )
}
