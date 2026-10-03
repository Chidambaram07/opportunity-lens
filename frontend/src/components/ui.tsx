import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Icon from './Icon'
import type { IconName } from './Icon'

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>
}

export function Button({ children, primary, icon, onClick, className = '', disabled }: {
  children: ReactNode; primary?: boolean; icon?: IconName; onClick?: () => void; className?: string; disabled?: boolean
}) {
  return (
    <button className={`btn ${primary ? 'primary' : ''} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={16} />}{children}
    </button>
  )
}

/** Sparkline from real values (e.g. weekly post counts). */
export function Sparkline({ values, wide = false }: { values: number[]; wide?: boolean }) {
  const n = values.length
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => `${n === 1 ? 50 : 3 + (i / (n - 1)) * 94},${27 - (v / max) * 24}`)
  return (
    <svg className={wide ? 'spark wide' : 'spark'} viewBox="0 0 100 30" preserveAspectRatio="none">
      <path d={`M ${pts.join(' L ')}`} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export interface Option { value: string; label: string }

export function Dropdown({ label, value, options, onChange }: {
  label: string; value: string; options: Option[]; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const current = options.find((o) => o.value === value)
  const active = value !== 'any' && current
  return (
    <div className="dd" ref={ref}>
      <button className={active ? 'dd-btn active' : 'dd-btn'} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {active ? `${label}: ${current!.label}` : label}<span>⌄</span>
      </button>
      {open && (
        <div className="dd-menu" role="listbox">
          {options.map((o) => (
            <button key={o.value} role="option" aria-selected={o.value === value}
              className={o.value === value ? 'selected' : ''}
              onClick={() => { onChange(o.value); setOpen(false) }}>
              <span>{o.label}</span>{o.value === value && <Icon name="check" size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function StateCard({ icon = 'sparkles', title, children, action }: {
  icon?: IconName; title: string; children?: ReactNode; action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={24} /></div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="problem-row skeleton-row" key={i}>
          <div>
            <div className="sk" style={{ width: '22%', height: 14 }} />
            <div className="sk" style={{ width: '78%', height: 20, marginTop: 14 }} />
            <div className="sk" style={{ width: '94%', height: 12, marginTop: 12 }} />
            <div className="sk" style={{ width: '60%', height: 12, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Toast({ text }: { text: string }) {
  return <div className="toast" role="status"><span><Icon name="check" size={14} /></span>{text}</div>
}
