'use client'

import { motion } from 'framer-motion'
import { Search, ShieldAlert, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { SearchPrefs, DEFAULT_SEARCH_PREFS } from '@/lib/types'

interface SearchFormProps {
  onSearch: (prefs: SearchPrefs) => void;
  isSearching: boolean;
  initialPrefs?: SearchPrefs;
}

export function SearchForm({
  onSearch,
  isSearching,
  initialPrefs = DEFAULT_SEARCH_PREFS,
}: SearchFormProps) {
  const [area, setArea] = useState(initialPrefs.area)
  const [pincode, setPincode] = useState(initialPrefs.pincode ?? '')
  const [maxRent, setMaxRent] = useState(initialPrefs.max_rent)
  const [bhk, setBhk] = useState(initialPrefs.bhk)
  const [office, setOffice] = useState(initialPrefs.office ?? '')
  const [powerBackup, setPowerBackup] = useState(initialPrefs.power_backup ?? false)
  const [vegOnly, setVegOnly] = useState(!(initialPrefs.non_veg ?? false))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      area: area.trim(),
      pincode: pincode.trim() || null,
      max_rent: Number(maxRent) || 35000,
      bhk,
      office: office.trim() || null,
      power_backup: powerBackup,
      non_veg: !vegOnly,
    })
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-strong rounded-3xl p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Labeled label="Area">
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Indiranagar"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
          />
        </Labeled>
        <Labeled label="Pincode">
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="e.g. 560038"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
          />
        </Labeled>
        <Labeled label="Max Budget (₹)">
          <input
            type="number"
            value={maxRent}
            onChange={(e) => setMaxRent(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
          />
        </Labeled>
        <Labeled label="Configuration">
          <select
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0b0d17] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60 appearance-none"
          >
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
          </select>
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Daily Office (for commute check)">
            <input
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="e.g. Embassy GolfLinks"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
            />
          </Labeled>
        </div>
      </div>

      {/* Advanced Lifestyle Filters with Premium Visual Styling */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground hover:text-white transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={powerBackup}
            onChange={(e) => setPowerBackup(e.target.checked)}
            className="rounded border-white/10 bg-white/5 text-[color:var(--brand)] focus:ring-[color:var(--brand)] size-4 transition-all"
          />
          Power Backup
        </label>

        <label className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground hover:text-white transition-all cursor-pointer">
          <input
            type="checkbox"
            checked={vegOnly}
            onChange={(e) => setVegOnly(e.target.checked)}
            className="rounded border-white/10 bg-white/5 text-[color:var(--brand)] focus:ring-[color:var(--brand)] size-4 transition-all"
          />
          Veg Only
        </label>
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={isSearching}
        className="glow-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSearching ? (
          <>
            <Sparkles className="size-4 animate-spin" />
            Searching Corpus...
          </>
        ) : (
          <>
            <Search className="size-4" />
            Find Safe Homes
          </>
        )}
      </motion.button>
    </motion.form>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
