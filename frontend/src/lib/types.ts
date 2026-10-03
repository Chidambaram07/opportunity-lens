/** Normalised pain-point post used everywhere in the UI. Every field comes from the backend. */
export interface Problem {
  id: string
  title: string
  content: string
  category: string
  subreddit: string
  author: string
  upvotes: number | null
  comments: number
  ratio: number | null
  createdMs: number | null
  url: string | null
  // NLP pipeline output (run_pipeline.py) — null until the pipeline has been run
  sentiment: string | null
  compound: number | null
  intensity: number | null
  topicId: number | null
  keywords: string[]
  trend: number | null
  oppScore: number | null
  competition: number | null
  nlp: boolean
}

export interface CategoryStat { category: string; count: number }
export interface Stats {
  totalPosts: number
  totalPainPoints: number
  categories: CategoryStat[]
  topSubreddits: { name: string; count: number }[]
}
export interface CategoryOpportunity {
  category: string
  painPoints: number
  averageScore: number
  opportunityScore: number
}
export interface Health { status: string; database: string }

export interface Solution { idea: string; how_it_works: string; why_it_works: string }
export interface Analysis {
  problem_statement: string
  solutions: Solution[]
  target_audience: string
  monetization: string
  market_size: 'small' | 'medium' | 'large'
  difficulty: 'easy' | 'medium' | 'hard'
}
export interface SolutionResponse {
  pain_point: string
  category: string
  model_used?: string
  attempts?: number
  from_cache?: boolean
  error?: string
  market_signals?: { category_volume: number; category_rank: number; avg_category_engagement: number }
  nlp_signals?: {
    available: boolean
    sentiment: string
    complaint_intensity: number
    opportunity_score: number | null
    trend: number | null
    topic_keywords: string[]
  }
  analysis: Analysis
}

export interface SavedIdea {
  key: string
  problemId: string
  problemTitle: string
  category: string
  idea: string
  how: string
  why: string
  savedAt: number
}
