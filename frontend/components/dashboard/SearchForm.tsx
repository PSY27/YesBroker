'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchFormProps {
  onSearch?: () => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glassmorphic-card"
    >
      <h2 className="text-lg font-bold text-foreground mb-4">Find Safe Homes</h2>

      <div className="space-y-3">
        {/* Pincode */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Pincode
          </label>
          <input
            type="text"
            placeholder="560034"
            className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
          />
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Area
          </label>
          <input
            type="text"
            placeholder="Koramangala, HSR Layout"
            className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
          />
        </div>

        {/* Budget Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Min Rent
            </label>
            <input
              type="number"
              placeholder="15,000"
              className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Max Rent
            </label>
            <input
              type="number"
              placeholder="40,000"
              className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
            />
          </div>
        </div>

        {/* BHK */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            BHK
          </label>
          <div className="flex gap-2">
            {['1 BHK', '2 BHK', '3 BHK'].map((option) => (
              <button
                key={option}
                className="flex-1 px-2 py-2 rounded-lg bg-white/4 border border-white/10 text-foreground text-xs hover:border-[#7c5cff] hover:bg-[#7c5cff]/10 transition-all"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Office Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded bg-white/4 border border-white/10 accent-[#7c5cff]"
          />
          <span className="text-sm text-muted-foreground">Include Commercial</span>
        </label>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          className="w-full h-10 bg-gradient-to-r from-[#7c5cff] to-[#5b8cff] hover:shadow-lg hover:shadow-[#7c5cff]/30 text-white font-semibold rounded-lg transition-all duration-300 mt-4"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </motion.div>
  );
}
