'use client';

import { motion } from 'framer-motion';
import { RankedListing } from '@/lib/types';
import Image from 'next/image';

interface ListingRowProps {
  listing: RankedListing;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function ListingRow({
  listing,
  isSelected,
  onClick,
  index,
}: ListingRowProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'SAFE':
        return 'verdict-safe';
      case 'CAUTION':
        return 'verdict-caution';
      case 'HIGH_RISK':
        return 'verdict-risk';
      default:
        return 'verdict-safe';
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'SAFE':
        return 'Safe';
      case 'CAUTION':
        return 'Caution';
      case 'HIGH_RISK':
        return 'High Risk';
      default:
        return 'Safe';
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      whileHover={{ y: -4 }}
      className={`w-full text-left transition-all duration-300 group ${
        isSelected
          ? 'glassmorphic-card border-[#7c5cff] shadow-lg shadow-[#7c5cff]/20'
          : 'glassmorphic-card hover:border-white/10 hover:shadow-lg'
      }`}
    >
      <div className="flex gap-4 items-start">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {listing.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap flex-shrink-0 ${getVerdictColor(listing.verdict)}`}>
              {listing.score}
            </span>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {listing.one_liner}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{listing.bhk}</span>
              <span>•</span>
              <span>{listing.area}</span>
            </div>
            <span className="text-sm font-semibold text-[#22c55e]">
              ₹{listing.rent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
