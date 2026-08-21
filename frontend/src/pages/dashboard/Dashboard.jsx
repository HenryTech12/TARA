import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetricCard } from '@/components/ui/MetricCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { Spinner } from '@/components/ui/Spinner'
import { useIdentityGraph } from '@/hooks/useIdentityGraph'
import { verdictLabel } from '@/utils/verdict'

export default function Dashboard() {
  const navigate = useNavigate()
  const { nodes, verdictById, isLoading, verdictsLoading } = useIdentityGraph()

  const stats = useMemo(() => {
    const evidenceSignals = new Set()
    let underReview = 0
    let verdictsPending = 0
    for (const node of nodes) {
      if (node.verdict === 'REVIEW') underReview += 1
      if (node.verdict === 'REJECT_REVIEW') verdictsPending += 1
    }
    // Every member of a flagged cluster shares the identical evidence_summary
    // string, so deduping evidence text across all verdicts approximates the
    // number of distinct flagged clusters without a backend aggregate endpoint.
    for (const verdict of verdictById.values()) {
      for (const line of verdict.evidence ?? []) evidenceSignals.add(line)
    }
    return {
      identitiesVerified: nodes.length,
      flaggedClusters: evidenceSignals.size,
      underReview,
      verdictsPending,
    }
  }, [nodes, verdictById])

  const flaggedIdentities = useMemo(
    () =>
      nodes
        .filter((n) => n.verdict === 'REVIEW' || n.verdict === 'REJECT_REVIEW')
        .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
        .slice(0, 5),
    [nodes]
  )

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Identity trust overview · Live"
        actions={
          <Button variant="primary" onClick={() => navigate('/graph')}>
            Open Graph Explorer →
          </Button>
        }
      />

      {!isLoading && !verdictsLoading && stats.verdictsPending > 0 && (
        <div className="mb-5 bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <span className="text-red-400 text-lg font-bold">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F7F9FC]">
              {stats.verdictsPending} identity {stats.verdictsPending === 1 ? 'network needs' : 'networks need'} human review
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              TARA is monitoring {stats.identitiesVerified} verified identities in real time
            </p>
          </div>
          <button
            onClick={() => navigate('/graph')}
            className="text-xs text-red-400 border border-red-500/30 rounded-md px-3 py-1.5 hover:bg-red-500/10 transition-colors shrink-0"
          >
            Review in graph →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Identities Verified"
          value={isLoading ? '…' : stats.identitiesVerified}
          note="Live"
          accent="accent"
        />
        <MetricCard
          label="Flagged Clusters"
          value={verdictsLoading ? '…' : stats.flaggedClusters}
          note="Shared-attribute & fragmentation signals"
          accent="high"
        />
        <MetricCard
          label="Identities Under Review"
          value={verdictsLoading ? '…' : stats.underReview}
          note="Amber verdicts"
          accent="medium"
        />
        <MetricCard
          label="Verdicts Pending"
          value={verdictsLoading ? '…' : stats.verdictsPending}
          note="Awaiting human decision"
          accent="high"
        />
      </div>

      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Flagged Identities</p>
          <button onClick={() => navigate('/graph')} className="text-xs text-[#00D4AA] hover:underline">Open graph →</button>
        </div>
        {isLoading || verdictsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : flaggedIdentities.length === 0 ? (
          <p className="text-sm text-[#4B5563] py-4 text-center">No flagged identities — every identity in the graph is independent.</p>
        ) : (
          <div className="divide-y divide-[#2D3748]">
            {flaggedIdentities.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/verdict/${n.id}`)}
                className="w-full flex items-center justify-between py-2.5 hover:bg-[#1C2333] transition-colors text-left px-2 -mx-2 rounded"
              >
                <div className="min-w-0 mr-4">
                  <p className="text-sm text-[#F7F9FC] truncate">{n.label}</p>
                  <p className="text-xs text-[#4B5563] font-mono truncate">{n.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-[#94A3B8]">{Math.round((n.trustScore ?? 0) * 100)}%</span>
                  <RiskBadge level={n.risk} />
                  <span className="text-xs text-[#4B5563]">{verdictLabel(n.verdict)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
