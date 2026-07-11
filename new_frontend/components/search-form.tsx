'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useToast } from './toast'

export function SearchForm() {
  const { toast } = useToast()

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => {
        e.preventDefault()
        toast('Ranked 10 safe homes near you', 'success')
      }}
      className="glass-strong rounded-3xl p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Labeled label="Area">
          <input
            defaultValue="Indiranagar"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
          />
        </Labeled>
        <Labeled label="Pincode">
          <input
            defaultValue="560038"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
          />
        </Labeled>
        <Labeled label="Max Budget (₹)">
          <input
            type="number"
            defaultValue={35000}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
          />
        </Labeled>
        <Labeled label="Configuration">
          <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60">
            <option className="bg-[#0b0d17]">1 BHK</option>
            <option className="bg-[#0b0d17]" defaultValue="2 BHK">
              2 BHK
            </option>
            <option className="bg-[#0b0d17]">3 BHK</option>
          </select>
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Daily Office">
            <input
              defaultValue="Whitefield, Bangalore"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--brand)]/60"
            />
          </Labeled>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="glow-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] py-3 text-sm font-semibold text-white"
      >
        <Search className="size-4" />
        Find Safe Homes
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
