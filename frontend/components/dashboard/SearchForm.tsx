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
      className="glassmorphic-card p-6"
    >
      <h2 className="text-xl font-bold text-foreground mb-6">Find me a safe rental</h2>

      <div className="space-y-4">
        {/* Pincode / Area */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Pincode / Area
          </label>
          <input
            type="text"
            defaultValue="560038 / Indiranagar"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
          />
        </div>

        {/* Max Budget */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Max Budget
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <input
              type="text"
              defaultValue="35,000"
              className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
            />
          </div>
        </div>

        {/* Configuration */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Configuration
          </label>
          <select className="w-full px-4 py-2.5 rounded-lg bg-[#111424] border border-white/10 text-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all appearance-none">
            <option>1 BHK</option>
            <option selected>2 BHK</option>
            <option>3 BHK</option>
            <option>4 BHK</option>
          </select>
        </div>

        {/* Daily Office */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Daily Office <span className="text-xs text-muted-foreground/60 font-normal">(for commute check)</span>
          </label>
          <input
            type="text"
            defaultValue="Embassy GolfLinks"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          className="w-full h-12 bg-gradient-to-r from-[#7c5cff] to-[#5b8cff] hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] text-white font-bold rounded-lg transition-all duration-300 mt-6 flex items-center justify-center text-base"
        >
          <Search className="w-5 h-5 mr-2" />
          Find Safe Homes
        </Button>
      </div>
    </motion.div>
  );
}
