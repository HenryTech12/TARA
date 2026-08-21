import { useNavigate } from 'react-router-dom'
import { formatDateTime } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export function SquadFilingsPanel({ filings, isLoading }) {
  const navigate = useNavigate()

  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2D3748] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Squad STR Filings</p>
          <CheckCircleIcon className="w-3.5 h-3.5 text-[#00D4AA]" />
        </div>
        <span className="text-xs text-[#4B5563]">{filings?.length ?? 0} filed</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !filings?.length ? (
        <div className="py-10 text-center">
          <p className="text-sm text-[#94A3B8]">No STRs filed via Squad yet</p>
          <p className="text-xs text-[#4B5563] mt-1">Approved STRs will appear here once filed</p>
        </div>
      ) : (
        <div className="divide-y divide-[#2D3748]">
          {filings.map((f) => (
            <button
              key={f.id}
              onClick={() => navigate(`/str/${f.id}`)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1C2333] transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={f.decision?.toUpperCase()} />
                  <span className="text-[10px] text-[#4B5563] font-mono">{formatDateTime(f.createdAt)}</span>
                </div>
                <p className="text-xs text-[#94A3B8] font-mono truncate">
                  Squad Ref: <span className="text-[#00D4AA]">{f.squadRef}</span>
                </p>
                <p className="text-[10px] text-[#4B5563] font-mono truncate mt-0.5">
                  Alert: {f.alertId}
                </p>
              </div>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 text-[#4B5563] shrink-0 ml-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
