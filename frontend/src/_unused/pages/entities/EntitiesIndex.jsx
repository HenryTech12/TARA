import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useEntities, useEntitySearch } from '@/hooks/useEntities'
import { formatDate } from '@/utils/formatters'

const columns = [
  { accessorKey: 'id', header: 'Entity ID', cell: ({ getValue }) => <span className="font-mono text-xs text-[#94A3B8]">{getValue()}</span> },
  {
    accessorKey: 'canonicalName',
    header: 'Name',
    cell: ({ getValue, row }) => {
      const frozen = row.original.metadata_json?.frozen || row.original.metadataJson?.frozen
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#F7F9FC] font-medium">{getValue()}</span>
          {frozen && <span className="text-[10px] font-bold text-red-400 bg-red-500/20 rounded px-1.5 py-0.5 shrink-0">FROZEN</span>}
        </div>
      )
    },
  },
  { accessorKey: 'entityType', header: 'Type', cell: ({ getValue }) => <Badge>{getValue()}</Badge> },
  { accessorKey: 'bvn', header: 'BVN', cell: ({ getValue }) => <span className="font-mono text-xs text-[#94A3B8]">{getValue() ?? '—'}</span> },
  { accessorKey: 'address', header: 'Address', cell: ({ getValue }) => <span className="text-xs text-[#94A3B8] truncate max-w-xs block">{getValue() ?? '—'}</span> },
  { accessorKey: 'createdAt', header: 'First Seen', cell: ({ getValue }) => <span className="font-mono text-xs text-[#94A3B8]">{formatDate(getValue())}</span> },
]

export default function EntitiesIndex() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('q') ?? '')
  const [typeFilter, setTypeFilter] = useState('')

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const isSearching = debouncedSearch.length >= 2

  const { data: allEntities, isLoading: loadingAll } = useEntities()
  const { data: searchResults, isLoading: loadingSearch } = useEntitySearch(debouncedSearch)

  const entities = isSearching ? (searchResults ?? []) : (allEntities ?? [])
  const isLoading = isSearching ? loadingSearch : loadingAll

  const filtered = useMemo(() => {
    if (!typeFilter) return entities
    return entities.filter((e) => e.entityType === typeFilter)
  }, [entities, typeFilter])

  return (
    <div>
      <PageHeader title="Entities" subtitle={`${filtered.length} entities${isSearching ? ' matching search' : ''}`} />

      <div className="flex flex-wrap gap-3 p-4 bg-[#111827] border border-[#2D3748] rounded-lg mb-4">
        <input
          type="text"
          placeholder="Search by name, BVN, NIN, or company reg..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-1.5 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 font-mono flex-1 min-w-48"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-1.5 text-sm text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
        >
          <option value="">All Types</option>
          <option value="PERSON">Person</option>
          <option value="BUSINESS">Business</option>
          <option value="ACCOUNT">Account</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 && isSearching ? (
        <div className="text-center py-16 text-[#4B5563] text-sm">No entities found for &quot;{debouncedSearch}&quot;</div>
      ) : (
        <DataTable data={filtered} columns={columns} onRowClick={(row) => navigate(`/entities/${row.id}`)} />
      )}
    </div>
  )
}
