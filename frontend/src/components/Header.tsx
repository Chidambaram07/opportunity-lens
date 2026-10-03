import { useEffect, useRef, useState } from 'react'
import { href, navigate } from '@/lib/router'
import type { RouteName } from '@/lib/router'
import { timeAgo } from '@/lib/format'
import { useApp } from '@/state/AppContext'
import Icon from './Icon'

const NAV: { key: RouteName; label: string; to: string }[] = [
  { key: 'discover', label: 'Discover', to: href.discover() },
  { key: 'markets', label: 'Markets', to: href.markets },
  { key: 'saved', label: 'Saved', to: href.saved },
  { key: 'compare', label: 'Compare', to: href.compare },
]

export default function Header({ route, openSearch }: { route: RouteName; openSearch: () => void }) {
  const { live, now, fresh, unread, markRead, refresh, lib } = useApp()
  const [bell, setBell] = useState(false)
  const [menu, setMenu] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const current = route === 'problem' || route === 'search' ? 'discover' : route

  useEffect(() => {
    if (!bell) return
    const close = (e: MouseEvent) => { if (!bellRef.current?.contains(e.target as Node)) setBell(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [bell])
  useEffect(() => setMenu(false), [route])

  const counts: Partial<Record<RouteName, number>> = {
    saved: Object.keys(lib.saved).length + Object.keys(lib.ideas).length,
    compare: lib.compare.length,
  }

  const offline = live.status === 'error' || (live.error !== null && live.lastUpdated === null)
  const dbDown = live.health !== null && live.health.database !== 'connected'
  const chip = offline ? { cls: 'off', text: 'Offline' }
    : dbDown ? { cls: 'warn', text: 'Database disconnected' }
    : live.lastUpdated ? { cls: 'on', text: `Live · ${timeAgo(live.lastUpdated, now)}` }
    : { cls: 'warn', text: 'Connecting…' }

  const navButtons = NAV.map((item) => (
    <button key={item.key} className={current === item.key ? 'active' : ''} onClick={() => navigate(item.to)}>
      {item.label}{counts[item.key] ? <em className="nav-count">{counts[item.key]}</em> : null}
    </button>
  ))

  return (
    <header>
      <div className="header-inner">
        <div className="logo" onClick={() => navigate(href.discover())}>
          <span className="logo-mark"><span /></span>
          <strong>Opportunity<span>Lens</span></strong>
        </div>
        <nav>{navButtons}</nav>
        <div className="header-actions">
          <button className="search-trigger" onClick={openSearch}><Icon name="search" size={16} /><span>Search</span><kbd>⌘ K</kbd></button>
          <button className={`live-chip ${chip.cls}`} onClick={() => refresh(true)} title="Refresh now">
            <i />{chip.text}{live.refreshing && <Icon name="refresh" size={12} />}
          </button>
          <div className="bell-wrap" ref={bellRef}>
            <button className="icon-btn bell" aria-label="New problems" onClick={() => { setBell((b) => !b); markRead() }}>
              <Icon name="bell" size={17} />{unread > 0 && <i />}
            </button>
            {bell && (
              <div className="notif-panel">
                <p className="kicker">NEW SINCE YOU OPENED THIS PAGE</p>
                {fresh.length === 0
                  ? <p className="notif-empty">No new problems yet. The feed refreshes every 30 seconds.</p>
                  : fresh.slice(0, 8).map((f) => (
                    <button key={f.problem.id} onClick={() => { setBell(false); navigate(href.problem(f.problem.id)) }}>
                      <b>{f.problem.title}</b>
                      <small>{f.problem.category} · detected {timeAgo(f.detectedAt, now)}</small>
                    </button>
                  ))}
              </div>
            )}
          </div>
          <button className="mobile-menu" aria-label="Menu" onClick={() => setMenu((m) => !m)}><Icon name={menu ? 'x' : 'menu'} /></button>
        </div>
      </div>
      {menu && <div className="mobile-nav">{navButtons}<button onClick={openSearch}>Search</button></div>}
    </header>
  )
}
