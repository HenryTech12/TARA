import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import * as d3 from 'd3'
import { alertsApi } from '@/api/alerts'
import { graphApi } from '@/api/graph'
import { transactionsApi } from '@/api/transactions'
import { entitiesApi } from '@/api/entities'
import { webhooksApi } from '@/api/webhooks'
import { cn } from '@/utils/cn'

// ─── constants ────────────────────────────────────────────────────────────────
const SQUAD_SCRIPT_URL = 'https://checkout.squadco.com/widget/squad.min.js'
const POLL_MS = 2000

const PAYMENTS = [
  { id: 1, name: 'Alpha Remit Ltd',     short: 'Alpha Remit',    amount: 200_000, amountKobo: 20_000_000, email: 'alpha@remit.ng',  publicKey: import.meta.env.VITE_SQUAD_PUBLIC_KEY_1 },
  { id: 2, name: 'Quick Cash Services', short: 'Quick Cash',     amount: 400_000, amountKobo: 40_000_000, email: 'quick@cash.ng',   publicKey: import.meta.env.VITE_SQUAD_PUBLIC_KEY_2 },
  { id: 3, name: 'Shell Co Alpha Ltd',  short: 'Shell Co Alpha', amount: 600_000, amountKobo: 60_000_000, email: 'shell@alpha.ng',  publicKey: import.meta.env.VITE_SQUAD_PUBLIC_KEY_3 },
  { id: 4, name: 'Musa Lawal',          short: 'Musa Lawal',     amount: 800_000, amountKobo: 80_000_000, email: 'musa@lawal.ng',   publicKey: import.meta.env.VITE_SQUAD_PUBLIC_KEY_4 },
]

function fmt(n) {
  return '₦' + n.toLocaleString('en-NG')
}

// ─── progress tracker ─────────────────────────────────────────────────────────
function ProgressTracker({ statuses, activeId }) {
  return (
    <div className="flex items-center gap-0 flex-wrap justify-center mb-8">
      {PAYMENTS.map((p, i) => {
        const st = statuses[p.id] ?? 'idle'
        const isActive = activeId === p.id
        const isDone   = st === 'paid'

        return (
          <div key={p.id} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                isDone
                  ? 'border-[#00D4AA] bg-[#00D4AA]/20'
                  : isActive
                    ? 'border-[#F97316] bg-[#F97316]/10'
                    : 'border-[#2D3748] bg-[#0D1117]',
              )}>
                {isDone && (
                  <span className="text-[#00D4AA] text-xs font-bold">✓</span>
                )}
                {isActive && !isDone && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse" />
                )}
                {!isDone && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#2D3748]" />
                )}
                {/* pulse ring on active */}
                {isActive && !isDone && (
                  <span className="absolute inset-0 rounded-full border-2 border-[#F97316] animate-ping opacity-40" />
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  'text-[10px] font-medium leading-tight max-w-[72px] text-center transition-colors duration-300',
                  isDone   ? 'text-[#00D4AA]' :
                  isActive ? 'text-[#F97316]' :
                             'text-[#4B5563]',
                )}>
                  {p.short}
                </p>
                <p className={cn(
                  'text-[9px] font-mono transition-colors duration-300',
                  isDone   ? 'text-[#00D4AA]/70' :
                  isActive ? 'text-[#F97316]/70' :
                             'text-[#2D3748]',
                )}>
                  {fmt(p.amount)}
                </p>
              </div>
            </div>

            {/* Connector arrow — not after last */}
            {i < PAYMENTS.length - 1 && (
              <div className={cn(
                'flex items-center mx-2 mb-6 transition-colors duration-500',
                statuses[PAYMENTS[i + 1]?.id] === 'paid' || activeId === PAYMENTS[i + 1]?.id
                  ? 'text-[#BE185D]'
                  : 'text-[#2D3748]',
              )}>
                <div className={cn(
                  'h-px w-8 transition-colors duration-500',
                  statuses[PAYMENTS[i + 1]?.id] === 'paid' || activeId === PAYMENTS[i + 1]?.id
                    ? 'bg-[#BE185D]'
                    : 'bg-[#2D3748]',
                )} />
                <span className="text-[10px] -ml-0.5">›</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── mini graph ───────────────────────────────────────────────────────────────
function MiniGraph({ nodes, links, newNodeId }) {
  const svgRef = useRef(null)
  const simRef = useRef(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el || !nodes?.length) return

    const W = el.clientWidth || 600
    const H = 240

    d3.select(el).selectAll('*').remove()

    const nodeData = nodes.map((n) => ({ ...n }))
    const linkData = links.map((l) => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
    }))

    const svg = d3.select(el).attr('width', W).attr('height', H)
    const g   = svg.append('g')

    const defs = svg.append('defs')
    const filt = defs.append('filter').attr('id', 'mg-glow')
    filt.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur')
    const fm = filt.append('feMerge')
    fm.append('feMergeNode').attr('in', 'blur')
    fm.append('feMergeNode').attr('in', 'SourceGraphic')

    if (simRef.current) simRef.current.stop()

    const sim = d3.forceSimulation(nodeData)
      .force('link',    d3.forceLink(linkData).id((d) => d.id).distance(70).strength(0.8))
      .force('charge',  d3.forceManyBody().strength(-140))
      .force('center',  d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(22))
    simRef.current = sim

    const linkSel = g.append('g').selectAll('line').data(linkData).join('line')
      .attr('stroke', '#BE185D')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', 1.5)

    const node = g.append('g').selectAll('g').data(nodeData).join('g')

    node.append('circle')
      .attr('r', (d) => d.id === newNodeId ? 11 : 7)
      .attr('fill', (d) => d.id === newNodeId ? '#F97316' : '#BE185D')
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d) => d.id === newNodeId ? '#F97316' : '#BE185D')
      .attr('stroke-width', (d) => d.id === newNodeId ? 2.5 : 1.5)
      .style('filter', (d) => d.id === newNodeId ? 'url(#mg-glow)' : 'none')

    // expanding pulse ring on newest node
    if (newNodeId) {
      const nn = nodeData.find((n) => n.id === newNodeId)
      if (nn) {
        const pulse = g.append('circle')
          .attr('r', 11).attr('fill', 'none')
          .attr('stroke', '#F97316').attr('stroke-width', 2).attr('opacity', 1)
        sim.on('tick.pulse', () => {
          if (nn.x != null) pulse.attr('cx', nn.x).attr('cy', nn.y)
        })
        pulse.transition().duration(1400).ease(d3.easeCubicOut)
          .attr('r', 32).attr('opacity', 0).remove()
      }
    }

    node.append('text')
      .text((d) => (d.label ?? d.id ?? '').slice(0, 16))
      .attr('x', 14).attr('y', 4)
      .attr('fill', '#94A3B8').attr('font-size', '9px')
      .style('pointer-events', 'none')

    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y)
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    return () => sim.stop()
  }, [nodes, links, newNodeId])

  return (
    <div className="w-full rounded-xl border border-[#1E2535] bg-[#0A0E1A] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1E2535]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
        <span className="text-[10px] font-mono text-[#4B5563] uppercase tracking-widest">
          Live Fraud Network
        </span>
        <span className="ml-auto text-[10px] font-mono text-[#4B5563]">
          {nodes?.length ?? 0} nodes · {links?.length ?? 0} edges
        </span>
      </div>
      {nodes?.length ? (
        <svg ref={svgRef} className="w-full" style={{ height: 240 }} />
      ) : (
        <div className="flex items-center justify-center h-[240px]">
          <p className="text-[11px] font-mono text-[#2D3748] uppercase tracking-widest">
            Awaiting first payment…
          </p>
        </div>
      )}
    </div>
  )
}

// ─── fraud banner ─────────────────────────────────────────────────────────────
function FraudBanner({ alert, onViewReport }) {
  const [flash, setFlash] = useState(true)

  useEffect(() => {
    let count = 0
    const id = setInterval(() => {
      count++
      if (count >= 6) { clearInterval(id); setFlash(false) }
      else setFlash((f) => !f)
    }, 350)
    return () => clearInterval(id)
  }, [])

  const pattern  = alert?.pattern_type ?? alert?.patternType ?? 'Suspicious Pattern'
  const entities = (alert?.entity_ids ?? alert?.entityIds ?? []).length
  const riskScore = alert?.risk_score ?? alert?.riskScore ?? null
  const riskPct  = riskScore != null
    ? `${(parseFloat(riskScore) * 100).toFixed(0)}%` : null

  return (
    <div className={cn(
      'w-full rounded-xl border-2 p-5 mb-6 transition-all duration-200',
      flash
        ? 'border-red-500 bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
        : 'border-red-500/60 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    )}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔴</span>
          <div>
            <p className="text-lg font-bold text-red-400 tracking-wide leading-tight">
              FRAUD RING DETECTED
            </p>
            <p className="text-xs text-red-300/80 mt-1 space-x-2">
              <span>Pattern: <span className="font-semibold text-red-300">{pattern}</span></span>
              {entities > 0 && (
                <span>· <span className="font-semibold">{entities} entities</span> involved</span>
              )}
              {riskPct && (
                <span>· Trust score: <span className="font-semibold text-red-400">{riskPct} risk</span></span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onViewReport}
          className="shrink-0 px-5 py-2 text-sm font-bold rounded-lg bg-red-500 hover:bg-red-400 text-white transition-colors"
        >
          View Full Report →
        </button>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export function SquadLiveTrigger() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [scriptReady,  setScriptReady]  = useState(false)
  const [running,      setRunning]      = useState(false)
  const [statuses,     setStatuses]     = useState({})   // id → 'active' | 'paid'
  const [activeId,     setActiveId]     = useState(null)
  const [fraudAlert,   setFraudAlert]   = useState(null)
  const [graphNodes,   setGraphNodes]   = useState([])
  const [graphLinks,   setGraphLinks]   = useState([])
  const [newNodeId,    setNewNodeId]    = useState(null)

  // Refs that survive re-renders without causing them
  const pollRef       = useRef(null)
  const abortRef      = useRef(false)
  const seenIdsRef    = useRef(new Set())
  // Holds the resolve fn for the current "waiting for onSuccess" promise
  const resolvePayRef = useRef(null)

  // ── load Squad script ────────────────────────────────────────────────────────
  useEffect(() => {
    if (document.querySelector(`script[src="${SQUAD_SCRIPT_URL}"]`)) {
      setScriptReady(true); return
    }
    const s = document.createElement('script')
    s.src = SQUAD_SCRIPT_URL; s.async = true
    s.onload  = () => setScriptReady(true)
    s.onerror = () => setScriptReady(false)
    document.head.appendChild(s)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  // ── refresh graph ────────────────────────────────────────────────────────────
  const refreshGraph = useCallback(async () => {
    try {
      const data  = await graphApi.getFullGraph(500)
      const nodes = data?.nodes ?? data?.vertices ?? []
      const links = data?.links ?? data?.edges ?? []
      if (nodes.length) {
        setGraphNodes(nodes)
        setGraphLinks(links)
        const newest = [...nodes].sort((a, b) =>
          new Date(b.created_at ?? b.createdAt ?? 0) -
          new Date(a.created_at ?? a.createdAt ?? 0)
        )[0]
        if (newest) {
          setNewNodeId(newest.id)
          setTimeout(() => setNewNodeId(null), 2000)
        }
      }
    } catch { /* non-fatal */ }
  }, [])

  // ── fraud detected ───────────────────────────────────────────────────────────
  const handleFraudDetected = useCallback(async (alert) => {
    stopPolling()
    abortRef.current = true
    setRunning(false)
    setActiveId(null)

    let fullAlert = alert
    try {
      const res = await alertsApi.getById(alert.id)
      fullAlert  = res ?? alert
      const entityIds = fullAlert?.entity_ids ?? fullAlert?.entityIds ?? []
      if (entityIds[0]) {
        const risk = await entitiesApi.getRisk(entityIds[0]).catch(() => null)
        if (risk) fullAlert = { ...fullAlert, _trustScore: risk }
      }
    } catch { /* non-fatal */ }

    setFraudAlert(fullAlert)
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  }, [stopPolling, queryClient])

  // ── poll for new alerts ──────────────────────────────────────────────────────
  // Returns a Promise that resolves true if fraud found, false if timed out (30s)
  const pollUntilAlert = useCallback((knownIds) => {
    return new Promise((resolve) => {
      if (abortRef.current) { resolve(false); return }

      const start = Date.now()
      pollRef.current = setInterval(async () => {
        if (abortRef.current) { stopPolling(); resolve(false); return }

        // Stop polling after 8s — no alert means continue to next payment
        if (Date.now() - start > 8_000) { stopPolling(); resolve(false); return }

        try {
          const data   = await alertsApi.getAll(500)
          const alerts = data?.alerts ?? data?.items ?? (Array.isArray(data) ? data : [])
          const found  = alerts.find((a) => !knownIds.has(a.id))
          if (found) {
            seenIdsRef.current.add(found.id)
            stopPolling()
            await handleFraudDetected(found)
            resolve(true)
          }
        } catch { /* non-fatal */ }
      }, POLL_MS)
    })
  }, [stopPolling, handleFraudDetected])

  // ── open one Squad modal, return Promise that resolves on onSuccess ───────────
  const openModal = useCallback((payment) => {
    return new Promise((resolve, reject) => {
      const SquadPay = window.squad
      if (!SquadPay) {
        // Fallback: auto-resolve after 1s (demo without SDK)
        setTimeout(() => resolve(`TARA-FALLBACK-${payment.id}-${Date.now()}`), 1000)
        return
      }

      // Read the key from the payment object — each has its own env var
      const publicKey = payment.publicKey
      if (!publicKey) {
        reject(new Error(`VITE_SQUAD_PUBLIC_KEY_${payment.id} is not set`))
        return
      }

      const txRef = `TARA-RING-${payment.id}-${Date.now()}`

      try {
        const instance = new SquadPay({
          onClose: () => reject(new Error('cancelled')),
          onLoad:  () => {},
          onSuccess: (response) => {
            const ref = response?.transaction_ref ?? response?.transactionRef ?? txRef
            resolve(ref)
          },
          key:             publicKey,
          email:           payment.email,
          amount:          payment.amountKobo,
          currency_code:   'NGN',
          transaction_ref: txRef,
          customer_name:   payment.name,
          metadata: {
            tara_source: 'fraud_ring_demo',
            payment_id:  payment.id,
          },
        })
        instance.setup()
        instance.open()
      } catch (err) {
        reject(err)
      }
    })
  }, [])

  // ── main sequential chain ────────────────────────────────────────────────────
  const handleTrigger = useCallback(async () => {
    if (!scriptReady || running || fraudAlert) return

    setRunning(true)
    abortRef.current = false
    seenIdsRef.current = new Set()

    // Snapshot existing alert IDs before we start
    try {
      const data   = await alertsApi.getAll(500)
      const alerts = data?.alerts ?? data?.items ?? (Array.isArray(data) ? data : [])
      alerts.forEach((a) => seenIdsRef.current.add(a.id))
    } catch { /* non-fatal */ }

    for (const payment of PAYMENTS) {
      if (abortRef.current) break

      // Mark this payment as active
      setActiveId(payment.id)
      setStatuses((prev) => ({ ...prev, [payment.id]: 'active' }))

      try {
        // Wait for the judge to complete this Squad payment
        await openModal(payment)
        // Tell backend to advance the fraud chain by one hop — don't wait for Squad webhooks
        webhooksApi.chainStep({ merchant_name: payment.name, amount_naira: payment.amount }).catch(() => {})
      } catch {
        // Cancelled or error — stop the whole chain
        setRunning(false)
        setActiveId(null)
        setStatuses((prev) => ({ ...prev, [payment.id]: 'idle' }))
        return
      }

      if (abortRef.current) break

      // Mark paid immediately
      setStatuses((prev) => ({ ...prev, [payment.id]: 'paid' }))

      // Parallel: refresh transactions + graph
      await Promise.allSettled([
        transactionsApi.getRecent(50),
        refreshGraph(),
      ])
      queryClient.invalidateQueries({ queryKey: ['transactions', 'recent'] })
      queryClient.invalidateQueries({ queryKey: ['graph'] })

      // Poll for fraud alert — if found, chain stops inside handleFraudDetected
      const fraudFound = await pollUntilAlert(new Set(seenIdsRef.current))
      if (fraudFound || abortRef.current) break
    }

    // All 4 paid with no fraud detected yet — keep polling
    if (!abortRef.current && !fraudAlert) {
      setActiveId(null)
      // Final poll — keep going until alert fires or user navigates away
      pollRef.current = setInterval(async () => {
        if (abortRef.current) { stopPolling(); return }
        try {
          const data   = await alertsApi.getAll(500)
          const alerts = data?.alerts ?? data?.items ?? (Array.isArray(data) ? data : [])
          const found  = alerts.find((a) => !seenIdsRef.current.has(a.id))
          if (found) {
            seenIdsRef.current.add(found.id)
            stopPolling()
            await handleFraudDetected(found)
          }
        } catch { /* non-fatal */ }
      }, POLL_MS)
    }

    setRunning(false)
  }, [scriptReady, running, fraudAlert, openModal, refreshGraph, queryClient, pollUntilAlert, stopPolling, handleFraudDetected])

  // initial graph load + cleanup
  useEffect(() => { refreshGraph() }, [refreshGraph])
  useEffect(() => () => stopPolling(), [stopPolling])

  const fraudDetected = !!fraudAlert
  const allDone = PAYMENTS.every((p) => statuses[p.id] === 'paid')

  return (
    <div className="w-full">

      {/* ── Fraud ring banner ── */}
      {fraudDetected && (
        <FraudBanner alert={fraudAlert} onViewReport={() => navigate('/str')} />
      )}

      {/* ── Label ── */}
      <p className="text-[11px] font-mono text-[#4B5563] uppercase tracking-widest text-center mb-5">
        Watch TARA detect fraud in real time — each payment builds the network
      </p>

      {/* ── Trigger button ── */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Red danger glow ring */}
          {!fraudDetected && !allDone && (
            <span className="absolute inset-0 rounded-xl bg-red-600/30 blur-md animate-pulse pointer-events-none" />
          )}
          <button
            onClick={handleTrigger}
            disabled={running || fraudDetected || allDone || !scriptReady}
            className={cn(
              'relative flex items-center gap-3 px-7 py-3.5 rounded-xl font-bold text-sm',
              'border transition-all duration-200 focus:outline-none',
              'focus:ring-2 focus:ring-red-500/50',
              running || fraudDetected || allDone
                ? 'bg-[#0D1117] border-[#2D3748] text-[#4B5563] cursor-not-allowed opacity-60'
                : 'bg-[#0D1117] border-red-600/60 text-[#F7F9FC] hover:border-red-500 hover:bg-red-950/30',
            )}
          >
            {/* Icon */}
            <span className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg text-base',
              'bg-red-600/20 border border-red-600/40',
              running && 'animate-pulse',
            )}>
              {running ? (
                <svg className="animate-spin w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="text-red-400">⚠</span>
              )}
            </span>

            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-bold tracking-wide">
                {running
                  ? `Processing ${PAYMENTS.find((p) => p.id === activeId)?.name ?? '…'}`
                  : allDone
                    ? 'Sequence Complete'
                    : 'Trigger Fraud Ring'}
              </span>
              <span className="text-[10px] font-normal text-[#94A3B8] tracking-wider">
                {running
                  ? `Payment ${PAYMENTS.findIndex((p) => p.id === activeId) + 1} of 4`
                  : '4 sequential Squad payments · live fraud detection'}
              </span>
            </span>

            {/* Live dot */}
            {!running && !fraudDetected && !allDone && scriptReady && (
              <span className="ml-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-red-400 font-mono">LIVE</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Progress tracker ── */}
      <ProgressTracker statuses={statuses} activeId={activeId} />

      {/* ── Live graph ── */}
      <MiniGraph nodes={graphNodes} links={graphLinks} newNodeId={newNodeId} />

    </div>
  )
}
