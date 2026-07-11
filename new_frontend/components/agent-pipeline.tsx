'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Camera, Globe, IndianRupee, MapPin, Type } from 'lucide-react'
import type { AgentResult } from '@/lib/data'

const META: Record<AgentResult['agent'], { label: string; icon: React.ReactNode }> = {
  price: { label: 'Price', icon: <IndianRupee className="size-4" /> },
  text: { label: 'Text', icon: <Type className="size-4" /> },
  photo: { label: 'Photo', icon: <Camera className="size-4" /> },
  web: { label: 'Web-Recon', icon: <Globe className="size-4" /> },
  commute: { label: 'Commute', icon: <MapPin className="size-4" /> },
}

const ORDER: AgentResult['agent'][] = ['price', 'text', 'photo', 'web', 'commute']

export function AgentPipeline({ flags }: { flags: AgentResult[] }) {
  const byAgent = Object.fromEntries(flags.map((f) => [f.agent, f])) as Record<AgentResult['agent'], AgentResult>

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ORDER.map((agent, i) => {
        const f = byAgent[agent]
        const bad = f && f.verdict !== 'CLEAN'
        const color = bad ? 'var(--risk)' : 'var(--safe)'
        return (
          <div key={agent} className="flex items-center gap-1.5">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15 * i, type: 'spring', stiffness: 300, damping: 18 }}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium"
              style={{
                borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
                background: `color-mix(in oklab, ${color} 12%, transparent)`,
                color,
              }}
            >
              <motion.span
                animate={bad ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="flex items-center gap-1.5"
              >
                {META[agent].icon}
                {META[agent].label}
              </motion.span>
            </motion.div>
            {i < ORDER.length - 1 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 * i + 0.08 }}
              >
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </motion.span>
            )}
          </div>
        )
      })}
    </div>
  )
}
