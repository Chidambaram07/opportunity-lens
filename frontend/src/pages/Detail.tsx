import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { api } from '@/lib/api'
import { href, navigate } from '@/lib/router'
import { engagement } from '@/lib/normalize'
import { byCategory, intensityTier, oppTier, seriesFor, trendTier, weekEndLabels, slopeToPct } from '@/lib/analytics'
import { cap, cleanText, compact, download, ellipsis, signed, slug, timeAgo } from '@/lib/format'
import { buildResearchMarkdown, buildValidationMarkdown } from '@/lib/research'
import { usePersistent } from '@/state/usePersistent'
import type { Problem, Solution } from '@/lib/types'
import Icon from '@/components/Icon'
import TrendChart from '@/components/TrendChart'
import Banners from '@/components/Banners'
import { Button, Pill, Skeleton, StateCard } from '@/components/ui'

function IdeaCard({ n, s, problem }: { n: number; s: Solution; problem: Problem }) {
  const { lib, flash } = useApp()
  const key = `${problem.id}:${n}`
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const saved = key in lib.ideas
  const vote = async (rating: 'up' | 'down') => {
    if (voted) return
    try {
      const r = await api.feedback({ pain_point: problem.title, category: problem.category, solution_idea: s.idea, rating })
      setVoted(rating)
      flash(r.message.replace(/[👍👎]/gu, '').trim() || 'Feedback recorded')
    } catch (e) { flash(`Could not send feedback: ${(e as Error).message}`) }
  }
  return (
    <article className="opportunity">
      <span>{String(n + 1).padStart(2, '0')}</span>
      <div>
        <Pill tone="amber">Hypothesis</Pill>
        <h3>{s.idea}</h3>
        <p>{s.how_it_works}</p>
        <p className="why"><b>Why it could work:</b> {s.why_it_works}</p>
      </div>
      <div className="opp-meta">
        <small>Was this useful?</small>
        <div className="fb">
          <button className={voted === 'up' ? 'on' : ''} disabled={!!voted} onClick={() => vote('up')} aria-label="Helpful"><Icon name="thumbUp" size={15} /></button>
          <button className={voted === 'down' ? 'on' : ''} disabled={!!voted} onClick={() => vote('down')} aria-label="Not helpful"><Icon name="thumbDown" size={15} /></button>
        </div>
      </div>
      <button className={saved ? 'idea-save saved' : 'idea-save'} aria-label={saved ? 'Remove saved idea' : 'Save idea'} onClick={() =>
        flash(lib.toggleIdea({ key, problemId: problem.id, problemTitle: problem.title, category: problem.category,
          idea: s.idea, how: s.how_it_works, why: s.why_it_works, savedAt: Date.now() }) ? 'Idea saved' : 'Idea removed')}>
        <Icon name="bookmark" size={17} />
      </button>
    </article>
  )
}

export default function Detail({ id }: { id: string }) {
  const { live, now, anchor, weeks, growth, resolve, lib, flash, analyses, loadAnalysis } = useApp()
  const p = resolve(id)
  const validationRef = useRef<HTMLElement>(null)
  const [checks, setChecks] = usePersistent<Record<string, boolean>>(`ol.check.${id}`, {})

  // fetch the AI analysis as soon as the problem is open (backend caches for 7 days)
  useEffect(() => { if (p) loadAnalysis(p) }, [p?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => {
    if (!p) return { list: [] as Problem[], by: 'category' as 'topic' | 'category' }
    if (p.topicId !== null) {
      const t = live.problems.filter((x) => x.id !== p.id && x.topicId === p.topicId)
      if (t.length) return { list: t, by: 'topic' as const }
    }
    return { list: live.problems.filter((x) => x.id !== p.id && x.category === p.category), by: 'category' as const }
  }, [p, live.problems])

  if (!p) {
    return (
      <main className="narrow-main">
        <StateCard icon="search" title={live.status === 'loading' ? 'Loading problem…' : 'Problem not found'}
          action={<Button primary onClick={() => navigate(href.discover())}>Back to discover</Button>}>
          {live.status === 'loading' ? 'Fetching the latest data from the API.' : 'It may have left the current feed. Try finding it with search.'}
        </StateCard>
      </main>
    )
  }

  const group = [p, ...related.list]
  const series = seriesFor(group, anchor, weeks)
  const labels = weekEndLabels(anchor, weeks)
  const subs = new Map<string, number>()
  group.forEach((x) => x.subreddit && subs.set(x.subreddit, (subs.get(x.subreddit) ?? 0) + 1))
  const g = growth.get(p.id) ?? null
  const entry = analyses[p.id]
  const ai = entry?.status === 'ready' ? entry.data : undefined
  const a = ai?.analysis

  const evidence = [p, ...[...related.list].sort((x, y) => engagement(y) - engagement(x)).slice(0, 2)]
  const catStats = live.stats?.categories ?? []
  const catTotal = catStats.reduce((s, c) => s + c.count, 0) || 1
  const catPosts = byCategory(live.problems).get(p.category) ?? []
  const catSubs = new Map<string, Problem[]>()
  catPosts.forEach((x) => { if (x.subreddit) catSubs.set(x.subreddit, [...(catSubs.get(x.subreddit) ?? []), x]) })

  const checklist = a ? [
    `Interview people in this audience: ${ellipsis(a.target_audience, 110)}`,
    `Test pricing: ${ellipsis(a.monetization, 110)}`,
    ...a.solutions.map((s) => `Prototype test: ${ellipsis(s.idea, 100)}`),
    ...(p.url ? ['Read the full source thread on Reddit and note objections'] : []),
  ] : []

  const exportResearch = () => {
    download(`${slug(p.title)}.md`, buildResearchMarkdown(p, related.list, ai))
    flash('Research exported')
  }
  const startValidation = () => {
    if (!a) { flash('Waiting for the AI analysis to finish'); return }
    validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const pdesc = cleanText(p.content, 300)
  const sentimentWord = p.sentiment ? cap(p.sentiment) : null

  return (
    <main className="detail-page">
      <div className="detail-top">
        <div className="breadcrumb">
          <a onClick={() => navigate(href.discover())}>Discover</a> <span>/</span>
          <a onClick={() => navigate(href.discover(p.category))}>{p.category}</a> <span>/</span> {ellipsis(p.title, 48)}
        </div>
        <div className="detail-title">
          <div>
            <div className="eyebrow">
              <Pill>{p.category}</Pill>
              {g !== null && g > 0 && <Pill tone="indigo">Rising</Pill>}
              <span>Posted {timeAgo(p.createdMs, now)}</span>
            </div>
            <h1>{p.title}</h1>
            <p>{pdesc || 'This post has no body text — the evidence below comes from related discussions and the source thread.'}</p>
          </div>
          <div className="score">
            <span>Opportunity score</span>
            {p.oppScore !== null ? <>
              <strong>{Math.round(p.oppScore * 100)}<small>/100</small></strong>
              <b>{oppTier(p.oppScore)}</b>
              <p>Demand, sentiment intensity, trend and whitespace, from the NLP pipeline.</p>
            </> : <>
              <strong>—</strong><b>Not scored yet</b>
              <p>Run <code>python run_pipeline.py</code> to compute NLP opportunity scores.</p>
            </>}
          </div>
        </div>
        <div className="provenance">
          <span><b>01</b> SOURCE EVIDENCE</span><i /><span><b>02</b> NLP SIGNALS</span><i /><span><b>03</b> AI SYNTHESIS</span><i /><span><b>04</b> BUSINESS HYPOTHESES</span>
        </div>
      </div>

      <div className="document">
        <Banners />
        <section className="doc-section">
          <div className="section-heading"><div><p className="kicker">OBSERVED EVIDENCE</p><h2>Demand signals</h2></div>
            <p>Signals measured on this Reddit post and on related posts in the same {related.by}.</p></div>
          <div className="metrics">
            {[
              [p.upvotes === null ? '—' : compact(p.upvotes), 'Upvotes'],
              [compact(p.comments), 'Comments'],
              [compact(related.list.length), `Related posts · same ${related.by}`],
              [g === null ? '—' : `${signed(g)}%`, 'Weekly growth'],
              [String(subs.size), 'Subreddits involved'],
            ].map(([v, l], i) => (
              <div key={l}><strong className={i === 3 && g !== null && g > 0 ? 'positive' : ''}>{v}</strong><span>{l}</span></div>
            ))}
          </div>
          <div className="chart-block">
            <div className="chart-head">
              <div><h3>Discussion volume</h3><span>Weekly posts in this {related.by}, last {weeks} weeks to {labels[labels.length - 1]}</span></div>
              <div><b /> Weekly posts</div>
            </div>
            <TrendChart counts={series.counts} labels={labels} />
          </div>
        </section>

        <section className="doc-section evidence-section">
          <div className="section-heading"><div><p className="kicker">SOURCE EVIDENCE</p><h2>What are real people actually saying?</h2></div>
            <p>Excerpts from real Reddit posts stored in your database.</p></div>
          {evidence.map((e) => {
            const quote = cleanText(e.content, 320) || e.title
            return (
              <article className="evidence-item" key={e.id}>
                <div className="quote-mark">“</div>
                <div>
                  <blockquote>{quote}</blockquote>
                  <div className="evidence-meta">
                    <b>Reddit{e.subreddit ? ` · r/${e.subreddit}` : ''}</b>
                    <span>{e.upvotes === null ? '—' : compact(e.upvotes)} upvotes · {compact(e.comments)} comments</span>
                    <span>{timeAgo(e.createdMs, now)}</span>
                  </div>
                </div>
                {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer">View source <Icon name="external" size={14} /></a> : <span />}
              </article>
            )
          })}
        </section>

        <section className="doc-section analysis">
          <div className="section-heading"><div><p className="kicker">NLP PIPELINE SIGNALS</p><h2>What the evidence tells us</h2></div>
            <Pill tone="indigo"><Icon name="sparkles" size={13} /> Computed from real posts</Pill></div>
          {!p.nlp ? (
            <p className="muted-note">This post has not been through the NLP pipeline yet. Run <code>python run_pipeline.py</code> to add topics, sentiment and scores.</p>
          ) : (
            <div className="analysis-grid">
              <div>
                <h3>Topic keywords</h3>
                <ul>{p.keywords.length ? p.keywords.map((k) => <li key={k}><Icon name="check" size={15} />{k}</li>) : <li>No keywords stored</li>}</ul>
              </div>
              <div>
                <h3>Where it is discussed</h3>
                <ul>{[...subs.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([s, c]) => <li key={s}><span className="dot" />r/{s} · {c} post{c === 1 ? '' : 's'}</li>)}</ul>
              </div>
              <div>
                <h3>Sentiment & momentum</h3>
                <p>
                  {sentimentWord ? `${sentimentWord} tone` : 'Sentiment unavailable'}
                  {p.compound !== null ? ` (compound ${signed(p.compound, 2)})` : ''}.
                  {p.competition !== null ? ` Topic crowding ${p.competition.toFixed(2)} (0 = open space, 1 = crowded).` : ''}
                </p>
                <div className="severity">
                  <span>Complaint intensity <b>{p.intensity !== null ? `${intensityTier(p.intensity)} · ${p.intensity.toFixed(2)}` : '—'}</b></span>
                  <span>Trend <b>{p.trend !== null ? `${trendTier(p.trend)} · ${signed(slopeToPct(p.trend))}%/wk` : '—'}</b></span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── AI-generated sections ─────────────────────────────── */}
        {!a && (
          <section className="doc-section ai-gate">
            <div className="section-heading"><div><p className="kicker">AI-GENERATED SYNTHESIS</p><h2>Business analysis</h2></div>
              <Pill tone="indigo"><Icon name="sparkles" size={13} /> Groq LLM</Pill></div>
            {entry?.status === 'error' ? (
              <div className="banner error"><Icon name="alert" size={16} />
                <div><b>The analysis could not be generated</b><span>{entry.error}</span></div>
                <button onClick={() => loadAnalysis(p, true)}>Retry</button></div>
            ) : (
              <>
                <p className="muted-note">Generating an analysis grounded in this post, its category demand and NLP signals. First run can take up to 30 seconds; later runs are cached for 7 days.</p>
                <Skeleton rows={2} />
              </>
            )}
          </section>
        )}

        {a && ai && (
          <section className="underlying">
            <div className="transition-label">EVIDENCE <span>→</span> INSIGHT</div>
            <p className="kicker">THE UNDERLYING PROBLEM</p>
            <h2>{a.problem_statement}</h2>
            {ai.market_signals && ai.market_signals.category_volume > 0 && (
              <p>{p.category} ranks #{ai.market_signals.category_rank} of the categories by pain-point volume, with {ai.market_signals.category_volume} similar posts averaging {ai.market_signals.avg_category_engagement} upvotes.</p>
            )}
          </section>
        )}

        {a && ai && (
          <section className="doc-section">
            <div className="section-heading"><div><p className="kicker">BUSINESS HYPOTHESES</p><h2>Potential business opportunities</h2></div>
              <p>What could be built around this problem? Generated by {ai.model_used ?? 'the AI model'}{ai.from_cache ? ' (cached)' : ''} — worth validating, not guaranteed businesses.</p></div>
            <div className="opportunity-list">{a.solutions.map((s, i) => <IdeaCard key={i} n={i} s={s} problem={p} />)}</div>
          </section>
        )}

        <section className="doc-section market-context">
          <div className="section-heading"><div><p className="kicker">MARKET CONTEXT</p><h2>Where this problem sits</h2></div>
            <p>Measured from every verified pain point in your database.</p></div>
          <div className="market-grid">
            <div className="market-table"><h3>Pain points by category</h3>
              {catStats.slice(0, 6).map((c) => (
                <div key={c.category} className={c.category === p.category ? 'hl' : ''}>
                  <b>{c.category}</b><span>{c.count.toLocaleString()} posts</span><span>{Math.round((c.count / catTotal) * 100)}% of total</span>
                </div>
              ))}
            </div>
            <div className="market-table"><h3>Top subreddits in {p.category}</h3>
              {[...catSubs.entries()].sort((x, y) => y[1].length - x[1].length).slice(0, 6).map(([s, list]) => (
                <div key={s}><b>r/{s}</b><span>{list.length} post{list.length === 1 ? '' : 's'}</span>
                  <span>{compact(Math.round(list.reduce((t, x) => t + (x.upvotes ?? 0), 0) / list.length))} avg upvotes</span></div>
              ))}
              {catSubs.size === 0 && <div><span>No category data loaded.</span></div>}
            </div>
          </div>
        </section>

        {a && ai && (
          <>
            <section className="doc-section profiles">
              <div className="section-heading"><div><p className="kicker">CUSTOMER PROFILE</p><h2>Who experiences this problem?</h2></div></div>
              <div className="profile-grid">
                <div><span>01</span><h3>Target audience</h3><small>WHO</small><p>{a.target_audience}</p>
                  <small>COMPLAINT TONE</small><p>{p.sentiment ? `${cap(p.sentiment)}${p.intensity !== null ? ` · intensity ${p.intensity.toFixed(2)}` : ''}` : 'Not scored'}</p></div>
                <div><span>02</span><h3>Market size</h3><small>AI ESTIMATE</small><p>{cap(a.market_size)}</p>
                  <small>CATEGORY DEMAND</small><p>{ai.market_signals && ai.market_signals.category_volume > 0 ? `Rank #${ai.market_signals.category_rank} · ${ai.market_signals.category_volume} similar posts` : 'Not available'}</p></div>
                <div><span>03</span><h3>Build difficulty</h3><small>AI ESTIMATE</small><p>{cap(a.difficulty)}</p>
                  <small>AVG CATEGORY UPVOTES</small><p>{ai.market_signals && ai.market_signals.category_volume > 0 ? compact(ai.market_signals.avg_category_engagement) : 'Not available'}</p></div>
              </div>
            </section>

            <section className="doc-section monetization">
              <div className="section-heading"><div><p className="kicker">HYPOTHESES TO TEST</p><h2>Possible monetization</h2></div></div>
              <div className="monetization-table">
                <div className="table-head two"><span>Revenue model</span><span>Concepts it applies to</span></div>
                <div className="two"><span>{a.monetization}</span><span>{a.solutions.map((s) => s.idea).join(' · ')}</span></div>
              </div>
            </section>

            <section className="validation" ref={validationRef}>
              <div>
                <p className="kicker">INSIGHT → OPPORTUNITY → ACTION</p><h2>What to validate next</h2>
                <p>A checklist built from this analysis. Progress is saved in your browser.</p>
                <Button primary onClick={() => { download(`validation-${slug(p.title)}.md`, buildValidationMarkdown(p, checklist)); flash('Validation plan downloaded') }}>
                  Download plan <Icon name="download" size={15} /></Button>
              </div>
              <div className="checklist">
                {checklist.map((x) => (
                  <label key={x}>
                    <input type="checkbox" checked={!!checks[x]} onChange={() => setChecks((c) => ({ ...c, [x]: !c[x] }))} />
                    <span><Icon name="check" size={13} /></span>{x}
                  </label>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="action-bar">
        <div><b>{ellipsis(p.title, 70)}</b><span>{p.category}{p.subreddit ? ` · r/${p.subreddit}` : ''} · data refreshed {live.lastUpdated ? timeAgo(live.lastUpdated, now) : 'never'}</span></div>
        <div>
          <Button icon="bookmark" onClick={() => flash(lib.toggleSave(p) ? 'Saved to your research library' : 'Removed from saved')}>{p.id in lib.saved ? 'Saved' : 'Save opportunity'}</Button>
          <Button icon="compare" onClick={() => { const r = lib.toggleCompare(p); flash(r === 'added' ? 'Added to comparison' : r === 'removed' ? 'Removed from comparison' : 'Compare holds up to 4 problems') }}>
            {lib.compare.includes(p.id) ? 'In compare' : 'Add to compare'}</Button>
          <Button icon="download" onClick={exportResearch}>Export research</Button>
          <Button primary onClick={startValidation}>Start validation</Button>
        </div>
      </div>
    </main>
  )
}
