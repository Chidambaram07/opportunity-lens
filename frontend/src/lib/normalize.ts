import type { Problem } from './types'

type Raw = Record<string, any>

/** The API serialises Mongo datetimes as naive ISO strings that are UTC. Parse them as UTC. */
export function toMs(v: unknown): number | null {
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000
  if (typeof v !== 'string' || !v) return null
  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(v)
  let ms = Date.parse(hasTz ? v : `${v}Z`)
  if (Number.isNaN(ms)) ms = Date.parse(v)
  return Number.isNaN(ms) ? null : ms
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/**
 * Convert a raw Mongo post document into a Problem.
 * `fromSearch`: GET /search projects Mongo's textScore into the `score` field, so a
 * non-integer `score` there is a relevance value, not Reddit upvotes — we drop it.
 */
export function normalizeProblem(raw: Raw, opts: { fromSearch?: boolean } = {}): Problem {
  const s = raw.sentiment
  let sentiment: string | null = null
  let compound: number | null = null
  let intensity: number | null = null
  if (s && typeof s === 'object') {
    sentiment = typeof s.label === 'string' ? s.label : null
    compound = num(s.compound)
    intensity = num(s.complaint_intensity)
  } else if (typeof s === 'string') {
    sentiment = s
  }

  const kw: unknown[] = Array.isArray(raw.topic_keywords) ? raw.topic_keywords : []
  const keywords = kw.map((k) => (Array.isArray(k) ? String(k[0]) : String(k))).slice(0, 8)

  let upvotes = num(raw.score)
  if (opts.fromSearch && upvotes !== null && !Number.isInteger(upvotes)) upvotes = null

  const title = String(raw.title ?? '').trim()
  return {
    id: String(raw.post_id ?? raw._id ?? title),
    title,
    content: String(raw.content ?? raw.selftext ?? ''),
    category: raw.category ? String(raw.category) : 'General',
    subreddit: String(raw.subreddit ?? ''),
    author: String(raw.author ?? ''),
    upvotes,
    comments: num(raw.num_comments) ?? 0,
    ratio: num(raw.upvote_ratio),
    createdMs: toMs(raw.created_utc),
    url: typeof raw.url === 'string' && raw.url ? raw.url : null,
    sentiment,
    compound,
    intensity,
    topicId: num(raw.topic_id),
    keywords,
    trend: num(raw.trend),
    oppScore: num(raw.opportunity_score),
    competition: num(raw.competition_score),
    nlp: raw.pipeline_version === 'v2' || num(raw.opportunity_score) !== null,
  }
}

/** Same engagement formula the backend uses in /pain-points/top. */
export const engagement = (p: Problem) => (p.upvotes ?? 0) + p.comments * 2
