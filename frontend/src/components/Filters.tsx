import { useMemo } from 'react'
import type { Problem } from '@/lib/types'
import { Dropdown } from './ui'
import type { Option } from './ui'

export interface FilterState {
  category: string; source: string; recency: string; engagement: string; sentiment: string; trend: string
}
export const DEFAULT_FILTERS: FilterState = {
  category: 'any', source: 'any', recency: 'any', engagement: 'any', sentiment: 'any', trend: 'any',
}

const DAY = 86_400_000
const RECENCY: Record<string, number> = { '7': 7 * DAY, '30': 30 * DAY, '90': 90 * DAY, '365': 365 * DAY }

export function applyFilters(list: Problem[], f: FilterState, now: number, growth: Map<string, number | null>) {
  return list.filter((p) => {
    if (f.category !== 'any' && p.category !== f.category) return false
    if (f.source !== 'any' && p.subreddit !== f.source) return false
    if (f.recency !== 'any' && (p.createdMs === null || now - p.createdMs > RECENCY[f.recency])) return false
    if (f.engagement !== 'any' && (p.upvotes ?? 0) < Number(f.engagement)) return false
    if (f.sentiment !== 'any' && p.sentiment !== f.sentiment) return false
    if (f.trend !== 'any') {
      const gp = growth.get(p.id)
      const g = p.trend !== null ? p.trend : gp !== null && gp !== undefined ? Math.log(1 + gp / 100) : null
      if (g === null) return false
      if (f.trend === 'growing' && !(g > 0)) return false
      if (f.trend === 'stable' && !(g <= 0 && g > -0.2)) return false
      if (f.trend === 'declining' && !(g <= -0.2)) return false
    }
    return true
  })
}

function counted(values: string[], limit = 30): Option[] {
  const m = new Map<string, number>()
  values.forEach((v) => v && m.set(v, (m.get(v) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit)
    .map(([v, n]) => ({ value: v, label: `${v} (${n})` }))
}

export default function Filters({ problems, value, onChange }: {
  problems: Problem[]; value: FilterState; onChange: (f: FilterState) => void
}) {
  const hasNlp = useMemo(() => problems.some((p) => p.sentiment !== null), [problems])
  const cats = useMemo(() => counted(problems.map((p) => p.category)), [problems])
  const subs = useMemo(() => counted(problems.map((p) => (p.subreddit ? p.subreddit : ''))).map((o) => ({ ...o, label: `r/${o.label}` })), [problems])
  const set = (k: keyof FilterState) => (v: string) => onChange({ ...value, [k]: v })
  const any = (label: string): Option => ({ value: 'any', label })
  const dirty = (Object.keys(value) as (keyof FilterState)[]).some((k) => value[k] !== 'any')
  const maxUp = Math.max(0, ...problems.map((p) => p.upvotes ?? 0))

  return (
    <div className="filters">
      <Dropdown label="Category" value={value.category} onChange={set('category')} options={[any('All categories'), ...cats]} />
      <Dropdown label="Source" value={value.source} onChange={set('source')} options={[any('All subreddits'), ...subs]} />
      <Dropdown label="Recency" value={value.recency} onChange={set('recency')} options={[
        any('Any time'), { value: '7', label: 'Past 7 days' }, { value: '30', label: 'Past 30 days' },
        { value: '90', label: 'Past 90 days' }, { value: '365', label: 'Past year' }]} />
      <Dropdown label="Engagement" value={value.engagement} onChange={set('engagement')} options={[
        any('Any upvotes'),
        ...[10, 50, 100, 500, 1000].filter((n) => n <= maxUp).map((n) => ({ value: String(n), label: `${n}+ upvotes` }))]} />
      {hasNlp && <>
        <Dropdown label="Sentiment" value={value.sentiment} onChange={set('sentiment')} options={[
          any('Any sentiment'), { value: 'negative', label: 'Negative' }, { value: 'neutral', label: 'Neutral' },
          { value: 'positive', label: 'Positive' }]} />
        <Dropdown label="Growth" value={value.trend} onChange={set('trend')} options={[
          any('Any growth'), { value: 'growing', label: 'Growing' }, { value: 'stable', label: 'Stable' },
          { value: 'declining', label: 'Declining' }]} />
      </>}
      {dirty && <button className="dd-clear" onClick={() => onChange(DEFAULT_FILTERS)}>Clear filters</button>}
    </div>
  )
}
