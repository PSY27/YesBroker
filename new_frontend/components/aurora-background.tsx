'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

/**
 * AuroraBackground — fully animated, image-free, heavily cursor-INTERACTIVE.
 *
 *  1. Shifting teal/sky/violet mesh gradient (with subtle cursor parallax).
 *  2. Rotating conic light-sweep (cursor parallax).
 *  3. TWO cursor-follow glows — a tight teal one and a slower-trailing violet one.
 *  4. Three aurora blobs, each with mouse parallax + idle drift.
 *  5. Bright rising particles (teal / sky / violet).
 *  6. Drifting dot-grid + vignette.
 */

const PARTICLES = [
  { left: '4%', size: 7, delay: 0, dur: 11, rise: 820, hue: '125,211,252' },
  { left: '9%', size: 4, delay: 3, dur: 14, rise: 760, hue: '167,139,250' },
  { left: '15%', size: 9, delay: 1.5, dur: 10, rise: 880, hue: '125,211,252' },
  { left: '21%', size: 5, delay: 5, dur: 13, rise: 700, hue: '167,139,250' },
  { left: '27%', size: 8, delay: 2, dur: 12, rise: 840, hue: '45,212,191' },
  { left: '34%', size: 4, delay: 6, dur: 15, rise: 780, hue: '167,139,250' },
  { left: '40%', size: 10, delay: 0.5, dur: 9, rise: 900, hue: '125,211,252' },
  { left: '46%', size: 5, delay: 4, dur: 13, rise: 720, hue: '167,139,250' },
  { left: '52%', size: 7, delay: 2.5, dur: 11, rise: 860, hue: '45,212,191' },
  { left: '58%', size: 4, delay: 7, dur: 16, rise: 760, hue: '167,139,250' },
  { left: '64%', size: 9, delay: 1, dur: 10, rise: 880, hue: '125,211,252' },
  { left: '70%', size: 5, delay: 5.5, dur: 14, rise: 700, hue: '167,139,250' },
  { left: '76%', size: 8, delay: 3, dur: 12, rise: 840, hue: '45,212,191' },
  { left: '82%', size: 4, delay: 6.5, dur: 15, rise: 780, hue: '167,139,250' },
  { left: '88%', size: 9, delay: 2, dur: 10, rise: 900, hue: '125,211,252' },
  { left: '93%', size: 6, delay: 4.5, dur: 13, rise: 740, hue: '167,139,250' },
  { left: '97%', size: 5, delay: 1, dur: 12, rise: 800, hue: '125,211,252' },
]

export function AuroraBackground() {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  // fast spring -> tight glow + blobs; slow spring -> trailing violet glow
  const sx = useSpring(mx, { stiffness: 55, damping: 18 })
  const sy = useSpring(my, { stiffness: 55, damping: 18 })
  const tx = useSpring(mx, { stiffness: 22, damping: 20 })
  const ty = useSpring(my, { stiffness: 22, damping: 20 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth)
      my.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

  // glow positions
  const glowX = useTransform(sx, (v) => `${v * 100}%`)
  const glowY = useTransform(sy, (v) => `${v * 100}%`)
  const glow2X = useTransform(tx, (v) => `${v * 100}%`)
  const glow2Y = useTransform(ty, (v) => `${v * 100}%`)
  // parallax offsets (different depths)
  const par1X = useTransform(sx, (v) => (v - 0.5) * -70)
  const par1Y = useTransform(sy, (v) => (v - 0.5) * -70)
  const par2X = useTransform(sx, (v) => (v - 0.5) * 80)
  const par2Y = useTransform(sy, (v) => (v - 0.5) * 80)
  const par3X = useTransform(tx, (v) => (v - 0.5) * 55)
  const par3Y = useTransform(ty, (v) => (v - 0.5) * 55)
  const meshX = useTransform(sx, (v) => (v - 0.5) * -26)
  const meshY = useTransform(sy, (v) => (v - 0.5) * -26)
  const conicX = useTransform(tx, (v) => (v - 0.5) * 40)
  const conicY = useTransform(ty, (v) => (v - 0.5) * 40)

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {/* 1. Shifting mesh gradient (+ cursor parallax) */}
      <motion.div
        className="absolute -inset-10"
        style={{
          x: meshX,
          y: meshY,
          backgroundSize: '220% 220%',
          backgroundImage:
            'radial-gradient(40% 40% at 20% 30%, rgba(20,184,166,0.30), transparent 60%), radial-gradient(45% 45% at 80% 20%, rgba(56,189,248,0.26), transparent 60%), radial-gradient(52% 52% at 62% 82%, rgba(139,92,246,0.32), transparent 60%), radial-gradient(42% 42% at 12% 82%, rgba(124,58,237,0.26), transparent 60%)',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 50%', '50% 100%', '0% 0%'] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 2. Rotating conic light-sweep (+ cursor parallax) */}
      <motion.div style={{ x: conicX, y: conicY }} className="absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(56,189,248,0.12) 50deg, transparent 115deg, rgba(139,92,246,0.16) 180deg, transparent 245deg, rgba(20,184,166,0.13) 305deg, transparent 360deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* 3a. Tight teal cursor spotlight */}
      <motion.div
        className="absolute h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          left: glowX,
          top: glowY,
          background: 'radial-gradient(circle, rgba(56,189,248,0.22), rgba(20,184,166,0.10) 45%, transparent 70%)',
        }}
      />
      {/* 3b. Trailing violet cursor spotlight */}
      <motion.div
        className="absolute h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          left: glow2X,
          top: glow2Y,
          background: 'radial-gradient(circle, rgba(139,92,246,0.22), rgba(124,58,237,0.10) 50%, transparent 72%)',
        }}
      />

      {/* 4. Aurora blobs — parallax wrappers + idle drift */}
      <motion.div className="absolute -left-40 top-[-10%]" style={{ x: par1X, y: par1Y }}>
        <motion.div
          className="h-[45rem] w-[45rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.36), transparent 70%)' }}
          animate={{ x: [0, 130, -30, 0], y: [0, 70, 150, 0], scale: [1, 1.18, 0.92, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.div className="absolute right-[-12%] top-[16%]" style={{ x: par2X, y: par2Y }}>
        <motion.div
          className="h-[40rem] w-[40rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.34), transparent 70%)' }}
          animate={{ x: [0, -120, 30, 0], y: [0, 110, -50, 0], scale: [1, 0.88, 1.12, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.div className="absolute bottom-[-16%] left-[26%]" style={{ x: par3X, y: par3Y }}>
        <motion.div
          className="h-[38rem] w-[38rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.32), transparent 70%)' }}
          animate={{ x: [0, 90, -70, 0], y: [0, -70, 50, 0], scale: [1, 1.14, 0.9, 1] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* 5. Bright rising particles */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(${p.hue},1), rgba(${p.hue},0.5) 55%, transparent)`,
            boxShadow: `0 0 ${p.size * 2}px rgba(${p.hue},0.9)`,
          }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: [30, -p.rise], opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.6] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut', times: [0, 0.12, 0.82, 1] }}
        />
      ))}

      {/* 6. Drifting dot-grid */}
      <motion.div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1.5px)',
          backgroundSize: '34px 34px',
        }}
        animate={{ backgroundPositionY: ['0px', '34px'] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_50%_0%,transparent_60%,rgba(0,0,0,0.5))]" />
    </div>
  )
}
