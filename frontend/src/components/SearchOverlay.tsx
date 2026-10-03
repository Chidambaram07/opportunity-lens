import { useMemo, useState } from 'react'
import { href, navigate } from '@/lib/router'
import { useApp } from '@/state/AppContext'
import Icon from './Icon'

type Item = { kind: 'match' | 'recent'; label: string; sub: string; go: () => void }

export default function SearchOverlay({ close }: { close: () => void }) {
  const { live, lib } = useApp()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(false) // true once the user moved the highlight (arrows / hover)

  const submit = (text: string) => {
    const t = text.trim()
    if (t.length < 2) return
    lib.addRecent(t)
    close()
    navigate(href.search(t))
  }

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 3) return []
    return live.problems.filter((p) => p.title.toLowerCase().includes(t)).slice(0, 6)
  }, [q, live.problems])

  const markets = useMemo(() => (live.stats?.categories ?? []).slice(0, 6).map((c) => c.category), [live.stats])

  const items: Item[] = q.trim().length >= 3
    ? matches.map((p) => ({ kind: 'match', label: p.title, sub: p.category, go: () => { close(); navigate(href.problem(p.id)) } }))
    : lib.recent.map((r) => ({ kind: 'recent', label: r, sub: 'Recent', go: () => submit(r) }))

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setPicked(true); setIdx((i) => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPicked(true); setIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      if (picked && items[idx]) items[idx].go()
      else submit(q)
    }
  }

  return (
    <div className="overlay" onMouseDown={close}>
      <div className="command" onMouseDown={(e) => e.stopPropagation()}>
        <div className="command-input">
          <Icon name="search" size={20} />
          <input autoFocus placeholder="Search OpportunityLens" value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); setPicked(false) }} onKeyDown={onKey} />
          <kbd>ESC</kbd>
        </div>
        <div className="command-body">
          <p className="kicker">{q.trim().length >= 3 ? 'MATCHING PROBLEMS' : 'RECENT SEARCHES'}</p>
          {items.length === 0 && (
            <p className="cmd-empty">
              {q.trim().length >= 3 ? 'No title matches. Press Enter to run a full-text search.' : 'Your searches will appear here.'}
            </p>
          )}
          {items.map((it, i) => (
            <button key={`${it.kind}-${it.label}`} className={picked && i === idx ? 'cmd-active' : ''} onMouseEnter={() => { setIdx(i); setPicked(true) }} onClick={it.go}>
              <Icon name="search" size={15} /><span>{it.label}</span><small>{it.sub}</small>
            </button>
          ))}
          {q.trim().length >= 2 && (
            <button onClick={() => submit(q)}><Icon name="arrow" size={15} /><span>Full-text search for “{q.trim()}”</span><small>↵</small></button>
          )}
          {markets.length > 0 && <>
            <p className="kicker">MARKETS</p>
            <div className="suggestions">
              {markets.map((m) => (
                <button key={m} onClick={() => { close(); navigate(href.discover(m)) }}>{m}<Icon name="arrow" size={14} /></button>
              ))}
            </div>
          </>}
        </div>
        <div className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span>
          <span>Searches the live problem database</span>
        </div>
      </div>
    </div>
  )
}
