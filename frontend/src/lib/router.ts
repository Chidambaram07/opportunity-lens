import { useEffect, useState } from 'react'

export type RouteName = 'discover' | 'search' | 'problem' | 'markets' | 'saved' | 'compare'
export interface Route { name: RouteName; id?: string; q?: string; category?: string }

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [path, qs = ''] = raw.split('?')
  const params = new URLSearchParams(qs)
  const seg = path.split('/').filter(Boolean)
  switch (seg[0]) {
    case 'search': return { name: 'search', q: params.get('q') ?? '' }
    case 'problem': return { name: 'problem', id: seg[1] ? decodeURIComponent(seg[1]) : '' }
    case 'markets': return { name: 'markets' }
    case 'saved': return { name: 'saved' }
    case 'compare': return { name: 'compare' }
    default: return { name: 'discover', category: params.get('category') ?? undefined }
  }
}

export const href = {
  discover: (category?: string) => (category ? `#/?category=${encodeURIComponent(category)}` : '#/'),
  search: (q: string) => `#/search?q=${encodeURIComponent(q)}`,
  problem: (id: string) => `#/problem/${encodeURIComponent(id)}`,
  markets: '#/markets',
  saved: '#/saved',
  compare: '#/compare',
}

export const navigate = (to: string) => { window.location.hash = to }
export const replaceRoute = (to: string) => { window.location.replace(to) }

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
