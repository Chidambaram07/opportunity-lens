import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { CategoryOpportunity, Health, Problem, Stats } from '@/lib/types'

export const REFRESH_MS = 30_000
const FETCH_LIMIT = 500 // maximum the backend allows for /pain-points

export interface FreshItem { problem: Problem; detectedAt: number }

export interface LiveState {
  problems: Problem[]
  stats: Stats | null
  opportunities: CategoryOpportunity[]
  health: Health | null
  subreddits: string[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
  lastUpdated: number | null
  refreshing: boolean
}

const initial: LiveState = {
  problems: [], stats: null, opportunities: [], health: null, subreddits: [],
  status: 'loading', error: null, lastUpdated: null, refreshing: false,
}

/**
 * Polls the FastAPI backend (every 30 s while the tab is visible, and whenever the tab
 * regains focus) so the UI always reflects what is currently in MongoDB.
 */
export function useLive() {
  const [state, setState] = useState<LiveState>(initial)
  const [fresh, setFresh] = useState<FreshItem[]>([])
  const [unread, setUnread] = useState(0)
  const known = useRef<Set<string> | null>(null)
  const inflight = useRef<AbortController | null>(null)

  const refresh = useCallback(async (manual = false) => {
    inflight.current?.abort()
    const ac = new AbortController()
    inflight.current = ac
    if (manual) setState((s) => ({ ...s, refreshing: true }))

    const [pp, st, op, hl] = await Promise.allSettled([
      api.painPoints(FETCH_LIMIT, ac.signal),
      api.statistics(ac.signal),
      api.opportunities(ac.signal),
      api.health(ac.signal),
    ])
    if (ac.signal.aborted) return

    const now = Date.now()
    if (pp.status === 'fulfilled') {
      const list = pp.value
      if (known.current === null) {
        known.current = new Set(list.map((p) => p.id))
      } else {
        const added = list.filter((p) => !known.current!.has(p.id))
        if (added.length) {
          added.forEach((p) => known.current!.add(p.id))
          setFresh((f) => [...added.map((problem) => ({ problem, detectedAt: now })), ...f].slice(0, 30))
          setUnread((u) => u + added.length)
        }
      }
    }

    setState((s) => {
      const failed = pp.status === 'rejected'
      const msg = failed ? (pp.reason as Error)?.message ?? 'Request failed' : null
      return {
        ...s,
        problems: pp.status === 'fulfilled' ? pp.value : s.problems,
        stats: st.status === 'fulfilled' ? st.value : s.stats,
        opportunities: op.status === 'fulfilled' ? op.value : s.opportunities,
        health: hl.status === 'fulfilled' ? hl.value : failed ? null : s.health,
        status: failed && s.problems.length === 0 ? 'error' : 'ready',
        error: msg,
        lastUpdated: failed ? s.lastUpdated : now,
        refreshing: false,
      }
    })
  }, [])

  // initial load + static lookups
  useEffect(() => {
    refresh()
    api.subreddits().then((subreddits) => setState((s) => ({ ...s, subreddits }))).catch(() => {})
    return () => inflight.current?.abort()
  }, [refresh])

  // live polling
  useEffect(() => {
    const tick = () => { if (!document.hidden) refresh() }
    const id = window.setInterval(tick, REFRESH_MS)
    const onVisible = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
    }
  }, [refresh])

  const markRead = useCallback(() => setUnread(0), [])
  return { state, fresh, unread, markRead, refresh }
}
