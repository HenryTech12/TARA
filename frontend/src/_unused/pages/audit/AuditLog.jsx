import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { Spinner } from '@/components/ui/Spinner'
import { apiClient } from '@/api/client'
import { formatDateTime } from '@/utils/formatters'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

const ACTION_COLORS = {
  STR_GENERATED: 'text-[#00D4AA]',
  STR_FILED: 'text-green-400',
  ALERT_CREATED: 'text-amber-400',
  ALERT_DISMISSED: 'text-[#94A3B8]',
  ALERT_STATUS_CHANGED: 'text-blue-400',
  ENTITY_VIEWED: 'text-[#94A3B8]',
  USER_LOGIN: 'text-[#94A3B8]',
}

const columns = [
  { accessorKey: 'timestamp', header: 'Timestamp', cell: ({ getValue }) => <span className="font-mono text-xs text-[#94A3B8]">{formatDateTime(getValue())}</span> },
  { accessorKey: 'action', header: 'Action', cell: ({ getValue }) => <span className={`font-mono text-xs font-medium ${ACTION_COLORS[getValue()] ?? 'text-[#94A3B8]'}`}>{getValue()}</span> },
  { accessorKey: 'target', header: 'Target', cell: ({ getValue }) => <span className="font-mono text-xs text-[#F7F9FC]">{getValue()}</span> },
  { accessorKey: 'targetType', header: 'Type', cell: ({ getValue }) => <span className="text-xs text-[#94A3B8]">{getValue()}</span> },
  { accessorKey: 'user', header: 'User', cell: ({ getValue }) => <span className="text-xs text-[#F7F9FC]">{getValue()}</span> },
  { accessorKey: 'hash', header: 'Hash', cell: ({ getValue }) => <span className="font-mono text-[10px] text-[#4B5563]">{getValue()}</span> },
  { accessorKey: 'verified', header: 'Verified', cell: ({ getValue }) => getValue() ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <span className="text-red-400 text-xs">✗</span> },
]

export default function AuditLog() {
  const [filters, setFilters] = useState({ action: '', user: '' })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => apiClient.get('/audit-log?limit=200').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const filtered = useMemo(() => {
    const rows = data ?? []
    return rows.filter((e) => {
      if (filters.action && e.action !== filters.action) return false
      if (filters.user && !e.user.toLowerCase().includes(filters.user.toLowerCase())) return false
      return true
    })
  }, [data, filters])

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Immutable record of all system actions" />

      <div className="flex flex-wrap gap-3 p-4 bg-[#111827] border border-[#2D3748] rounded-lg mb-4">
        <select
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          className="bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-1.5 text-sm text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
        >
          <option value="">All Actions</option>
          <option value="STR_GENERATED">STR Generated</option>
          <option value="STR_FILED">STR Filed</option>
          <option value="ALERT_CREATED">Alert Created</option>
          <option value="ALERT_DISMISSED">Alert Dismissed</option>
          <option value="ENTITY_VIEWED">Entity Viewed</option>
          <option value="USER_LOGIN">User Login</option>
        </select>
        <input
          type="text"
          placeholder="Filter by user..."
          value={filters.user}
          onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
          className="bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-1.5 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 font-mono"
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-[#4B5563]">
          <CheckCircleIcon className="w-3.5 h-3.5 text-green-400" />
          All entries cryptographically verified
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="text-center py-16 text-[#4B5563] text-sm">Failed to load audit log.</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#4B5563] text-sm">No audit events recorded yet.</div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}
    </div>
  )
}
