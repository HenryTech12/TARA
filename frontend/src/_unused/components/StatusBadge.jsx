import { cn } from '@/utils/cn'

const config = {
  OPEN:       { label: 'OPEN',       cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  IN_REVIEW:  { label: 'IN REVIEW',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  STR_FILED:  { label: 'STR FILED',  cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  DISMISSED:  { label: 'DISMISSED',  cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  PENDING:    { label: 'PENDING',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  APPROVED:   { label: 'APPROVED',   cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  REJECTED:   { label: 'REJECTED',   cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  FILED:      { label: 'FILED',      cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

export function StatusBadge({ status }) {
  const { label, cls } = config[status] ?? { label: status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border', cls)}>
      {label}
    </span>
  )
}
