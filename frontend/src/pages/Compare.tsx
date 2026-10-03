import { useApp } from '@/state/AppContext'
import { MAX_COMPARE } from '@/state/useLibrary'
import { href, navigate } from '@/lib/router'
import { cap, compact, signed, timeAgo } from '@/lib/format'
import { intensityTier, slopeToPct } from '@/lib/analytics'
import type { Problem, SolutionResponse } from '@/lib/types'
import Icon from '@/components/Icon'
import { Button, Pill, StateCard } from '@/components/ui'

type Cell = { text: string; positive?: boolean }

export default function Compare() {
  const { lib, resolve, now, growth, analyses, loadAnalysis } = useApp()
  const selected = lib.compare.map(resolve).filter((p): p is Problem => !!p)
  const cols = `180px repeat(${Math.max(selected.length, 1)},minmax(230px,1fr))`
  const maxUp = Math.max(1, ...selected.map((p) => p.upvotes ?? 0))

  const ai = (p: Problem): { data?: SolutionResponse; status?: string } => ({ data: analyses[p.id]?.data, status: analyses[p.id]?.status })
  const aiCell = (p: Problem, pick: (d: SolutionResponse) => string): Cell => {
    const { data, status } = ai(p)
    if (data) return { text: pick(data) }
    return { text: status === 'loading' ? 'Analyzing…' : status === 'error' ? 'Analysis failed' : 'Not analyzed yet' }
  }

  const rows: [string, (p: Problem) => Cell, string?][] = [
    ['Category', (p) => ({ text: p.category })],
    ['Source', (p) => ({ text: p.subreddit ? `r/${p.subreddit}` : 'Reddit' })],
    ['Upvotes', (p) => ({ text: p.upvotes === null ? '—' : compact(p.upvotes) }), 'bar'],
    ['Comments', (p) => ({ text: compact(p.comments) })],
    ['Upvote ratio', (p) => ({ text: p.ratio === null ? '—' : `${Math.round(p.ratio * 100)}%` })],
    ['Posted', (p) => ({ text: timeAgo(p.createdMs, now) })],
    ['Opportunity score', (p) => ({ text: p.oppScore === null ? 'Not scored' : `${Math.round(p.oppScore * 100)}/100` })],
    ['Sentiment', (p) => ({ text: p.sentiment ? `${cap(p.sentiment)}${p.compound !== null ? ` (${signed(p.compound, 2)})` : ''}` : '—' })],
    ['Complaint intensity', (p) => ({ text: p.intensity === null ? '—' : `${intensityTier(p.intensity)} · ${p.intensity.toFixed(2)}` })],
    ['Weekly growth', (p) => {
      const g = p.trend !== null ? slopeToPct(p.trend) : growth.get(p.id) ?? null
      return { text: g === null ? '—' : `${signed(g)}%`, positive: g !== null && g > 0 }
    }],
    ['Topic keywords', (p) => ({ text: p.keywords.length ? p.keywords.slice(0, 5).join(', ') : '—' })],
    ['Target customer', (p) => aiCell(p, (d) => d.analysis.target_audience)],
    ['Market size (AI)', (p) => aiCell(p, (d) => cap(d.analysis.market_size))],
    ['Build difficulty (AI)', (p) => aiCell(p, (d) => cap(d.analysis.difficulty))],
    ['Monetization (AI)', (p) => aiCell(p, (d) => d.analysis.monetization)],
  ]

  return (
    <main className="narrow-main compare-page">
      <div className="standard-heading">
        <p className="kicker">EVALUATION WORKSPACE</p><h1>Compare opportunities</h1>
        <p>Evaluate multiple problems side by side using factual dimensions and supporting evidence.</p>
      </div>
      <div className="compare-notice"><Icon name="sparkles" size={17} />
        <span>No artificial winner is selected. Compare evidence, tradeoffs, and validation needs.</span>
        <small>{selected.length}/{MAX_COMPARE} selected</small></div>

      {selected.length < 2 ? (
        <StateCard icon="compare" title="Select at least two opportunities"
          action={<Button primary onClick={() => navigate(href.discover())}>Browse problems</Button>}>
          Add problems from Discover to evaluate them side by side.
        </StateCard>
      ) : (
        <div className="compare-wrap">
          <div className="compare-grid compare-titles" style={{ gridTemplateColumns: cols }}>
            <div><span>COMPARISON DIMENSION</span></div>
            {selected.map((p, i) => {
              const st = analyses[p.id]?.status
              return (
                <div key={p.id}>
                  <Pill>{p.category}</Pill><span>OPPORTUNITY 0{i + 1}</span>
                  <h3>{p.title}</h3>
                  <button onClick={() => navigate(href.problem(p.id))}>View full analysis <Icon name="arrow" size={14} /></button>
                  <button className="cmp-sub" disabled={st === 'loading' || st === 'ready'} onClick={() => loadAnalysis(p, true)}>
                    {st === 'ready' ? 'AI analysis loaded' : st === 'loading' ? 'Analyzing…' : st === 'error' ? 'Retry AI analysis' : 'Run AI analysis'}</button>
                  <button className="cmp-sub" onClick={() => lib.removeCompare(p.id)}>Remove</button>
                </div>
              )
            })}
          </div>
          {rows.map(([label, get, kind]) => (
            <div className="compare-grid compare-row" key={label} style={{ gridTemplateColumns: cols }}>
              <div>{label}</div>
              {selected.map((p) => {
                const c = get(p)
                return (
                  <div key={p.id} className={`${c.positive ? 'positive ' : ''}${kind === 'bar' ? 'with-bar' : ''}`}>
                    {c.text}
                    {kind === 'bar' && <i style={{ width: `${Math.max(4, ((p.upvotes ?? 0) / maxUp) * 100)}%` }} />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
