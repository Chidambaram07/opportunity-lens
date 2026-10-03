import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Problem } from '@/lib/types'
import { anchorOf, windowWeeks, growthMap } from '@/lib/analytics'
import { useLive } from './useLive'
import type { FreshItem, LiveState } from './useLive'
import { useLibrary } from './useLibrary'
import { useAnalyses } from './useAnalyses'
import type { AnalysisEntry } from './useAnalyses'

interface Ctx {
  live: LiveState
  now: number
  anchor: number
  weeks: number
  growth: Map<string, number | null>
  byId: Map<string, Problem>
  resolve: (id: string) => Problem | undefined
  fresh: FreshItem[]
  unread: number
  markRead: () => void
  refresh: (manual?: boolean) => Promise<void>
  lib: ReturnType<typeof useLibrary>
  analyses: Record<string, AnalysisEntry>
  loadAnalysis: (p: Problem, retry?: boolean) => Promise<void>
  flash: (msg: string) => void
  toast: string
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { state: live, fresh, unread, markRead, refresh } = useLive()
  const lib = useLibrary()
  const { analyses, loadAnalysis } = useAnalyses()
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState('')
  const timer = useRef<number>(0)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), 2400)
  }, [])

  const anchor = useMemo(() => anchorOf(live.problems), [live.problems])
  const weeks = useMemo(() => windowWeeks(live.problems, anchor), [live.problems, anchor])
  const growth = useMemo(() => growthMap(live.problems, anchor, weeks), [live.problems, anchor, weeks])
  const byId = useMemo(() => new Map(live.problems.map((p) => [p.id, p])), [live.problems])
  const resolve = useCallback((id: string) => byId.get(id) ?? lib.snapshots[id], [byId, lib.snapshots])

  const value: Ctx = {
    live, now, anchor, weeks, growth, byId, resolve, fresh, unread, markRead, refresh,
    lib, analyses, loadAnalysis, flash, toast,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside <AppProvider>')
  return c
}
