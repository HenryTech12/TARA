import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold font-mono text-[#2D3748] mb-4">404</p>
        <h1 className="text-xl font-semibold text-[#F7F9FC] mb-2">Page not found</h1>
        <p className="text-sm text-[#94A3B8] mb-8">The route you requested does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
