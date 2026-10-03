import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { api } from '@/lib/api'
import { href, navigate, replaceRoute } from '@/lib/router'
import { engagement } from '@/lib/normalize'
import type { Problem } from '@/lib/types'
import Icon from '@/components/Icon'
import Filters, { DEFAULT_FILTERS, applyFilters } from '@/components/Filters'
import type { FilterState } from '@/components/Filters'
import ProblemRow from '@/components/ProblemRow'
import { Dropdown, Skeleton, StateCard } from '@/components/ui'
import Banners from '@/components/Banners'

type Sort = 'relevance' | 'upvotes' | 'recent'

interface SearchState { status: 'idle' | 'loading' | 'ready'; items: Problem[]; note: string | null }

export default function SearchResults({ q }: { q: string }) {
  const { live, now, growth, lib, flash, byId } = useApp()
  const [text, setText] = useState(q)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<Sort>('relevance')
  const [res, setRes] = useState<SearchState>({ status: 'idle', items: [], note: null })

  useEffect(() => setText(q), [q])

  // keep the URL in sync while typing (debounced) without piling up history entries
  useEffect(() => {
    if (text.trim() === q) return
    const t = window.setTimeout(() => replaceRoute(href.search(text.trim())), 450)
    return () => window.clearTimeout(t)
  }, [text, q])

  // run the search: server-side full-text for 3+ chars, instant local title match otherwise
  useEffect(() => {
    const term = q.trim()
    if (term.length === 0) { setRes({ status: 'idle', items: [], note: null }); return }
    const lc = term.toLowerCase()
    const local = () => live.problems.filter((p) => `${p.title} ${p.content}`.toLowerCase().includes(lc))
    if (term.length < 3) {
      setRes({ status: 'ready', items: local(), note: 'Type at least 3 characters for full-text search — showing quick matches.' })
      return
    }
    const ac = new AbortController()
    setRes((r) => ({ ...r, status: 'loading', note: null }))
    api.search(term, 100, ac.signal)
      .then((items) => { lib.addRecent(term); setRes({ status: 'ready', items, note: null }) })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return
        setRes({ status: 'ready', items: local(), note: `Full-text search failed (${e.message}). Showing matches from the loaded feed instead.` })
      })
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  // /search overwrites `score` with a relevance value — prefer the full record from the live feed
  const merged = useMemo(() => res.items.map((p) => byId.get(p.id) ?? p), [res.items, byId])
  const filtered = useMemo(() => applyFilters(merged, filters, now, growth), [merged, filters, now, growth])
  const rows = useMemo(() => {
    const a = [...filtered]
    if (sort === 'upvotes') a.sort((x, y) => (y.upvotes ?? 0) - (x.upvotes ?? 0))
    if (sort === 'recent') a.sort((x, y) => (y.createdMs ?? 0) - (x.createdMs ?? 0))
    return a
  }, [filtered, sort])

  const submit = () => { const t = text.trim(); if (t) navigate(href.search(t)) }

  return (
    <main className="narrow-main">
      <div className="search-heading">
        <button className="back-link" onClick={() => navigate(href.discover())}>← Back to discover</button>
        <p className="kicker">SEARCH RESULTS</p>
        <h1>{q ? `“${q}”` : 'Search'}</h1>
        <p>
          {res.status === 'loading' ? <b>Searching…</b>
            : q ? <><b>{merged.length.toLocaleString()} problem{merged.length === 1 ? '' : 's'} found</b>
              {live.stats ? <> across {live.stats.totalPosts.toLocaleString()} observed posts</> : null}</>
            : 'Type a keyword to search every verified pain point.'}
        </p>
      </div>
      <Banners />
      <div className="search-controls">
        <div className="inline-search"><Icon name="search" size={17} />
          <input value={text} placeholder="Search problems…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <Filters problems={merged} value={filters} onChange={setFilters} />
        <Dropdown label="Sort" value={sort === 'relevance' ? 'any' : sort} onChange={(v) => setSort(v === 'any' ? 'relevance' : (v as Sort))}
          options={[{ value: 'any', label: 'Relevance' }, { value: 'upvotes', label: 'Most upvoted' }, { value: 'recent', label: 'Most recent' }]} />
      </div>
      {res.note && <p className="search-note">{res.note}</p>}
      <div className="result-list">
        {res.status === 'loading' && <Skeleton rows={3} />}
        {res.status === 'ready' && rows.length === 0 && q && (
          <StateCard icon="search" title={merged.length ? 'No results match these filters' : 'No problems found'}>
            {merged.length ? 'Clear a filter to see all matches.' : 'Try a broader keyword or a different phrasing.'}
          </StateCard>
        )}
        {res.status !== 'loading' && rows.map((p) => (
          <ProblemRow key={p.id} item={p} now={now} growth={growth.get(p.id) ?? null}
            saved={p.id in lib.saved} comparing={lib.compare.includes(p.id)}
            onSave={() => flash(lib.toggleSave(p) ? 'Saved to your research library' : 'Removed from saved')}
            onOpen={() => navigate(href.problem(p.id))}
            onCompare={() => { const r = lib.toggleCompare(p); flash(r === 'added' ? 'Added to comparison' : r === 'removed' ? 'Removed from comparison' : 'Compare holds up to 4 problems') }} />
        ))}
      </div>
    </main>
  )
}
