'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchPrefs, DEFAULT_SEARCH_PREFS } from '@/lib/types';

interface SearchFormProps {
  onSearch: (prefs: SearchPrefs) => void;
  isSearching?: boolean;
  initialPrefs?: SearchPrefs;
}

function parseLocationInput(value: string): { area: string; pincode: string | null } {
  const trimmed = value.trim();
  const pincodeMatch = trimmed.match(/\b\d{6}\b/);
  if (pincodeMatch) {
    const pincode = pincodeMatch[0];
    const area = trimmed
      .replace(/\b\d{6}\b/, '')
      .replace(/[/,-]/g, ' ')
      .trim();
    return { area, pincode };
  }
  return { area: trimmed, pincode: null };
}

function parseBudget(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  return parseInt(digits, 10) || DEFAULT_SEARCH_PREFS.max_rent;
}

export function SearchForm({
  onSearch,
  isSearching = false,
  initialPrefs = DEFAULT_SEARCH_PREFS,
}: SearchFormProps) {
  const [location, setLocation] = useState(
    `${initialPrefs.pincode ?? '560038'} / ${initialPrefs.area}`
  );
  const [maxRent, setMaxRent] = useState(
    initialPrefs.max_rent.toLocaleString('en-IN')
  );
  const [bhk, setBhk] = useState(initialPrefs.bhk);
  const [office, setOffice] = useState(initialPrefs.office ?? 'Embassy GolfLinks');
  const [powerBackup, setPowerBackup] = useState(initialPrefs.power_backup ?? false);
  const [vegOnly, setVegOnly] = useState(!(initialPrefs.non_veg ?? false));

  const handleSubmit = () => {
    const { area, pincode } = parseLocationInput(location);
    onSearch({
      area: area || initialPrefs.area,
      pincode,
      max_rent: parseBudget(maxRent),
      bhk,
      office: office.trim() || null,
      power_backup: powerBackup,
      non_veg: !vegOnly,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glassmorphic-card p-6"
    >
      <h2 className="text-xl font-bold text-foreground mb-6">Find me a safe rental</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Pincode / Area
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
            placeholder="e.g. 560038 / Indiranagar"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Max Budget
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <input
              type="text"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
              placeholder="e.g. 50,000"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Configuration
          </label>
          <select
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#111424] border border-white/10 text-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all appearance-none"
          >
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Daily Office{' '}
            <span className="text-xs text-muted-foreground/60 font-normal">
              (for commute check)
            </span>
          </label>
          <input
            type="text"
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
          />
        </div>

        <div className="pt-2 grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-all">
            <input
              type="checkbox"
              checked={powerBackup}
              onChange={(e) => setPowerBackup(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-[#7c5cff] focus:ring-[#7c5cff]"
            />
            Power Backup
          </label>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-all">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-[#7c5cff] focus:ring-[#7c5cff]"
            />
            Veg Only
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSearching}
          className="w-full h-12 bg-gradient-to-r from-[#7c5cff] to-[#5b8cff] hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] text-white font-bold rounded-lg transition-all duration-300 mt-6 flex items-center justify-center text-base disabled:opacity-60"
        >
          <Search className="w-5 h-5 mr-2" />
          {isSearching ? 'Analyzing...' : 'Find Safe Homes'}
        </Button>
      </div>
    </motion.div>
  );
}
