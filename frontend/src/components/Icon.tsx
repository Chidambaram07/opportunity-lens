export type IconName =
  | 'search' | 'bell' | 'bookmark' | 'compare' | 'arrow' | 'chevron'
  | 'external' | 'check' | 'x' | 'menu' | 'download' | 'sparkles'
  | 'refresh' | 'thumbUp' | 'thumbDown' | 'alert'

export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    compare: <><path d="M8 5h13M8 12h9M8 19h6" /><path d="M3 4v2M3 11v2M3 18v2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 13v6H5V5h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 21h14" /></>,
    sparkles: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4" /></>,
    thumbUp: <><path d="M7 11v9H3v-9z" /><path d="M7 11l4-8c1.5 0 2.5 1 2.5 2.5V9H20a1 1 0 0 1 1 1.2l-1.5 8A2 2 0 0 1 17.5 20H7" /></>,
    thumbDown: <><path d="M17 13V4h4v9z" /><path d="M17 13l-4 8c-1.5 0-2.5-1-2.5-2.5V15H4a1 1 0 0 1-1-1.2l1.5-8A2 2 0 0 1 6.5 4H17" /></>,
    alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17.5v.01" /></>,
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
  )
}
