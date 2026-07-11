'use client';

import { motion } from 'framer-motion';
import { RankedListing } from '@/lib/types';

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
  const getVerdictDetails = (verdict: string) => {
    switch (verdict) {
      case 'SAFE':
        return { color: 'text-green-400', icon: '🟢', label: 'SAFE' };
      case 'CAUTION':
        return { color: 'text-yellow-400', icon: '🟡', label: 'CAUTION' };
      case 'HIGH_RISK':
      case 'RISK':
        return { color: 'text-red-400', icon: '🔴', label: 'RISK' };
      default:
        return { color: 'text-green-400', icon: '🟢', label: 'SAFE' };
    }
  };

  const v = getVerdictDetails(listing.verdict);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className={`w-full text-left transition-all duration-200 group flex items-center px-3 py-2.5 rounded-lg ${
        isSelected
          ? 'bg-white/10 border border-[#7c5cff]/50 shadow-lg shadow-[#7c5cff]/10'
          : 'bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10'
      }`}
    >
      {/* Rank */}
      <div className="w-10 text-center text-sm font-semibold text-muted-foreground group-hover:text-foreground">
        {listing.rank}
      </div>

      {/* Listing Title & One Liner */}
      <div className="flex-1 min-w-0 px-2">
        <h3 className="text-sm font-medium text-foreground truncate">
          {listing.title}
        </h3>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {listing.one_liner}
        </p>
      </div>

      {/* Rent */}
      <div className="w-20 text-right text-sm font-semibold text-foreground">
        ₹{listing.rent.toLocaleString()}
      </div>

      {/* Trust */}
      <div className={`w-28 text-right flex items-center justify-end gap-1.5 text-xs font-bold ${v.color}`}>
        <span>{v.icon}</span>
        <span className="w-6 text-center">{listing.score}</span>
        <span className="w-16 text-left">{v.label}</span>
      </div>
    </motion.button>
  );
}
