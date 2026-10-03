import { useCallback } from 'react'
import type { Problem, SavedIdea } from '@/lib/types'
import { usePersistent } from './usePersistent'

export const MAX_COMPARE = 4

/** Lightweight copy kept in localStorage so saved items still render if they drop out of the live feed. */
const snap = (p: Problem): Problem => ({ ...p, content: p.content.slice(0, 800) })

export function useLibrary() {
  const [saved, setSaved] = usePersistent<Record<string, number>>('ol.saved', {})
  const [compare, setCompare] = usePersistent<string[]>('ol.compare', [])
  const [snapshots, setSnapshots] = usePersistent<Record<string, Problem>>('ol.snapshots', {})
  const [ideas, setIdeas] = usePersistent<Record<string, SavedIdea>>('ol.ideas', {})
  const [recent, setRecent] = usePersistent<string[]>('ol.recent', [])

  const remember = useCallback((p: Problem) => setSnapshots((s) => ({ ...s, [p.id]: snap(p) })), [setSnapshots])

  const toggleSave = useCallback((p: Problem): boolean => {
    const was = p.id in saved
    remember(p)
    setSaved((s) => {
      const n = { ...s }
      if (was) delete n[p.id]; else n[p.id] = Date.now()
      return n
    })
    return !was
  }, [saved, remember, setSaved])

  /** returns 'added' | 'removed' | 'full' */
  const toggleCompare = useCallback((p: Problem): 'added' | 'removed' | 'full' => {
    if (compare.includes(p.id)) { setCompare((c) => c.filter((x) => x !== p.id)); return 'removed' }
    if (compare.length >= MAX_COMPARE) return 'full'
    remember(p)
    setCompare((c) => [...c, p.id])
    return 'added'
  }, [compare, remember, setCompare])

  const removeCompare = useCallback((id: string) => setCompare((c) => c.filter((x) => x !== id)), [setCompare])

  const toggleIdea = useCallback((idea: SavedIdea): boolean => {
    const was = idea.key in ideas
    setIdeas((s) => {
      const n = { ...s }
      if (was) delete n[idea.key]; else n[idea.key] = idea
      return n
    })
    return !was
  }, [ideas, setIdeas])

  const addRecent = useCallback((q: string) => {
    const t = q.trim()
    if (t.length < 2) return
    setRecent((r) => [t, ...r.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6))
  }, [setRecent])

  return { saved, compare, snapshots, ideas, recent, toggleSave, toggleCompare, removeCompare, toggleIdea, addRecent }
}
