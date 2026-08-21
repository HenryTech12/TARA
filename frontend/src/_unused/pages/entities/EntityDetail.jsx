import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { EntityProfile } from '@/components/entities/EntityProfile'
import { AlertCard } from '@/components/alerts/AlertCard'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { TransactionList } from '@/components/entities/TransactionList'
import { useEntity } from '@/hooks/useEntities'
import { useAlerts } from '@/hooks/useAlerts'
import { useTransactionsByEntity } from '@/hooks/useTransactions'
import { Spinner } from '@/components/ui/Spinner'
import { EntityTrustScoreCard } from '@/components/entities/EntityTrustScoreCard'
import { formatNairaShort } from '@/utils/formatters'
import { deriveRiskLevel } from '@/utils/risk'

export default function EntityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: entity, isLoading } = useEntity(id)
  const { data: alerts } = useAlerts()
  const { data: transactions, isLoading: txLoading } = useTransactionsByEntity(id)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!entity) return <div className="text-center py-16 text-[#4B5563]">Entity not found</div>

  const linkedAlerts = alerts?.filter((a) =>
    a.entityIds?.includes(id) || a.entityIds?.includes(entity.id)
  ) ?? []

  // Build risk map from alerts so neighbours inherit correct risk level
  const riskScoreByEntityId = new Map()
  ;(alerts ?? []).forEach((alert) => {
    const score = Number.isFinite(alert.riskScore) ? alert.riskScore : 0
    ;(alert.entityIds ?? []).forEach((eid) => {
      const cur = riskScoreByEntityId.get(eid) ?? 0
      if (score > cur) riskScoreByEntityId.set(eid, score)
    })
  })

  // 1-hop graph
  const neighbors = entity.neighbors ?? []
  const hopNodes = [
    { id: entity.id, label: entity.canonicalName, type: entity.entityType, risk: entity.riskLevel },
    ...neighbors.map((n) => {
      const nid = n.entity_id ?? n.entityId
      return {
        id: nid,
        label: n.full_name ?? n.canonicalName ?? nid,
        type: (n.entity_type ?? n.entityType ?? '').toUpperCase(),
        risk: deriveRiskLevel(riskScoreByEntityId.get(nid) ?? 0),
      }
    }),
  ].filter((n) => n.id) // guard against null ids
  const hopLinks = neighbors
    .map((n) => ({ source: entity.id, target: n.entity_id ?? n.entityId, value: parseFloat(n.total_amount ?? n.totalAmount ?? 50) }))
    .filter((l) => l.target)

  const hasTransactions = !txLoading && transactions?.length > 0
  const hasNeighbours  = neighbors.length > 0
  const hasAlerts      = linkedAlerts.length > 0

  const isFrozen = entity.metadata_json?.frozen || entity.metadataJson?.frozen

  return (
    <div className="space-y-4">
      <PageHeader backTo="/entities" title={entity.canonicalName} subtitle={entity.id} />

      {isFrozen && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/40 rounded-lg">
          <span className="text-[10px] font-bold text-red-400 bg-red-500/20 rounded px-2 py-1">FROZEN</span>
          <div>
            <p className="text-sm font-semibold text-red-400">Account Frozen by TARA Compliance</p>
            <p className="text-xs text-[#94A3B8]">
              Frozen {entity.metadata_json?.frozen_at ? new Date(entity.metadata_json.frozen_at).toLocaleString() : ''} · STR {entity.metadata_json?.frozen_str_id?.slice(0, 8)}…
            </p>
          </div>
        </div>
      )}

      <EntityTrustScoreCard entityId={id} />

      {/* Profile + 1-hop network side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        <EntityProfile entity={entity} />

        <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#2D3748] shrink-0 flex items-center justify-between">
            <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">
              1-Hop Network
            </p>
            <span className="text-[10px] font-mono text-[#4B5563]">
              {hopNodes.length - 1} neighbour{hopNodes.length !== 2 ? 's' : ''}
            </span>
          </div>

          {hopNodes.length > 1 ? (
            <GraphCanvas
              nodes={hopNodes}
              links={hopLinks}
              height={260}
              onNodeClick={(n) => n.id !== id && navigate(`/entities/${n.id}`)}
            />
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-[#4B5563]">No connected entities found</p>
            </div>
          )}
        </div>
      </div>

      {/* Counterparties — only when data exists */}
      {hasNeighbours && (
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D3748]">
            <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Transaction Counterparties</p>
          </div>
          <div className="divide-y divide-[#2D3748]">
            {neighbors.slice(0, 8).map((n) => {
              const nid = n.entity_id ?? n.entityId
              return (
                <button
                  key={nid}
                  onClick={() => navigate(`/entities/${nid}`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1C2333] transition-colors text-left"
                >
                  <div className="min-w-0 mr-4">
                    <p className="text-sm text-[#F7F9FC] truncate">{n.full_name ?? n.canonicalName ?? nid}</p>
                    <p className="text-xs text-[#4B5563] font-mono truncate">{nid}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-[#00D4AA]">{formatNairaShort(n.total_amount ?? n.totalAmount ?? 0)}</p>
                    <p className="text-[10px] text-[#4B5563]">{n.transaction_count ?? n.transactionCount ?? 0} txns · {n.relationship}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Transactions — only when data exists or loading */}
      {(txLoading || hasTransactions) && (
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#2D3748] flex items-center justify-between">
            <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Transactions</p>
            {hasTransactions && <span className="text-xs text-[#4B5563]">{transactions.length} records</span>}
          </div>
          <div className="p-2">
            <TransactionList transactions={transactions} isLoading={txLoading} showEntityLinks />
          </div>
        </div>
      )}

      {/* Linked alerts — only when they exist */}
      {hasAlerts && (
        <div>
          <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Linked Alerts</p>
          <div className="space-y-2">
            {linkedAlerts.map((a) => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}
