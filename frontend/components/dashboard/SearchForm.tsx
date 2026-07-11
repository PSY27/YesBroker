import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SearchFormData {
  area: string;
  pincode: string;
  max_rent: number;
  bhk: string;
  power_backup: boolean;
  non_veg: boolean; // Note: false means vegetarian allowed only (strictly veg / pure veg check)
}

interface SearchFormProps {
  onSearch?: (data: SearchFormData) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [locationInput, setPincodeOrArea] = useState('560038 / Indiranagar');
  const [budgetInput, setMaxBudget] = useState('60,000');
  const [bhk, setBhk] = useState('3 BHK');
  const [powerBackup, setPowerBackup] = useState(true);
  const [vegOnly, setVegOnly] = useState(true); // true means vegetarian only

  const handleSubmit = () => {
    // Smart regex parser to extract 6-digit Indian pincode
    const pincodeMatch = locationInput.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : '';
    const area = locationInput
      .replace(/\b\d{6}\b/, '')
      .replace(/[/,-]/g, '')
      .trim();

    // Clean rent string to standard numeric values
    const rentVal = Number(budgetInput.replace(/\D/g, '')) || 100000;

    if (onSearch) {
      onSearch({
        area,
        pincode,
        max_rent: rentVal,
        bhk,
        power_backup: powerBackup,
        non_veg: !vegOnly // non_veg = false means "pure veg/vegetarian only" is matched
      });
    }
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
        {/* Pincode / Area */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Pincode / Area
          </label>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setPincodeOrArea(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
            placeholder="e.g. 560038 / Indiranagar"
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
              value={budgetInput}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all"
              placeholder="e.g. 50,000"
            />
          </div>
        </div>

        {/* Configuration */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Configuration
          </label>
          <select
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#111424] border border-white/10 text-foreground focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff] transition-all appearance-none"
          >
            <option>1 BHK</option>
            <option>2 BHK</option>
            <option>3 BHK</option>
            <option>4 BHK</option>
          </select>
        </div>

        {/* Lifestyle Filters */}
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

        {/* Search Button */}
        <Button
          onClick={handleSubmit}
          className="w-full h-12 bg-gradient-to-r from-[#7c5cff] to-[#5b8cff] hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] text-white font-bold rounded-lg transition-all duration-300 mt-6 flex items-center justify-center text-base"
        >
          <Search className="w-5 h-5 mr-2" />
          Find Safe Homes
        </Button>
      </div>
    </motion.div>
  );
}
