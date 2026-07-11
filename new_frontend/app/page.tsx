'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { AuroraBackground } from '@/components/aurora-background'
import { AuthScreen } from '@/components/auth-screen'
import { Dashboard } from '@/components/dashboard'
import { ToastProvider } from '@/components/toast'

export default function Page() {
  const [authed, setAuthed] = useState(false)

  return (
    <ToastProvider>
      <AuroraBackground />
      <main className="relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          {!authed ? (
            <motion.div key="auth" exit={{ opacity: 0 }}>
              <AuthScreen onAuthed={() => setAuthed(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </ToastProvider>
  )
}
