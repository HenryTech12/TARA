import { RiskBadge } from '@/components/ui/RiskBadge'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/formatters'

export function EntityProfile({ entity }) {
  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#F7F9FC]">{entity.canonicalName}</h2>
          <p className="text-xs text-[#4B5563] font-mono mt-0.5">{entity.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{entity.entityType}</Badge>
          <RiskBadge level={entity.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {entity.bvn && (
          <div>
            <p className="text-[#4B5563] text-xs uppercase tracking-wider mb-1">BVN</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[#F7F9FC] font-mono">{entity.bvn}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-medium">✓ Verified</span>
            </div>
          </div>
        )}
        {entity.nin && (
          <div>
            <p className="text-[#4B5563] text-xs uppercase tracking-wider mb-1">NIN</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[#F7F9FC] font-mono">{entity.nin}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-medium">✓ Verified</span>
            </div>
          </div>
        )}
        {entity.business_reg_no && (
          <div>
            <p className="text-[#4B5563] text-xs uppercase tracking-wider mb-1">CAC Reg No.</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[#F7F9FC] font-mono text-xs">{entity.business_reg_no}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-medium">✓ Registered</span>
            </div>
          </div>
        )}
        {!entity.bvn && !entity.nin && (
          <div className="col-span-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">⚠ Identity documents not verified</span>
          </div>
        )}
        <div>
          <p className="text-[#4B5563] text-xs uppercase tracking-wider mb-1">Risk Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#1C2333] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${entity.riskScore * 100}%`,
                  backgroundColor: entity.riskLevel === 'HIGH' ? '#EF4444' : entity.riskLevel === 'MEDIUM' ? '#F59E0B' : '#22C55E',
                }}
              />
            </div>
            <span className="text-[#F7F9FC] font-mono text-xs">{(entity.riskScore * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div>
          <p className="text-[#4B5563] text-xs uppercase tracking-wider mb-1">Linked Alerts</p>
          <p className="text-[#F7F9FC] font-mono">{entity.linkedAlerts.length}</p>
        </div>
        <div>
          <p className="text-[#4B5563] text-xs uppercase tracking-wider mb-1">First Seen</p>
          <p className="text-[#F7F9FC] font-mono">{formatDate(entity.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}
