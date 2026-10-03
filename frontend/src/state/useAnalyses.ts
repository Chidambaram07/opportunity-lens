import { useCallback, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { Problem, SolutionResponse } from '@/lib/types'

export interface AnalysisEntry {
  status: 'loading' | 'ready' | 'error'
  data?: SolutionResponse
  error?: string
}

/** Per-problem AI analyses (POST /solutions/generate). The backend caches results for 7 days. */
export function useAnalyses() {
  const [map, setMap] = useState<Record<string, AnalysisEntry>>({})
  const pending = useRef<Set<string>>(new Set())

  const load = useCallback(async (p: Problem, retry = false) => {
    if (pending.current.has(p.id)) return
    setMap((m) => {
      const cur = m[p.id]
      if (cur && cur.status !== 'error') return m
      if (cur?.status === 'error' && !retry) return m
      return { ...m, [p.id]: { status: 'loading' } }
    })
    pending.current.add(p.id)
    try {
      const data = await api.generate(p)
      if (data.error) throw new Error(data.error)
      setMap((m) => ({ ...m, [p.id]: { status: 'ready', data } }))
    } catch (e) {
      setMap((m) => ({ ...m, [p.id]: { status: 'error', error: (e as Error).message || 'Analysis failed' } }))
    } finally {
      pending.current.delete(p.id)
    }
  }, [])

  return { analyses: map, loadAnalysis: load }
}
