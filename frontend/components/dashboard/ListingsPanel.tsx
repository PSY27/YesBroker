'use client';

import { motion } from 'framer-motion';
import { RankedListing } from '@/lib/types';
import { SearchForm } from './SearchForm';
import { ListingsResults } from './ListingsResults';

interface ListingsPanelProps {
  listings: RankedListing[];
  selectedListingId: string | null;
  onSelectListing: (id: string) => void;
  onSearch?: (params: any) => void;
}

export function ListingsPanel({
  listings,
  selectedListingId,
  onSelectListing,
  onSearch,
}: ListingsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col gap-4 h-full"
    >
      <SearchForm onSearch={onSearch} />
      <ListingsResults
        listings={listings}
        selectedListingId={selectedListingId}
        onSelectListing={onSelectListing}
      />
    </motion.div>
  );
}
