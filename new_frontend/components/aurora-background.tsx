'use client'

import { motion } from 'framer-motion'

export function AuroraBackground({ withSkyline = false }: { withSkyline?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Full-bleed hero photo so the page never feels empty */}
      <div
        className="absolute inset-0 bg-cover opacity-100"
        style={{ backgroundImage: 'url(/bg-hero.png)', backgroundPosition: 'center 40%' }}
      />
      {/* Light readability wash — kept subtle so the skyline stays clearly visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/25 to-background/75" />

      {/* Base radial glows (teal / blue rental palette) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 10%, rgba(20,184,166,0.22), transparent 60%), radial-gradient(55% 45% at 85% 15%, rgba(56,189,248,0.20), transparent 60%), radial-gradient(50% 45% at 70% 90%, rgba(52,211,153,0.14), transparent 60%)',
        }}
      />

      {/* Keys — mid left */}
      <div
        className="absolute left-0 top-[34%] h-[52vh] w-[46vw] bg-cover bg-center opacity-[0.20] [mask-image:radial-gradient(circle_at_30%_50%,black,transparent_72%)]"
        style={{ backgroundImage: 'url(/bg-keys.png)' }}
      />

      {/* Neighborhood — bottom band */}
      <div
        className="absolute inset-x-0 bottom-0 h-[52vh] bg-cover bg-center opacity-[0.22] [mask-image:linear-gradient(to_top,black,transparent)]"
        style={{ backgroundImage: 'url(/bg-neighborhood.png)' }}
      />

      {withSkyline && (
        <div
          className="absolute inset-x-0 bottom-0 h-[50vh] bg-cover bg-center opacity-[0.28] [mask-image:linear-gradient(to_top,black,transparent)]"
          style={{ backgroundImage: 'url(/bg-skyline.png)' }}
        />
      )}

      {/* Moving aurora blobs */}
      <motion.div
        className="absolute -left-40 top-[-10%] h-[45rem] w-[45rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.32), transparent 70%)' }}
        animate={{ x: [0, 120, -40, 0], y: [0, 80, 140, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-10%] top-[20%] h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.28), transparent 70%)' }}
        animate={{ x: [0, -100, 30, 0], y: [0, 100, -40, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[30%] h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.20), transparent 70%)' }}
        animate={{ x: [0, 80, -60, 0], y: [0, -60, 40, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grain / vignette */}
      <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_50%_0%,transparent_70%,rgba(0,0,0,0.45))]" />
    </div>
  )
}
