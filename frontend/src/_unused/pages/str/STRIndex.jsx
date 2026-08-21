import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSTRs } from '@/hooks/useSTR'
import { formatDateTime } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

const columns = [
  {
    accessorKey: 'id',
    header: 'STR ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[#94A3B8] truncate block max-w-[160px]" title={getValue()}>
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: 'alertId',
    header: 'Alert Ref',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[#00D4AA] truncate block max-w-[160px]" title={getValue()}>
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  },
  {
    accessorKey: 'modelVersion',
    header: 'AI Model',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[#94A3B8]">{getValue() ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Generated',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[#94A3B8]">{formatDateTime(getValue())}</span>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[#94A3B8]">{formatDateTime(getValue())}</span>
    ),
  },
]

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED']

export default function STRIndex() {
  const navigate = useNavigate()
  const { data: strs, isLoading, isError } = useSTRs()
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    if (!strs) return []
    if (!statusFilter) return strs
    return strs.filter((s) => s.status === statusFilter)
  }, [strs, statusFilter])

  return (
    <div>
      <PageHeader
        title="STR Reports"
        subtitle={isLoading ? 'Loading…' : `${filtered.length} report${filtered.length !== 1 ? 's' : ''}`}
      />

      <div className="flex flex-wrap gap-3 p-4 bg-[#111827] border border-[#2D3748] rounded-lg mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-1.5 text-sm text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-[#4B5563] self-center">
          {filtered.length} of {strs?.length ?? 0} total
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <ExclamationCircleIcon className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-400">Failed to load STR reports</p>
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          onRowClick={(row) => navigate(`/str/${row.id}`)}
          rowClassName={(row) =>
            row.status === 'PENDING' ? 'border-l-2 border-l-amber-500/50' : undefined
          }
        />
      )}
    </div>
  )
}
