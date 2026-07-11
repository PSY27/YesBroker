'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { Logo } from './logo'

export function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPw, setShowPw] = useState(false)
  const [leaving, setLeaving] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLeaving(true)
    setTimeout(onAuthed, 650)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <AnimatePresence>
        {!leaving && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="glass-strong w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                className="glow-brand mb-4 rounded-2xl"
              >
                <Logo size={76} className="rounded-2xl" />
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-gradient">Yes</span>Broker
              </h1>
              <p className="mt-1 text-sm font-medium text-foreground/85">AI Rental Trust Engine</p>
              <p className="mt-1 text-pretty text-sm text-muted-foreground">
                Genuine flats float up. Scams sink to the bottom.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">5 AI agents</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Evidence-backed</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Built for India</span>
              </div>
            </div>

            {/* Toggle */}
            <div className="relative mt-7 grid grid-cols-2 rounded-full bg-white/5 p-1 text-sm font-medium">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="glow-brand absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)]"
                style={{ left: mode === 'login' ? 4 : 'calc(50%)' }}
              />
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`relative z-10 rounded-full py-2 transition-colors ${mode === 'login' ? 'text-white' : 'text-muted-foreground'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`relative z-10 rounded-full py-2 transition-colors ${mode === 'signup' ? 'text-white' : 'text-muted-foreground'}`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    <Field icon={<User className="size-4" />}>
                      <input
                        required
                        placeholder="Full name"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>

              <Field icon={<Mail className="size-4" />}>
                <input
                  required
                  type="email"
                  placeholder="you@email.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field icon={<Lock className="size-4" />}>
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </Field>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="glow-brand mt-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] py-3 text-sm font-semibold text-white"
              >
                {mode === 'login' ? 'Log in' : 'Create account'}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Demo auth — any credentials work.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 transition-colors focus-within:border-[color:var(--brand)]/60">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  )
}
