import { cn } from '@/utils/cn'

const config = {
  HIGH:   { label: 'HIGH',   cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  MEDIUM: { label: 'MED',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  LOW:    { label: 'LOW',    cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  NONE:   { label: 'NONE',   cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
}

export function RiskBadge({ level }) {
  const { label, cls } = config[level] ?? config.NONE
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border', cls)}>
      {label}
    </span>
  )
}
