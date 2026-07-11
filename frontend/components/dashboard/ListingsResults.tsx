'use client';

import { motion } from 'framer-motion';
import { RankedListing } from '@/lib/types';
import { ListingRow } from './ListingRow';

interface ListingsResultsProps {
  listings: RankedListing[];
  selectedListingId: string | null;
  onSelectListing: (id: string) => void;
}

export function ListingsResults({
  listings,
  selectedListingId,
  onSelectListing,
}: ListingsResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Results ({listings.length})
        </h3>
        <span className="text-xs px-2 py-1 bg-white/4 border border-white/10 rounded-full text-muted-foreground">
          Live API
        </span>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
        {listings.map((listing, index) => (
          <ListingRow
            key={listing.id}
            listing={listing}
            isSelected={selectedListingId === listing.id}
            onClick={() => onSelectListing(listing.id)}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
