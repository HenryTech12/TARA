import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAlerts } from '@/hooks/useAlerts'
import { formatNaira } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'

function getRiskColor(score) {
  const n = parseFloat(score)
  if (n >= 0.7) return 'border-red-500'
  if (n >= 0.4) return 'border-amber-500'
  return 'border-green-500'
}

function getRelativeTime(isoDate) {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1 min ago'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr === 1) return '1 hr ago'
  return `${diffHr} hrs ago`
}

function truncate(str, maxLen) {
  if (!str) return '—'
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

const STEP_LABELS = [
  'Musa Lawal → Shell Co Alpha',
  'Shell Co Alpha → Quick Cash',
  'Quick Cash → Alpha Remit',
  'Alpha Remit → Final Beneficiary',
]

export function SquadFeed() {
  const queryClient = useQueryClient()
  const [simStep, setSimStep] = useState(0) // 0 = idle, 1-4 = steps, 5 = analyzing, -1 = done
  const [toast, setToast] = useState(null)
  const prevAlertCountRef = useRef(null)
  const stepTimerRef = useRef(null)
  const pollTimerRef = useRef(null)

  const isSimulating = simStep > 0 && simStep <= 5

  // Use shared, normalised alerts hook — safe for all components
  const { data: alerts = [] } = useAlerts()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => apiClient.get('/transactions/recent').then(r => r.data),
    refetchInterval: 8000,
    staleTime: 6000,
  })

  const transactions = Array.isArray(data) ? data : data?.transactions ?? []

  // Detect new alert after simulation
  useEffect(() => {
    const count = Array.isArray(alerts) ? alerts.length : 0
    if (prevAlertCountRef.current !== null && count > prevAlertCountRef.current && pollTimerRef.current) {
      const newest = alerts[0]
      setToast(newest
        ? `New alert: ${newest.patternType ?? 'Fraud Pattern'} detected`
        : 'New fraud alert detected'
      )
      setTimeout(() => setToast(null), 6000)
    }
    prevAlertCountRef.current = count
  }, [alerts])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(stepTimerRef.current)
    clearInterval(pollTimerRef.current)
  }, [])

  async function handleSimulate() {
    if (isSimulating) return

    setSimStep(1)

    // Step label counter — advances every 2.2s to match backend's 2s gaps
    let step = 1
    stepTimerRef.current = setInterval(() => {
      step += 1
      if (step <= 4) {
        setSimStep(step)
      } else if (step === 5) {
        setSimStep(5)
      } else {
        clearInterval(stepTimerRef.current)
        setSimStep(-1)
        setTimeout(() => setSimStep(0), 3000)
      }
    }, 2200)

    // Fast-poll transactions + alerts for 30s via manual invalidation
    pollTimerRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    }, 2500)
    setTimeout(() => clearInterval(pollTimerRef.current), 30_000)

    try {
      await apiClient.post('/webhooks/squad/simulate')
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
    } catch {
      // silent — demo mode
    }
  }

  function renderButtonLabel() {
    if (simStep >= 1 && simStep <= 4) {
      return (
        <>
          <span className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
          Step {simStep}/4 — {STEP_LABELS[simStep - 1]}
        </>
      )
    }
    if (simStep === 5) {
      return (
        <>
          <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
          Analyzing pattern…
        </>
      )
    }
    if (simStep === -1) {
      return <>✓ Kano Ring Complete</>
    }
    return (
      <>
        <img src="/squad-logo.svg" alt="Squad" className="h-3 w-auto brightness-0 invert opacity-70" />
        Simulate Kano Shell Ring
      </>
    )
  }

  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
      {toast && (
        <div className="px-4 py-2 text-xs font-medium flex items-center gap-2 bg-red-500/10 border-b border-red-500/30 text-red-400">
          <span>🚨</span>
          {toast}
        </div>
      )}

      <div className="px-4 py-3 border-b border-[#2D3748] flex items-center gap-3">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Squad Live Feed</p>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <div className="ml-auto">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-70 max-w-[320px] truncate"
          >
            {renderButtonLabel()}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#2D3748] max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : isError ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-red-400">Feed unavailable. Check connection.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#94A3B8] mb-2">Waiting for Squad transactions.</p>
            <p className="text-xs text-[#4B5563]">Webhook is listening. Click Simulate to test.</p>
          </div>
        ) : (
          transactions.slice(0, 8).map((txn) => {
            const riskScore = parseFloat(txn.risk_score ?? txn.riskScore ?? 0)
            const borderColor = getRiskColor(riskScore)
            const isSquadReal = txn.channel === 'squad' || txn.channel === 'squad_payment'
            const isSquadSim = txn.channel === 'squad_simulate' || txn.channel === 'squad_chain'
            const senderName = txn.from_entity_name ?? txn.fromEntityName ?? txn.fromEntity ?? txn.from_entity ?? txn.id
            const receiverName = txn.to_entity_name ?? txn.toEntityName ?? txn.toEntity ?? txn.to_entity ?? '—'
            const timestamp = txn.date ?? txn.created_at ?? txn.createdAt

            return (
              <div key={txn.id} className={`px-4 py-3 border-l-4 ${borderColor} hover:bg-[#1C2333] transition-colors`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-[#F7F9FC] font-medium truncate">{truncate(senderName, 20)}</span>
                    <span className="text-[#4B5563]">→</span>
                    <span className="text-sm text-[#F7F9FC] truncate">{truncate(receiverName, 20)}</span>
                  </div>
                  {isSquadReal && (
                    <span className="inline-flex items-center px-2 py-1 rounded squad-gradient-bg ml-2 shrink-0">
                      <img src="/squad-logo.svg" alt="Squad" className="h-2.5 w-auto brightness-[100] invert" />
                    </span>
                  )}
                  {isSquadSim && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 ml-2 shrink-0">
                      <img src="/squad-logo.svg" alt="Squad" className="h-2 w-auto brightness-0 invert opacity-60" />
                      <span className="text-[9px] font-bold text-amber-400 tracking-wider">SIM</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00D4AA]">{formatNaira(txn.amount ?? 0)}</span>
                  <span className="text-xs text-[#4B5563]">{getRelativeTime(timestamp)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
