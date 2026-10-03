import { useApp } from '@/state/AppContext'
import { timeAgo } from '@/lib/format'
import Icon from './Icon'

/** Connection / data-freshness notices, shown on every data page. */
export default function Banners() {
  const { live, now, anchor, refresh } = useApp()
  const out: React.ReactNode[] = []

  if (live.error) {
    out.push(
      <div className="banner error" key="err">
        <Icon name="alert" size={16} />
        <div>
          <b>{live.status === 'error' ? 'Cannot load data from the backend' : 'Showing the last successful data'}</b>
          <span>{live.error}{' '}
            Start the API with <code>uvicorn api.main:app --port 8000</code> from the project root.</span>
        </div>
        <button onClick={() => refresh(true)}>Retry</button>
      </div>,
    )
  } else if (live.health && live.health.database !== 'connected') {
    out.push(
      <div className="banner error" key="db">
        <Icon name="alert" size={16} />
        <div><b>The API is up but MongoDB is disconnected</b><span>Check MONGODB_URI in .env and your Atlas network access list.</span></div>
        <button onClick={() => refresh(true)}>Retry</button>
      </div>,
    )
  }

  if (live.problems.length > 0 && now - anchor > 14 * 86_400_000) {
    out.push(
      <div className="banner info" key="stale">
        <Icon name="sparkles" size={16} />
        <div>
          <b>The newest post in the database is {timeAgo(anchor, now)}</b>
          <span>Run <code>python scripts/run_scraper.py</code> then <code>python retag_all_posts.py</code> to pull fresh data. This page picks it up automatically.</span>
        </div>
      </div>,
    )
  }
  return out.length ? <div className="banners">{out}</div> : null
}
