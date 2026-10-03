import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { href, navigate } from '@/lib/router'
import { engagement } from '@/lib/normalize'
import { computeRising } from '@/lib/analytics'
import { signed, timeAgo } from '@/lib/format'
import type { Problem } from '@/lib/types'
import Icon from '@/components/Icon'
import Filters, { DEFAULT_FILTERS, applyFilters } from '@/components/Filters'
import type { FilterState } from '@/components/Filters'
import ProblemRow from '@/components/ProblemRow'
import { Button, Skeleton, Sparkline, StateCard } from '@/components/ui'
import Banners from '@/components/Banners'

export const TABS = ['Trending', 'Rising', 'High Demand', 'Recently Discovered', 'All Problems'] as const
export type Tab = (typeof TABS)[number]
export interface DiscoverState { tab: Tab; filters: FilterState; shown: number }
export const INITIAL_DISCOVER: DiscoverState = { tab: 'Trending', filters: DEFAULT_FILTERS, shown: 10 }

const PAGE = 10

export function sortForTab(list: Problem[], tab: Tab, now: number, growth: Map<string, number | null>): Problem[] {
  const arr = [...list]
  switch (tab) {
    case 'Trending': {
      // engagement decayed by age (hot-ranking) so fresh, active threads float up
      const hot = (p: Problem) => engagement(p) / Math.pow((p.createdMs ? Math.max(0, now - p.createdMs) / 86_400_000 : 30) + 2, 1.2)
      return arr.sort((a, b) => hot(b) - hot(a))
    }
    case 'Rising':
      return arr.filter((p) => (growth.get(p.id) ?? 0) > 0)
        .sort((a, b) => (growth.get(b.id) ?? 0) - (growth.get(a.id) ?? 0) || engagement(b) - engagement(a))
    case 'High Demand':
      return arr.sort((a, b) => (b.oppScore ?? -1) - (a.oppScore ?? -1) || engagement(b) - engagement(a))
    case 'Recently Discovered':
      return arr.sort((a, b) => (b.createdMs ?? 0) - (a.createdMs ?? 0))
    default:
      return arr.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
  }
}

function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('')
  return (
    <div className="hero-search">
      <Icon name="search" size={21} />
      <input aria-label="Search" placeholder="Search problems, complaints, markets, or keywords..." value={q}
        onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && q.trim().length >= 2 && onSearch(q.trim())} />
      <kbd>⌘ K</kbd>
    </div>
  )
}

export default function Discover({ ds, setDs, category }: {
  ds: DiscoverState; setDs: (f: (s: DiscoverState) => DiscoverState) => void; category?: string
}) {
  const { live, now, anchor, weeks, growth, lib, flash } = useApp()

  // arriving from Markets / the command palette with ?category=
  useEffect(() => {
    if (category) setDs((s) => ({ ...s, filters: { ...DEFAULT_FILTERS, category }, shown: PAGE }))
  }, [category, setDs])

  const filtered = useMemo(() => applyFilters(live.problems, ds.filters, now, growth), [live.problems, ds.filters, now, growth])
  const rows = useMemo(() => sortForTab(filtered, ds.tab, now, growth), [filtered, ds.tab, now, growth])
  const rising = useMemo(() => computeRising(live.problems, anchor, weeks).slice(0, 5), [live.problems, anchor, weeks])

  const open = (p: Problem) => navigate(href.problem(p.id))
  const onSave = (p: Problem) => flash(lib.toggleSave(p) ? 'Saved to your research library' : 'Removed from saved')
  const onCompare = (p: Problem) => {
    const r = lib.toggleCompare(p)
    flash(r === 'added' ? 'Added to comparison' : r === 'removed' ? 'Removed from comparison' : 'Compare holds up to 4 problems')
  }
  const search = (q: string) => { lib.addRecent(q); navigate(href.search(q)) }

  const total = live.stats?.totalPainPoints
  const loading = live.status === 'loading'

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="kicker">PROBLEM DISCOVERY</p><h1>Discover</h1>
          <p>Find problems worth solving. Backed by real-world evidence.</p>
        </div>
        <div className="live-note"><i className={live.status === 'error' ? 'off' : ''} />
          {live.status === 'error' ? 'Not connected' : 'Live data from Reddit'}</div>
        <SearchBox onSearch={search} />
      </section>
      <Banners />
      <div className="content-grid">
        <section className="feed">
          <div className="tabs">
            {TABS.map((x) => (
              <button className={ds.tab === x ? 'active' : ''} key={x} onClick={() => setDs((s) => ({ ...s, tab: x, shown: PAGE }))}>{x}</button>
            ))}
          </div>
          <Filters problems={live.problems} value={ds.filters} onChange={(f) => setDs((s) => ({ ...s, filters: f, shown: PAGE }))} />
          <div className="results-meta">
            <strong>Problems gaining attention</strong>
            <span>
              {rows.length.toLocaleString()} result{rows.length === 1 ? '' : 's'}
              {total !== undefined && total > live.problems.length ? ` · ${live.problems.length.toLocaleString()} of ${total.toLocaleString()} loaded` : ''}
              {live.lastUpdated ? ` · Updated ${timeAgo(live.lastUpdated, now)}` : ''}
            </span>
          </div>

          {loading && <Skeleton rows={4} />}

          {!loading && live.status === 'ready' && live.problems.length === 0 && (
            <StateCard icon="search" title="No verified problems in the database yet">
              Run <code>python scripts/run_scraper.py</code> and then <code>python retag_all_posts.py</code> in the project root. This page updates by itself.
            </StateCard>
          )}

          {!loading && live.problems.length > 0 && rows.length === 0 && (
            <StateCard icon="search" title={ds.tab === 'Rising' ? 'No rising problems detected yet' : 'No problems match these filters'}
              action={<Button primary onClick={() => setDs((s) => ({ ...s, filters: DEFAULT_FILTERS, tab: s.tab === 'Rising' ? 'Trending' : s.tab }))}>Reset</Button>}>
              {ds.tab === 'Rising'
                ? 'Rising needs at least two weeks of history for a topic or category.'
                : 'Try removing a filter or choosing another tab.'}
            </StateCard>
          )}

          {rows.slice(0, ds.shown).map((p) => (
            <ProblemRow key={p.id} item={p} now={now} growth={growth.get(p.id) ?? null}
              saved={p.id in lib.saved} comparing={lib.compare.includes(p.id)}
              onSave={() => onSave(p)} onOpen={() => open(p)} onCompare={() => onCompare(p)} />
          ))}
          {rows.length > ds.shown && (
            <button className="load-more" onClick={() => setDs((s) => ({ ...s, shown: s.shown + PAGE }))}>
              Show more problems <span>↓</span>
            </button>
          )}
        </section>

        <aside className="rising-panel">
          <div className="aside-title">
            <div><p className="kicker">LATEST {weeks} WEEKS</p><h3>Rising problems</h3></div><span>Growth / wk</span>
          </div>
          {rising.length === 0 && (
            <p className="aside-empty">{loading ? 'Loading…' : 'Not enough weekly history yet to detect rising problems.'}</p>
          )}
          {rising.map((r, i) => (
            <div className="rising-item clickable" key={r.key} onClick={() => navigate(href.problem(r.postId))}>
              <span className="rank">0{i + 1}</span>
              <div>
                <strong>{r.title}</strong>
                <small>{signed(r.growthPct)}% weekly growth · {r.count} related posts</small>
              </div>
              <Sparkline values={r.series} />
            </div>
          ))}
          {rising.length > 0 && (
            <button className="aside-link" onClick={() => setDs((s) => ({ ...s, tab: 'Rising', shown: PAGE }))}>
              View all rising problems <Icon name="arrow" size={15} />
            </button>
          )}
          <div className="signal-note"><Icon name="sparkles" size={16} />
            <p><b>How signals work</b><br />
              Growth is the weekly log-slope of related post counts (by Reddit post date). It reflects discussion volume, not verified market size.</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
