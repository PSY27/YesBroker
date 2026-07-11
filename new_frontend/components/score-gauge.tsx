'use client'

import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

function colorFor(score: number) {
  if (score >= 70) return 'var(--safe)'
  if (score >= 40) return 'var(--caution)'
  return 'var(--risk)'
}

export function ScoreGauge({ score, size = 168 }: { score: number; size?: number }) {
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = colorFor(score)

  const progress = useMotionValue(0)
  const dashoffset = useTransform(progress, (p) => c - (p / 100) * c)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [score, progress])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: dashoffset, filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums" style={{ color }}>
          {display}
        </span>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Trust score</span>
      </div>
    </div>
  )
}
