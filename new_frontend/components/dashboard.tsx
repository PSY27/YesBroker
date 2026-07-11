'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Logo } from './logo'
import { ResultsList } from './results-list'
import { SearchForm } from './search-form'
import { TrustReport } from './trust-report'
import { LogOut, Sparkles } from 'lucide-react'
import { searchListings, investigateStream, investigateListing } from '@/lib/api'
import { RankedListing, TrustReport as TrustReportType, SearchPrefs, DEFAULT_SEARCH_PREFS } from '@/lib/types'

export function Dashboard() {
  const [listings, setListings] = useState<RankedListing[]>([])
  const [searchPrefs, setSearchPrefs] = useState<SearchPrefs>(DEFAULT_SEARCH_PREFS)
  const [selected, setSelected] = useState<RankedListing | null>(null)
  const [report, setReport] = useState<TrustReportType | null>(null)
  const [traceLines, setTraceLines] = useState<string[]>([])
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const closeStreamRef = useRef<(() => void) | null>(null)

  const handleSearch = useCallback(async (prefs: SearchPrefs) => {
    setSearchPrefs(prefs)
    setIsSearching(true)
    setSearchError(null)
    setSelected(null)
    setReport(null)
    setTraceLines([])

    try {
      const results = await searchListings(prefs)
      if (Array.isArray(results)) {
        setListings(results)
        if (results.length > 0) {
          setSelected(results[0])
        }
      } else {
        setListings([])
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : 'Search failed. Is the backend running on port 8000?'
      )
      setListings([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Auto search on mount
  useEffect(() => {
    handleSearch(DEFAULT_SEARCH_PREFS)
  }, [handleSearch])

  // Coordinate the streaming EventSource for Multi-Agent Investigations
  useEffect(() => {
    if (!selected) {
      setReport(null)
      setTraceLines([])
      return
    }

    closeStreamRef.current?.()
    setIsLoadingReport(true)
    setReport(null)
    setTraceLines([])

    const close = investigateStream(selected.id, searchPrefs.office, {
      onStart: (data) => {
        setTraceLines([`🚀 Launching Multi-Agent Audit for: "${data.title}"`])
      },
      onTrace: (line) => {
        setTraceLines((prev) => [...prev, line])
      },
      onDone: (trustReport) => {
        setReport(trustReport)
        setIsLoadingReport(false)
      },
      onError: async () => {
        // Fallback to direct HTTP request on streaming failure
        try {
          const fallback = await investigateListing(selected.id, searchPrefs.office)
          setReport(fallback)
        } catch {
          setSearchError('Investigation failed. Check backend on port 8000.')
        } finally {
          setIsLoadingReport(false)
        }
      },
    })

    closeStreamRef.current = close

    return () => {
      close()
    }
  }, [selected?.id, searchPrefs.office])

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

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all text-xs font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </motion.header>

      {searchError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
        >
          {searchError}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <SearchForm
            onSearch={handleSearch}
            isSearching={isSearching}
            initialPrefs={searchPrefs}
          />
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Trust-ranked results
              </p>
              {isSearching && (
                <div className="flex items-center gap-1.5 text-xs text-[color:var(--brand)] font-semibold">
                  <Sparkles className="size-3 animate-spin" />
                  Querying Corpus...
                </div>
              )}
            </div>
            <ResultsList
              listings={listings}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              isSearching={isSearching}
              searchPrefs={searchPrefs}
            />
          </div>
        </div>

        {/* Right column */}
        <div>
          <TrustReport
            listing={selected}
            report={report}
            traceLines={traceLines}
            isLoading={isLoadingReport}
          />
        </div>
      </div>
    </div>
  )
}
