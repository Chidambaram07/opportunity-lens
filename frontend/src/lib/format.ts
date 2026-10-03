export function timeAgo(ms: number | null, now = Date.now()): string {
  if (ms === null) return 'at an unknown date'
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  if (d < 14) return `${d} day${d === 1 ? '' : 's'} ago`
  const w = Math.round(d / 7)
  if (d < 60) return `${w} weeks ago`
  const mo = Math.round(d / 30.4)
  if (mo < 12) return `${mo} months ago`
  const y = Math.round(d / 365)
  return `${y} year${y === 1 ? '' : 's'} ago`
}

export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  const a = Math.abs(n)
  const t = (x: number) => x.toFixed(1).replace(/\.0$/, '')
  if (a >= 1e6) return `${t(n / 1e6)}M`
  if (a >= 1e4) return `${Math.round(n / 1e3)}K`
  if (a >= 1e3) return `${t(n / 1e3)}K`
  return String(Math.round(n))
}

export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export const fmtDateLong = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export const signed = (n: number, digits = 0) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}`

export const ellipsis = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** Strip Reddit markdown / URLs / quotes so post bodies read as plain text. */
export function cleanText(text: string, max = 260): string {
  if (!text) return ''
  let t = text
  t = t.replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  t = t.replace(/https?:\/\/\S+/g, '').replace(/www\.\S+/g, '')
  t = t.replace(/\*{1,3}/g, '').replace(/~~([^~]+)~~/g, '$1').replace(/`[^`]+`/g, '').replace(/^#{1,6}\s/gm, '')
  t = t.replace(/^>.*$/gm, '')
  t = t.replace(/\[(removed|deleted)\]/gi, '')
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x200B;/g, '')
  t = t.replace(/\s+/g, ' ').trim()
  return ellipsis(t, max)
}

export function download(filename: string, text: string, type = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'research'
