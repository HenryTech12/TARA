import { useJob } from '@/hooks/useJobs'
import { Spinner } from '@/components/ui/Spinner'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

const STATUS_CONFIG = {
  queued:     { icon: ClockIcon,        color: 'text-amber-400',  label: 'Queued' },
  processing: { icon: Spinner,          color: 'text-[#00D4AA]',  label: 'Processing' },
  completed:  { icon: CheckCircleIcon,  color: 'text-green-400',  label: 'Completed' },
  failed:     { icon: XCircleIcon,      color: 'text-red-400',    label: 'Failed' },
}

export function JobStatus({ jobId }) {
  const { data: job, isLoading } = useJob(jobId)

  if (isLoading || !job) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
        <Spinner className="w-4 h-4" />
        <span>Loading job…</span>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.queued
  const Icon = cfg.icon
  const pct = job.total_records > 0 ? Math.round((job.processed_records / job.total_records) * 100) : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${cfg.color}`} />
        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
        {pct !== null && <span className="ml-auto text-xs font-mono text-[#94A3B8]">{pct}%</span>}
      </div>

      {pct !== null && (
        <div className="w-full bg-[#1C2333] rounded-full h-1.5">
          <div
            className="bg-[#00D4AA] h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {job.total_records > 0 && (
        <p className="text-xs text-[#4B5563]">
          {job.processed_records} / {job.total_records} records
        </p>
      )}

      {job.error_message && (
        <p className="text-xs text-red-400">{job.error_message}</p>
      )}
    </div>
  )
}
