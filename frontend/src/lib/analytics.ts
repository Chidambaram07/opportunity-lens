import type { Problem } from './types'
import { engagement } from './normalize'
import { ellipsis, fmtDate } from './format'

export const WEEK = 7 * 24 * 3600 * 1000

/** Time series are anchored at the newest observation in the dataset (not the wall clock). */
export function anchorOf(problems: Problem[]): number {
  let max = 0
  for (const p of problems) if (p.createdMs && p.createdMs > max) max = p.createdMs
  return max || Date.now()
}

/** Number of weekly buckets that covers the dataset (min 4, max 12). */
export function windowWeeks(problems: Problem[], anchor: number): number {
  let min = anchor
  for (const p of problems) if (p.createdMs && p.createdMs < min) min = p.createdMs
  return Math.min(12, Math.max(4, Math.ceil((anchor - min) / WEEK) + 1))
}

export function weeklyCounts(times: (number | null)[], anchor: number, weeks: number): number[] {
  const out = new Array<number>(weeks).fill(0)
  for (const t of times) {
    if (t === null || t > anchor) continue
    const idx = weeks - 1 - Math.floor((anchor - t) / WEEK)
    if (idx >= 0 && idx < weeks) out[idx] += 1
  }
  return out
}

export const weekEndLabels = (anchor: number, weeks: number) =>
  Array.from({ length: weeks }, (_, i) => fmtDate(anchor - (weeks - 1 - i) * WEEK))

/** Slope of ln(count) over weeks (same definition as nlp_engine/trend_analysis.py). */
export function logSlope(counts: number[]): number | null {
  const first = counts.findIndex((c) => c > 0)
  if (first < 0) return null
  const ys = counts.slice(first).map((c) => Math.log(Math.max(1, c)))
  if (ys.length < 2) return null
  const n = ys.length
  const mx = (n - 1) / 2
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  ys.forEach((y, i) => { num += (i - mx) * (y - my); den += (i - mx) ** 2 })
  return den === 0 ? null : num / den
}

export const slopeToPct = (s: number) => (Math.exp(s) - 1) * 100

export interface Series { counts: number[]; growthPct: number | null }

export function seriesFor(list: Problem[], anchor: number, weeks: number): Series {
  const counts = weeklyCounts(list.map((p) => p.createdMs), anchor, weeks)
  const s = logSlope(counts)
  return { counts, growthPct: s === null ? null : slopeToPct(s) }
}

export function byCategory(problems: Problem[]): Map<string, Problem[]> {
  const m = new Map<string, Problem[]>()
  for (const p of problems) {
    const arr = m.get(p.category)
    if (arr) arr.push(p); else m.set(p.category, [p])
  }
  return m
}

/** Weekly growth for every problem: NLP topic trend when stored, else its category's computed growth. */
export function growthMap(problems: Problem[], anchor: number, weeks: number): Map<string, number | null> {
  const catGrowth = new Map<string, number | null>()
  for (const [cat, list] of byCategory(problems)) catGrowth.set(cat, seriesFor(list, anchor, weeks).growthPct)
  const out = new Map<string, number | null>()
  for (const p of problems) {
    out.set(p.id, p.trend !== null ? slopeToPct(p.trend) : catGrowth.get(p.category) ?? null)
  }
  return out
}

export interface RisingGroup {
  key: string
  kind: 'topic' | 'category'
  postId: string
  title: string
  category: string
  count: number
  growthPct: number
  series: number[]
}

export function computeRising(problems: Problem[], anchor: number, weeks: number): RisingGroup[] {
  const groups = new Map<string, Problem[]>()
  for (const p of problems) {
    const key = p.topicId !== null ? `t:${p.topicId}` : `c:${p.category}`
    const arr = groups.get(key)
    if (arr) arr.push(p); else groups.set(key, [p])
  }
  const out: RisingGroup[] = []
  for (const [key, list] of groups) {
    if (list.length < 2) continue
    const { counts, growthPct } = seriesFor(list, anchor, weeks)
    const stored = list.find((p) => p.trend !== null)?.trend ?? null
    const g = key.startsWith('t:') && stored !== null ? slopeToPct(stored) : growthPct
    if (g === null || g <= 0) continue
    const top = [...list].sort((a, b) => engagement(b) - engagement(a))[0]
    out.push({
      key, kind: key.startsWith('t:') ? 'topic' : 'category', postId: top.id,
      title: ellipsis(top.title, 110), category: top.category, count: list.length, growthPct: g, series: counts,
    })
  }
  return out.sort((a, b) => b.growthPct - a.growthPct)
}

/** Opportunity tier thresholds are the ones used by the backend prompt builder. */
export const oppTier = (s: number) => (s >= 0.7 ? 'High priority' : s >= 0.4 ? 'Medium priority' : 'Lower priority')
export const intensityTier = (i: number) => (i > 0.6 ? 'High' : i > 0.3 ? 'Moderate' : 'Low')
export const trendTier = (t: number) => (t > 0.5 ? 'Fast growing' : t > 0 ? 'Growing' : t > -0.2 ? 'Stable' : 'Declining')
