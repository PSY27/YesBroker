'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { RankedListing, TrustReport as TrustReportType } from '@/lib/types';
import { DEFAULT_SEARCH_PREFS, SearchPrefs } from '@/lib/types';
import { searchListings, investigateStream } from '@/lib/api';
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
  const [traceLines, setTraceLines] = useState<string[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);

  const handleSearch = useCallback(async (prefs: SearchPrefs) => {
    setSearchPrefs(prefs);
    setIsSearching(true);
    setSearchError(null);
    setSelectedListingId(null);
    setReport(null);
    setTraceLines([]);

    try {
      const results = await searchListings(prefs);
      setListings(results);
      if (results.length > 0) {
        setSelectedListingId(results[0].id);
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : 'Search failed. Is the backend running on port 8000?'
      );
      setListings([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(DEFAULT_SEARCH_PREFS);
  }, [handleSearch]);

  useEffect(() => {
    if (!selectedListingId) {
      setReport(null);
      setTraceLines([]);
      return;
    }

    closeStreamRef.current?.();
    setIsLoadingReport(true);
    setReport(null);
    setTraceLines([]);

    const close = investigateStream(selectedListingId, searchPrefs.office, {
      onStart: (data) => {
        setTraceLines([`🚀 Launching Multi-Agent Audit for: "${data.title}"`]);
      },
      onTrace: (line) => {
        setTraceLines((prev) => [...prev, line]);
      },
      onDone: (trustReport) => {
        setReport(trustReport);
        setIsLoadingReport(false);
      },
      onError: async () => {
        try {
          const { investigateListing } = await import('@/lib/api');
          const fallback = await investigateListing(
            selectedListingId,
            searchPrefs.office
          );
          setReport(fallback);
        } catch {
          setSearchError('Investigation failed. Check backend on port 8000.');
        } finally {
          setIsLoadingReport(false);
        }
      },
    });

    closeStreamRef.current = close;

    return () => {
      close();
    };
  }, [selectedListingId, searchPrefs.office]);

  const selectedListing =
    listings.find((l) => l.id === selectedListingId) ?? null;

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
              onSelectListing={setSelectedListingId}
              onSearch={handleSearch}
              isSearching={isSearching}
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
              traceLines={traceLines}
              isLoading={isLoadingReport}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
