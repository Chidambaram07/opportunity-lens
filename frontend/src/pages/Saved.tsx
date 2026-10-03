import { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { href, navigate } from '@/lib/router'
import { compact, ellipsis, timeAgo } from '@/lib/format'
import Icon from '@/components/Icon'
import { Button, Pill, StateCard } from '@/components/ui'

export default function Saved() {
  const { lib, resolve, now, flash } = useApp()
  const [tab, setTab] = useState<'problems' | 'ideas'>('problems')

  const items = Object.entries(lib.saved)
    .sort((a, b) => b[1] - a[1])
    .map(([id, savedAt]) => ({ p: resolve(id), savedAt }))
    .filter((x): x is { p: NonNullable<typeof x.p>; savedAt: number } => !!x.p)
  const ideas = Object.values(lib.ideas).sort((a, b) => b.savedAt - a.savedAt)

  return (
    <main className="narrow-main">
      <div className="standard-heading">
        <p className="kicker">RESEARCH LIBRARY</p><h1>Saved</h1>
        <p>Problems and opportunities you’ve bookmarked for later research.</p>
      </div>
      <div className="saved-tabs">
        <button className={tab === 'problems' ? 'active' : ''} onClick={() => setTab('problems')}>Problems <span>{items.length}</span></button>
        <button className={tab === 'ideas' ? 'active' : ''} onClick={() => setTab('ideas')}>Opportunities <span>{ideas.length}</span></button>
      </div>

      {tab === 'problems' && (items.length ? (
        <div className="saved-table">
          <div className="saved-head"><span>Problem</span><span>Category</span><span>Upvotes</span><span>Comments</span><span>Score</span><span>Saved</span><span /></div>
          {items.map(({ p, savedAt }) => (
            <div className="saved-row" key={p.id}>
              <div><b onClick={() => navigate(href.problem(p.id))}>{p.title}</b><small>Reddit{p.subreddit ? ` · r/${p.subreddit}` : ''}</small></div>
              <Pill>{p.category}</Pill>
              <b>{p.upvotes === null ? '—' : compact(p.upvotes)}</b>
              <b>{compact(p.comments)}</b>
              <span>{p.oppScore === null ? '—' : `${Math.round(p.oppScore * 100)}/100`}</span>
              <span>{timeAgo(savedAt, now)}</span>
              <div>
                <button onClick={() => { const r = lib.toggleCompare(p); flash(r === 'full' ? 'Compare holds up to 4 problems' : r === 'added' ? 'Added to comparison' : 'Removed from comparison') }}>
                  {lib.compare.includes(p.id) ? 'In compare' : 'Compare'}</button>
                <button onClick={() => { lib.toggleSave(p); flash('Removed from saved') }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StateCard icon="bookmark" title="No saved problems yet"
          action={<Button primary onClick={() => navigate(href.discover())}>Explore problems</Button>}>
          Save problems that deserve a closer look and they’ll appear here.
        </StateCard>
      ))}

      {tab === 'ideas' && (ideas.length ? (
        <div className="opportunity-list saved-ideas">
          {ideas.map((i, n) => (
            <article className="opportunity" key={i.key}>
              <span>{String(n + 1).padStart(2, '0')}</span>
              <div><Pill tone="amber">Hypothesis</Pill><h3>{i.idea}</h3><p>{i.how}</p></div>
              <div className="opp-meta">
                <small>From problem</small><b className="link" onClick={() => navigate(href.problem(i.problemId))}>{ellipsis(i.problemTitle, 70)}</b>
                <small>Saved</small><b>{timeAgo(i.savedAt, now)}</b>
              </div>
              <button aria-label="Remove" onClick={() => { lib.toggleIdea(i); flash('Idea removed') }}><Icon name="x" size={16} /></button>
            </article>
          ))}
        </div>
      ) : (
        <StateCard icon="bookmark" title="No saved opportunities yet">
          Open a problem and bookmark any AI-generated business idea to keep it here.
        </StateCard>
      ))}
    </main>
  )
}
