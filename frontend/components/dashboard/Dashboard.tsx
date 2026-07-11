'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { RankedListing } from '@/lib/types';
import { TrustReport as TrustReportType } from '@/lib/types';
import { mockListings, mockTrustReports } from '@/lib/mock-data';
import { ListingsPanel } from './ListingsPanel';
import { TrustReportPanel } from './TrustReportPanel';
import { LogOut } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null
  );
  const [report, setReport] = useState<TrustReportType | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Simulate loading report when listing is selected
  useEffect(() => {
    if (selectedListingId) {
      setIsLoadingReport(true);
      setReport(null);

      // Simulate API call delay
      const timeout = setTimeout(() => {
        const mockReport = mockTrustReports[selectedListingId];
        if (mockReport) {
          setReport(mockReport);
        }
        setIsLoadingReport(false);
      }, 1200);

      return () => clearTimeout(timeout);
    } else {
      setReport(null);
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
              listings={mockListings}
              selectedListingId={selectedListingId}
              onSelectListing={setSelectedListingId}
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
                  ? mockListings.find((l) => l.id === selectedListingId) || null
                  : null
              }
              report={report}
              isLoading={isLoadingReport}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
