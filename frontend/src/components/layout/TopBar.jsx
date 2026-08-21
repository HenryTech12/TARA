import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useGraph } from '@/hooks/useGraph'

// Client-side search over the already-loaded identity graph — there is no
// server-side search endpoint for TARA, and the graph is small (~24 nodes),
// so filtering in the browser is simpler than adding a backend query param.
function useIdentitySearch(q) {
  const { data: graphData } = useGraph()
  return useMemo(() => {
    const query = q.trim().toLowerCase()
    if (query.length < 2) return []
    const nodes = graphData?.nodes ?? []
    return nodes
      .filter((n) => n.label?.toLowerCase().includes(query) || n.id.toLowerCase().includes(query))
      .slice(0, 6)
  }, [graphData, q])
}

export function TopBar() {
  const [search, setSearch] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const logout = useAuthStore((s) => s.logout)
  const notifications = useUIStore((s) => s.notifications)
  const clearNotifications = useUIStore((s) => s.clearNotifications)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setOpen(debouncedQ.length >= 2)
  }, [debouncedQ])

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = useIdentitySearch(debouncedQ)

  function go(path) {
    navigate(path)
    setSearch('')
    setOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-[#0D1117] border-b border-[#1E2535] flex flex-col shrink-0">
      <div className="h-0.5 w-full brand-gradient-bg" />
    <div className="h-13 flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md text-[#94A3B8] hover:text-[#F7F9FC] hover:bg-[#1C2333] transition-colors"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      <div className="flex-1 max-w-md relative" ref={wrapperRef}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => debouncedQ.length >= 2 && setOpen(true)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder="Search identities..."
            className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md pl-9 pr-4 py-1.5 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 font-mono"
          />
        </div>

        {open && (
          <div className="absolute top-full mt-1 w-full bg-[#111827] border border-[#2D3748] rounded-lg shadow-xl z-50 overflow-hidden">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[#4B5563]">No results for &quot;{debouncedQ}&quot;</p>
            ) : (
              <div>
                <p className="px-4 pt-2 pb-1 text-[10px] text-[#4B5563] uppercase tracking-wider font-medium">Identities</p>
                {results.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => go(`/identities/${n.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1C2333] transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#F7F9FC] truncate">{n.label}</p>
                      <p className="text-[10px] text-[#4B5563] font-mono truncate">{n.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full brand-gradient-bg glow-brand">
          <span className="text-[10px] font-bold text-white tracking-wide uppercase">TiT 6.0 · QoreID Track</span>
        </div>

        <button
          onClick={clearNotifications}
          className="relative p-2 rounded-md text-[#94A3B8] hover:text-[#F7F9FC] hover:bg-[#161B27] transition-colors"
        >
          <BellIcon className="w-4 h-4" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF4C1D] rounded-full" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-[#1E2535]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4C1D]/30 to-[#9B0063]/30 border border-[#FF4C1D]/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#FF8560]">AO</span>
          </div>
          <span className="hidden sm:block text-sm text-[#94A3B8]">Akeem Jr.</span>
          <button onClick={handleLogout} className="p-1 rounded text-[#4B5563] hover:text-red-400 transition-colors ml-1" title="Logout">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </header>
  )
}
