import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    login({ name: 'Akeem Jr.', email, role: 'Reviewer' }, 'mock-jwt-token-tara-2026')
    navigate('/dashboard')
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full brand-gradient-bg">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wide">TiT 6.0 · QoreID Track</span>
          </span>
        </div>
        <h1 className="text-3xl font-bold">
          <span className="text-white">TA</span><span className="text-brand-gradient">RA</span>
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">QoreID proves who they are. TARA reveals who they're connected to.</p>
      </div>

      <div className="bg-[#0D1117] border border-[#1E2535] rounded-xl overflow-hidden">
        {/* Gradient top border */}
        <div className="h-0.5 w-full brand-gradient-bg" />

        <div className="p-8">
          <h2 className="text-base font-semibold text-[#F7F9FC] mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@platform.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</p>}

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs text-[#94A3B8] hover:text-[#FF6B3D] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg brand-gradient-bg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 glow-brand"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-4 p-3 bg-[#0A0E1A] rounded-md border border-[#1E2535]">
            <p className="text-[10px] text-[#4B5563] font-mono text-center">Demo: any email + any password</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
        <p className="text-[10px] text-[#4B5563] font-mono">© 2026 TARA · Team Overclock</p>
      </div>
    </div>
  )
}
