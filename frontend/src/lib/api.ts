import type {
  CategoryOpportunity, Health, Problem, SolutionResponse, Stats,
} from './types'
import { normalizeProblem } from './normalize'

const ROOT = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')
const V1 = `${ROOT}/api/v1`

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError('Cannot reach the backend API. Is it running on port 8000?')
  }
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = typeof j?.detail === 'string' ? j.detail : j?.detail ? JSON.stringify(j.detail) : ''
    } catch { /* body was not JSON */ }
    if (!detail && res.status >= 500) detail = `Backend API is not reachable (HTTP ${res.status}).`
    throw new ApiError(detail || `Request failed (HTTP ${res.status})`, res.status)
  }
  return (await res.json()) as T
}

const json = (body: unknown, signal?: AbortSignal): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
  signal,
})

export const api = {
  async health(signal?: AbortSignal): Promise<Health> {
    return http<Health>(`${ROOT}/health`, { signal })
  },

  async painPoints(limit: number, signal?: AbortSignal): Promise<Problem[]> {
    const d = await http<{ pain_points: Record<string, any>[] }>(
      `${V1}/pain-points?limit=${limit}&min_score=0`, { signal })
    const seen = new Set<string>()
    const out: Problem[] = []
    for (const raw of d.pain_points ?? []) {
      const p = normalizeProblem(raw)
      if (!p.title || seen.has(p.id)) continue
      seen.add(p.id)
      out.push(p)
    }
    return out
  },

  async statistics(signal?: AbortSignal): Promise<Stats> {
    const d = await http<any>(`${V1}/statistics`, { signal })
    return {
      totalPosts: d.total_posts ?? 0,
      totalPainPoints: d.total_pain_points ?? 0,
      categories: (d.categories ?? []).map((c: any) => ({ category: String(c._id), count: c.count })),
      topSubreddits: (d.top_subreddits ?? []).map((c: any) => ({ name: String(c._id), count: c.count })),
    }
  },

  async opportunities(signal?: AbortSignal): Promise<CategoryOpportunity[]> {
    const d = await http<any>(`${V1}/opportunities?limit=100`, { signal })
    return (d.opportunities ?? []).map((o: any) => ({
      category: String(o.category),
      painPoints: o.pain_points_count ?? 0,
      averageScore: o.average_score ?? 0,
      opportunityScore: o.opportunity_score ?? 0,
    }))
  },

  async subreddits(signal?: AbortSignal): Promise<string[]> {
    const d = await http<{ subreddits: string[] }>(`${V1}/subreddits`, { signal })
    return d.subreddits ?? []
  },

  async search(q: string, limit: number, signal?: AbortSignal): Promise<Problem[]> {
    const d = await http<{ results: Record<string, any>[] }>(
      `${V1}/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal })
    return (d.results ?? []).map((r) => normalizeProblem(r, { fromSearch: true }))
  },

  /** Groq-powered analysis. Cached 7 days by the backend, but a cold call can take ~30 s. */
  async generate(p: Problem, signal?: AbortSignal): Promise<SolutionResponse> {
    return http<SolutionResponse>(`${V1}/solutions/generate`, json({
      title: p.title,
      category: p.category || 'General',
      content: p.content || '',
      score: p.upvotes ?? 0,
      num_comments: p.comments,
    }, signal))
  },

  async feedback(body: { pain_point: string; category: string; solution_idea: string; rating: 'up' | 'down' }) {
    return http<{ status: string; message: string }>(`${V1}/solutions/feedback`, json(body))
  },
}
