import { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { href, navigate } from '@/lib/router'
import { byCategory, seriesFor } from '@/lib/analytics'
import { compact, ellipsis, signed } from '@/lib/format'
import { engagement } from '@/lib/normalize'
import Icon from '@/components/Icon'
import { Dropdown, Pill, Sparkline, StateCard } from '@/components/ui'
import Banners from '@/components/Banners'

type Sort = 'count' | 'growth' | 'opp'

export default function Markets() {
  const { live, anchor, weeks } = useApp()
  const [sort, setSort] = useState<Sort>('count')
  const [method, setMethod] = useState(false)
  const { stats } = live

  const rows = useMemo(() => {
    if (!stats) return []
    const groups = byCategory(live.problems)
    const out = stats.categories.map((c) => {
      const list = groups.get(c.category) ?? []
      const s = seriesFor(list, anchor, weeks)
      const opp = live.opportunities.find((o) => o.category === c.category)
      const top = [...list].sort((a, b) => engagement(b) - engagement(a))[0]
      return { ...c, loaded: list.length, series: s.counts, growth: s.growthPct, opp: opp?.opportunityScore ?? null, top }
    })
    const key = (r: (typeof out)[number]) => (sort === 'count' ? r.count : sort === 'growth' ? r.growth ?? -Infinity : r.opp ?? -Infinity)
    return out.sort((a, b) => key(b) - key(a))
  }, [stats, live.problems, live.opportunities, anchor, weeks, sort])

  const emerging = useMemo(
    () => rows.filter((r) => r.growth !== null && r.growth > 0 && r.loaded >= 2).sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0)).slice(0, 3),
    [rows])

  return (
    <main className="narrow-main">
      <div className="standard-heading">
        <p className="kicker">MARKET EXPLORER</p><h1>Markets</h1>
        <p>Explore problems by category and discover where demand is emerging.</p>
      </div>
      <Banners />
      {!stats ? (
        <StateCard icon="search" title={live.status === 'error' ? 'Statistics unavailable' : 'Loading markets…'}>
          {live.status === 'error' ? 'Start the backend API to see market statistics.' : 'Fetching live statistics.'}
        </StateCard>
      ) : (
        <>
          <div className="market-summary">
            <div><b>{stats.totalPosts.toLocaleString()}</b><span>Posts scanned</span></div>
            <div><b>{stats.totalPainPoints.toLocaleString()}</b><span>Verified problems</span></div>
            <div><b>{stats.categories.length}</b><span>Categories with problems</span></div>
            <div><b>{live.subreddits.length || '—'}</b><span>Subreddits tracked</span></div>
          </div>

          <section className="markets-section">
            <div className="section-row">
              <div><h2>Browse by category</h2><p>Activity across tracked problem spaces</p></div>
              <div className="filters"><Dropdown label="Sort" value={sort === 'count' ? 'any' : sort} onChange={(v) => setSort(v === 'any' ? 'count' : (v as Sort))}
                options={[{ value: 'any', label: 'Most problems' }, { value: 'growth', label: 'Fastest growth' }, { value: 'opp', label: 'Highest opportunity' }]} /></div>
            </div>
            <div className="markets-list">
              <div className="markets-head"><span>Market</span><span>Problems</span><span>Weekly growth</span><span>Opportunity</span><span>Weekly activity</span><span /></div>
              {rows.map((m) => (
                <div className="market-row clickable" key={m.category} onClick={() => navigate(href.discover(m.category))}>
                  <div><span className="market-symbol">{m.category.slice(0, 2).toUpperCase()}</span><b>{m.category}</b></div>
                  <span>{m.count.toLocaleString()}</span>
                  <span className={m.growth !== null && m.growth > 0 ? 'positive' : ''}>{m.growth === null ? '—' : `${m.growth > 0 ? '↑' : '↓'} ${signed(m.growth).replace(/^[+−]/, '')}%`}</span>
                  <span>{m.opp === null ? '—' : m.opp.toFixed(1)}</span>
                  {m.loaded > 0 ? <Sparkline values={m.series} wide /> : <span />}
                  <Icon name="chevron" size={17} />
                </div>
              ))}
              {rows.length === 0 && <p className="aside-empty">No categorised problems yet.</p>}
            </div>
          </section>

          <section className="emerging">
            <div className="section-row">
              <div><p className="kicker">FASTEST GROWING</p><h2>Emerging markets</h2></div>
              <button onClick={() => setMethod((m) => !m)}>View methodology →</button>
            </div>
            {method && (
              <p className="method-note">
                Weekly growth is the slope of ln(posts per week) across the last {weeks} weeks, converted to a percentage, using the Reddit post dates of the problems currently loaded.
                Opportunity is the backend score (problem count × total upvotes ÷ 100) for posts with at least 5 upvotes. These are discussion signals, not verified market sizes.
              </p>
            )}
            {emerging.length === 0
              ? <p className="aside-empty">No category shows a rising weekly trend yet — more weekly history is needed.</p>
              : <div className="emerging-grid">
                {emerging.map((m, i) => (
                  <div key={m.category} className="clickable" onClick={() => navigate(href.discover(m.category))}>
                    <span>0{i + 1}</span><Pill tone="indigo">{signed(m.growth ?? 0)}% weekly activity</Pill>
                    <h3>{m.category}</h3>
                    <p>{m.count.toLocaleString()} problems{m.top ? ` · top: ${ellipsis(m.top.title, 70)}` : ''}</p>
                  </div>
                ))}
              </div>}
          </section>
          <p className="muted-note small">Weekly figures use the {compact(live.problems.length)} most-upvoted verified problems loaded from the API.</p>
        </>
      )}
    </main>
  )
}
