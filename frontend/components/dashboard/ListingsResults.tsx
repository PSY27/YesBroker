'use client';

import { motion } from 'framer-motion';
import { RankedListing, SearchPrefs } from '@/lib/types';
import { ListingRow } from './ListingRow';

interface ListingsResultsProps {
  listings: RankedListing[];
  selectedListingId: string | null;
  onSelectListing: (id: string) => void;
  isSearching?: boolean;
  searchPrefs: SearchPrefs;
}

export function ListingsResults({
  listings,
  selectedListingId,
  onSelectListing,
  isSearching = false,
  searchPrefs,
}: ListingsResultsProps) {
  const header = isSearching
    ? 'Searching listings...'
    : listings.length === 0
      ? `No matches for ${searchPrefs.bhk} BHK · ${searchPrefs.area} · ≤₹${searchPrefs.max_rent.toLocaleString()}`
      : `Showing ${listings.length} matches for ${searchPrefs.bhk} BHK · ${searchPrefs.area} · ≤₹${searchPrefs.max_rent.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="space-y-4"
    >
      <div className="glassmorphic-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">{header}</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sorted by trust — safest first
        </p>

        <div className="flex items-center text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2 px-3 pb-2 border-b border-white/10">
          <div className="w-10 text-center">Rank</div>
          <div className="flex-1 px-2">Listing</div>
          <div className="w-20 text-right">Rent</div>
          <div className="w-28 text-right">Trust</div>
        </div>

        <div className="space-y-1.5 max-h-[calc(100vh-450px)] overflow-y-auto pr-1 custom-scrollbar">
          {isSearching ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Querying trust-ranked corpus...
            </div>
          ) : (
            listings.map((listing, index) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                isSelected={selectedListingId === listing.id}
                onClick={() => onSelectListing(listing.id)}
                index={index}
              />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
