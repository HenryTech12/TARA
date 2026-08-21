import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/formatters'

function Field({ label, value, mono = true }) {
  return (
    <div>
      <p className="text-[10px] text-[#4B5563] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-[#F7F9FC] break-all ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

export function STRPreview({ str }) {
  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[#4B5563] uppercase tracking-wider">Report Info</span>
        <StatusBadge status={str.status} />
      </div>

      <div className="space-y-3">
        <Field label="Report ID" value={str.id} />
        <Field label="Alert Reference" value={str.alertId} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Provider" value={str.provider} />
          <Field label="Model" value={str.modelName} />
        </div>

        <Field label="Model Version" value={str.modelVersion} />
        <Field label="Generated" value={formatDateTime(str.createdAt)} />

        {str.reviewerNotes && (
          <div>
            <p className="text-[10px] text-[#4B5563] uppercase tracking-wider mb-0.5">Reviewer Notes</p>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{str.reviewerNotes}</p>
          </div>
        )}

        {str.payloadHash && (
          <div>
            <p className="text-[10px] text-[#4B5563] uppercase tracking-wider mb-0.5">Payload Hash</p>
            <p className="text-[10px] text-[#4B5563] font-mono break-all">{str.payloadHash}</p>
          </div>
        )}

        {str.squadRef && (
          <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold shrink-0">S</span>
            <div className="min-w-0">
              <p className="text-[10px] text-blue-400 font-medium">Filed via Squad</p>
              <p className="text-[10px] text-[#4B5563] font-mono truncate">{str.squadRef}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
