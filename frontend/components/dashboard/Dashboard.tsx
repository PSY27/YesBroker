'use client';

import { motion } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import { RankedListing, TrustReport as TrustReportType } from '@/lib/types';
import { DEFAULT_SEARCH_PREFS, SearchPrefs } from '@/lib/types';
import { searchStream, investigateStream } from '@/lib/api';
import { ListingsPanel } from './ListingsPanel';
import { TrustReportPanel } from './TrustReportPanel';
import { LogOut } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [listings, setListings] = useState<RankedListing[]>([]);
  const [searchPrefs, setSearchPrefs] = useState<SearchPrefs>(DEFAULT_SEARCH_PREFS);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [report, setReport] = useState<TrustReportType | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [traceLines, setTraceLines] = useState<string[]>([]);
  const closeSearchStreamRef = useRef<(() => void) | null>(null);
  const closeInvestigateStreamRef = useRef<(() => void) | null>(null);

  const handleSearch = useCallback((prefs: SearchPrefs) => {
    closeSearchStreamRef.current?.();
    closeSearchStreamRef.current = null;

    setSearchPrefs(prefs);
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    setSelectedListingId(null);
    setReport(null);
    setTraceLines([]);

    const close = searchStream(prefs, {
      onTrace: (line) => setTraceLines((prev) => [...prev, line]),
      onDone: (results) => {
        setListings(results);
        setIsSearching(false);
        closeSearchStreamRef.current = null;
      },
      onError: (err) => {
        // Only surface an error if we never got results. A late disconnect
        // after `done` should not wipe the listings back to the empty state.
        setListings((prev) => {
          if (prev.length === 0) {
            setSearchError(
              err.message || 'Search failed. Is the backend running on port 8000?'
            );
          }
          return prev;
        });
        setIsSearching(false);
        closeSearchStreamRef.current = null;
      },
    });

    closeSearchStreamRef.current = close;
  }, []);

  useEffect(() => {
    return () => {
      closeSearchStreamRef.current?.();
      closeInvestigateStreamRef.current?.();
    };
  }, []);

  const handleSelectListing = useCallback(
    (listingId: string) => {
      // Cancel any investigation already in flight before starting a new one.
      closeInvestigateStreamRef.current?.();
      closeInvestigateStreamRef.current = null;

      setSelectedListingId(listingId);
      setIsLoadingReport(true);
      setReport(null);
      setSearchError(null);
      setTraceLines([]);

      const office = searchPrefs.office || null;
      const close = investigateStream(listingId, office, {
        onTrace: (line) => setTraceLines((prev) => [...prev, line]),
        onDone: (result) => {
          setReport(result);
          setIsLoadingReport(false);
          closeInvestigateStreamRef.current = null;
        },
        onError: (err) => {
          setSearchError(
            err instanceof Error
              ? err.message
              : 'Could not load report for this listing.'
          );
          setIsLoadingReport(false);
          closeInvestigateStreamRef.current = null;
        },
      });

      closeInvestigateStreamRef.current = close;
    },
    [searchPrefs.office]
  );

  const selectedListing =
    listings.find((l) => l.id === selectedListingId) ?? null;

  const activeTraceLines =
    isSearching || isLoadingReport
      ? traceLines
      : report?.reasoning ?? traceLines;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full bg-[#0b0d17] p-6"
    >
      <div className="aurora-gradient" />

      <div className="relative z-10 max-w-7xl mx-auto h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">GharCheck</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered rental property verification
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/4 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>

        {searchError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {searchError}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="lg:col-span-1 min-h-0"
          >
            <ListingsPanel
              listings={listings}
              selectedListingId={selectedListingId}
              onSelectListing={handleSelectListing}
              onSearch={handleSearch}
              isSearching={isSearching}
              hasSearched={hasSearched}
              searchPrefs={searchPrefs}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="lg:col-span-2 min-h-0"
          >
            <TrustReportPanel
              selectedListing={selectedListing}
              report={report}
              traceLines={activeTraceLines}
              isLoading={isLoadingReport}
              isSearching={isSearching}
              hasSearched={hasSearched}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
