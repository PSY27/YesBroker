'use client'

import { useEffect, useRef, useState } from 'react'

function lineColor(line: string) {
  const l = line.toLowerCase()
  if (l.includes('conflict') || l.includes('scam') || l.includes('high risk') || l.includes('lie') || l.includes('bait') || l.includes('fraud'))
    return 'var(--risk)'
  if (l.includes('escalat') || l.includes('suspicious') || l.includes('caution') || l.includes('below'))
    return 'var(--caution)'
  if (l.includes('resolved') || l.includes('consistent') || l.includes('clean') || l.includes('confirmed') || l.includes('safe') || l.includes('verified'))
    return 'var(--safe)'
  if (l.startsWith('[init]') || l.startsWith('[verdict]')) return 'var(--brand-2)'
  return 'rgba(255,255,255,0.6)'
}

export function TerminalTrace({ lines }: { lines: string[] }) {
  const [shown, setShown] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShown([])
    setCurrent('')
    let li = 0
    let ci = 0
    let raf: ReturnType<typeof setTimeout>

    function tick() {
      if (li >= lines.length) return
      const line = lines[li]
      if (ci <= line.length) {
        setCurrent(line.slice(0, ci))
        ci++
        raf = setTimeout(tick, 12)
      } else {
        setShown((s) => [...s, line])
        setCurrent('')
        li++
        ci = 0
        raf = setTimeout(tick, 220)
      }
    }
    raf = setTimeout(tick, 300)
    return () => clearTimeout(raf)
  }, [lines])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [shown, current])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">gharcheck — reasoning-trace</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[color:var(--safe)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--safe)]">
          <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--safe)]" />
          LIVE
        </span>
      </div>
      <div ref={scrollRef} className="h-64 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed">
        {shown.map((line, i) => (
          <div key={i} style={{ color: lineColor(line) }} className="whitespace-pre-wrap break-words">
            {line}
          </div>
        ))}
        {current && (
          <div style={{ color: lineColor(current) }} className="whitespace-pre-wrap break-words">
            {current}
            <span className="ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-current" />
          </div>
        )}
      </div>
    </div>
  )
}
