import type { Problem } from '@/lib/types'
import { engagement } from '@/lib/normalize'
import { cleanText, compact, signed, timeAgo } from '@/lib/format'
import Icon from './Icon'
import { Pill } from './ui'

export default function ProblemRow({ item, now, growth, saved, comparing, onSave, onOpen, onCompare }: {
  item: Problem; now: number; growth: number | null; saved: boolean; comparing: boolean
  onSave: () => void; onOpen: () => void; onCompare: () => void
}) {
  const snippet = cleanText(item.content, 240)
  return (
    <article className="problem-row">
      <div className="problem-main">
        <div className="eyebrow">
          <Pill>{item.category}</Pill>
          {growth !== null && growth > 0 && <Pill tone="indigo">Rising</Pill>}
          <span>Observed {timeAgo(item.createdMs, now)}</span>
        </div>
        <h2 onClick={onOpen}>{item.title}</h2>
        <p>{snippet || 'This post has no body text. Open it to read the source discussion on Reddit.'}</p>
        <div className="metric-line">
          <span><b>{item.upvotes === null ? '—' : compact(item.upvotes)}</b> upvotes</span><i />
          <span><b>{compact(item.comments)}</b> comments</span><i />
          {item.oppScore !== null
            ? <span><b>{Math.round(item.oppScore * 100)}</b>/100 opportunity</span>
            : <span><b>{compact(engagement(item))}</b> engagement</span>}
          {growth !== null && (<><i /><span className={growth > 0 ? 'positive' : ''}><b>{signed(growth)}%</b> weekly growth</span></>)}
        </div>
        <div className="source-line">
          <small>Source</small>
          <span>Reddit</span>
          {item.subreddit && <span>r/{item.subreddit}</span>}
          {item.keywords.slice(0, 3).map((k) => <span key={k}>#{k}</span>)}
        </div>
      </div>
      <div className="row-actions">
        <button className={`icon-btn ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove from saved' : 'Save'}>
          <Icon name="bookmark" size={17} />
        </button>
        <button className="text-action" onClick={onCompare}>{comparing ? 'In compare ✓' : 'Compare'}</button>
        <button className="open-action" onClick={onOpen}>Explore <Icon name="arrow" size={15} /></button>
      </div>
    </article>
  )
}
