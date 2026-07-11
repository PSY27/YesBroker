'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { RankedListing, TrustReport as TrustReportType } from '@/lib/types';
import { fetchSearchListings, streamInvestigation } from '@/lib/api';
import { ListingsPanel } from './ListingsPanel';
import { TrustReportPanel } from './TrustReportPanel';
import { LogOut } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [listings, setListings] = useState<RankedListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [report, setReport] = useState<TrustReportType | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);

  // Trigger search on mount with default search parameters
  useEffect(() => {
    handleSearch({
      area: 'Indiranagar',
      pincode: '560038',
      max_rent: 75000,
      bhk: '3 BHK',
      power_backup: true,
      non_veg: false // vegetarian allowed
    });
  }, []);

  const handleSearch = async (params: {
    area: string;
    pincode: string;
    max_rent: number;
    bhk: string;
    power_backup: boolean;
    non_veg: boolean;
  }) => {
    setIsLoadingReport(false);
    setReport(null);
    setSelectedListingId(null);
    
    try {
      const data = await fetchSearchListings(params);
      setListings(data);
      if (data.length > 0) {
        setSelectedListingId(data[0].id);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  // Connect to backend EventSource SSE Stream when selection changes
  useEffect(() => {
    if (selectedListingId) {
      setIsLoadingReport(true);
      setReport(null);
      setTraceLogs([]);

      const stream = streamInvestigation(selectedListingId, {
        onStart: (title) => {
          setTraceLogs([`🚀 Launching Multi-Agent Audit for: "${title}"`]);
        },
        onTrace: (agent, message) => {
          setTraceLogs((prev) => [...prev, `[${agent.toUpperCase()}] ${message}`]);
        },
        onDone: (finalReport) => {
          setReport(finalReport);
          setIsLoadingReport(false);
        },
        onError: (err) => {
          console.error('SSE Stream error:', err);
          setIsLoadingReport(false);
        },
      });

      return () => {
        stream.close();
      };
    } else {
      setReport(null);
      setTraceLogs([]);
    }
  }, [selectedListingId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full bg-[#0b0d17] p-6"
    >
      {/* Background gradient */}
      <div className="aurora-gradient" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
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

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Left column: Listings */}
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
            />
          </motion.div>

          {/* Right column: Trust Report */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="lg:col-span-2 min-h-0"
          >
            <TrustReportPanel
              selectedListing={
                selectedListingId
                  ? listings.find((l) => l.id === selectedListingId) || null
                  : null
              }
              report={report}
              isLoading={isLoadingReport}
              traceLogs={traceLogs}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
