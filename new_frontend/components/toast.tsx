'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useState } from 'react'

type Toast = { id: number; message: string; kind: 'success' | 'info' }
type ToastCtx = { toast: (message: string, kind?: 'success' | 'info') => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: 'success' | 'info' = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-xl"
            >
              {t.kind === 'success' ? (
                <CheckCircle2 className="size-4 text-[color:var(--safe)]" />
              ) : (
                <Info className="size-4 text-[color:var(--brand-2)]" />
              )}
              <span className="text-foreground/90">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
