import { useId } from 'react'

/** Weekly counts → smooth area chart. All values come from real post timestamps. */
export default function TrendChart({ counts, labels }: { counts: number[]; labels: string[] }) {
  const id = useId().replace(/:/g, '')
  const W = 800, H = 150, pad = 10
  const max = Math.max(1, ...counts)
  const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4
  const n = counts.length
  const pts = counts.map((c, i) => [n === 1 ? W / 2 : (i / (n - 1)) * W, H - pad - (c / niceMax) * (H - pad * 2)] as const)
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`
  }
  const ticks = [niceMax, Math.round((niceMax * 2) / 3), Math.round(niceMax / 3), 0]
  const step = Math.max(1, Math.ceil(n / 6))
  const shown = labels.map((l, i) => (i % step === 0 || i === n - 1 ? l : '')).filter(Boolean)
  return (
    <div className="trend-chart">
      <div className="chart-labels">{ticks.map((t, i) => <span key={i}>{t}</span>)}</div>
      <svg viewBox={`0 0 ${W} ${H + 10}`} preserveAspectRatio="none" role="img" aria-label="Weekly post volume">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4f46e5" stopOpacity=".14" /><stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="grid" d={[pad, 55, 100, H - pad].map((y) => `M0 ${y}H${W}`).join('')} />
        <path d={`${d} L${W} ${H} L0 ${H}Z`} fill={`url(#${id})`} />
        <path className="line" d={d} />
      </svg>
      <div className="chart-months">{shown.map((l, i) => <span key={i}>{l}</span>)}</div>
    </div>
  )
}
