import { NavLink } from 'react-router-dom'
import {
  Squares2X2Icon, ChartBarIcon, UserPlusIcon, Cog6ToothIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { to: '/dashboard', icon: Squares2X2Icon, label: 'Dashboard' },
  { to: '/graph',     icon: ChartBarIcon,   label: 'Graph Explorer' },
  { to: '/verify',    icon: UserPlusIcon,   label: 'Verify Identity' },
]

function SidebarContent({ onClose }) {
  return (
    <aside className="w-56 h-full bg-[#0D1117] border-r border-[#1E2535] flex flex-col relative overflow-hidden">
      {/* Brand accent top strip */}
      <div className="h-0.5 w-full brand-gradient-bg shrink-0" />

      {/* Logo area */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1E2535] shrink-0">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-2 group mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-white">TA</span>
            <span className="text-xl font-bold tracking-tight text-brand-gradient">RA</span>
          </div>
          <span className="text-[9px] text-[#4B5563] font-mono bg-[#1C2333] px-1.5 py-0.5 rounded">v1.0</span>
        </NavLink>

        {/* Track badge */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md brand-gradient-bg">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
          <span className="text-[9px] font-bold text-white tracking-wide uppercase">Digital Identity & Trust</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150',
              isActive
                ? 'bg-gradient-to-r from-[#FF4C1D]/15 to-[#9B0063]/10 text-[#FF6B3D] border border-[#FF4C1D]/20'
                : 'text-[#94A3B8] hover:bg-[#161B27] hover:text-[#F7F9FC] border border-transparent'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#FF6B3D]' : '')} />
                <span className="font-medium">{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF4C1D] shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-[#1E2535] space-y-1">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all border',
            isActive
              ? 'bg-gradient-to-r from-[#FF4C1D]/15 to-[#9B0063]/10 text-[#FF6B3D] border-[#FF4C1D]/20'
              : 'text-[#4B5563] hover:text-[#F7F9FC] hover:bg-[#161B27] border-transparent'
          )}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>

        {/* Verification provider strip */}
        <div className="flex items-center justify-center gap-2 py-2 mt-1">
          <span className="text-[9px] text-[#4B5563] font-mono">Verified via QoreID</span>
        </div>
      </div>
    </aside>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex shrink-0 h-screen">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <motion.div
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <SidebarContent onClose={toggleSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
