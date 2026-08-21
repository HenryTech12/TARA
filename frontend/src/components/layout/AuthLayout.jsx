import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Squad ambient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#FF4C1D]/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-[#9B0063]/6 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  )
}
