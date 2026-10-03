import { useEffect, useState } from 'react'
import { AppProvider, useApp } from '@/state/AppContext'
import { useRoute } from '@/lib/router'
import Header from '@/components/Header'
import SearchOverlay from '@/components/SearchOverlay'
import { Toast } from '@/components/ui'
import Discover, { INITIAL_DISCOVER } from '@/pages/Discover'
import type { DiscoverState } from '@/pages/Discover'
import SearchResults from '@/pages/SearchResults'
import Detail from '@/pages/Detail'
import Markets from '@/pages/Markets'
import Saved from '@/pages/Saved'
import Compare from '@/pages/Compare'

function Shell() {
  const route = useRoute()
  const { toast } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [ds, setDs] = useState<DiscoverState>(INITIAL_DISCOVER)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  // scroll to top when moving between pages
  useEffect(() => { window.scrollTo({ top: 0 }) }, [route.name, route.id])

  let page: React.ReactNode
  switch (route.name) {
    case 'search': page = <SearchResults q={route.q ?? ''} />; break
    case 'problem': page = <Detail key={route.id} id={route.id ?? ''} />; break
    case 'markets': page = <Markets />; break
    case 'saved': page = <Saved />; break
    case 'compare': page = <Compare />; break
    default: page = <Discover ds={ds} setDs={setDs} category={route.category} />
  }

  return (
    <div className="app">
      <Header route={route.name} openSearch={() => setSearchOpen(true)} />
      {page}
      {searchOpen && <SearchOverlay close={() => setSearchOpen(false)} />}
      {toast && <Toast text={toast} />}
    </div>
  )
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>
}
