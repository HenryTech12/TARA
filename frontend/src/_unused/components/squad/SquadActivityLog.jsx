import { useState, useMemo } from 'react'
import { formatDateTime, formatNairaShort } from '@/utils/formatters'
import { deriveRiskLevel } from '@/utils/risk'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { Spinner } from '@/components/ui/Spinner'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

const CHANNEL_COLORS = {
  transfer: 'bg-[#1C2333] text-[#94A3B8] border-[#2D3748]',
  pos:      'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ussd:     'bg-purple-500/10 text-purple-400 border-purple-500/30',
  mobile:   'bg-pink-500/10 text-pink-400 border-pink-500/30',
  web:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  atm:      'bg-lime-500/10 text-lime-400 border-lime-500/30',
}

function ChannelBadge({ channel }) {
  const ch = (channel ?? 'other').toLowerCase()
  if (ch === 'squad' || ch === 'squad_payment') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded squad-gradient-bg glow-squad">
        <img src="/squad-logo.svg" alt="Squad" className="h-2.5 w-auto brightness-[100] invert" />
      </span>
    )
  }
  const cls = CHANNEL_COLORS[ch] ?? 'bg-[#1C2333] text-[#94A3B8] border-[#2D3748]'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border', cls)}>
      {ch.toUpperCase()}
    </span>
  )
}

function truncate(str, max = 18) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function SquadActivityLog({ transactions, isLoading, onRowClick }) {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const channels = useMemo(() => {
    const s = new Set(transactions.map((t) => (t.channel ?? 'other').toLowerCase()))
    return [...s].sort()
  }, [transactions])

  const filtered = useMemo(() => {
    let rows = [...transactions]

    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((t) =>
        (t.fromEntityName ?? t.fromEntity ?? '').toLowerCase().includes(q) ||
        (t.toEntityName ?? t.toEntity ?? '').toLowerCase().includes(q) ||
        (t.reference ?? '').toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q)
      )
    }
    if (channelFilter) rows = rows.filter((t) => (t.channel ?? '').toLowerCase() === channelFilter)
    if (riskFilter) rows = rows.filter((t) => deriveRiskLevel(t.riskScore) === riskFilter)

    rows.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (sortField === 'amount') { av = a.amount; bv = b.amount }
      if (sortField === 'date') { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime() }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

    return rows
  }, [transactions, search, channelFilter, riskFilter, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-[#2D3748]">↕</span>
    return <span className="text-[#00D4AA]">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-[#2D3748] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <MagnifyingGlassIcon className="w-4 h-4 text-[#4B5563] shrink-0" />
          <input
            type="text"
            placeholder="Search by name, reference, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none w-full font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-3.5 h-3.5 text-[#4B5563]" />
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-[#1C2333] border border-[#2D3748] rounded px-2 py-1 text-xs text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
          >
            <option value="">All Channels</option>
            {channels.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#1C2333] border border-[#2D3748] rounded px-2 py-1 text-xs text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
          >
            <option value="">All Risk</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <span className="text-xs text-[#4B5563] ml-auto">{filtered.length} records</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-[#4B5563] text-sm">No transactions match your filters</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1C2333]">
              <tr>
                {[
                  { label: 'Date', field: 'date' },
                  { label: 'From', field: null },
                  { label: 'To', field: null },
                  { label: 'Amount', field: 'amount' },
                  { label: 'Channel', field: 'channel' },
                  { label: 'Risk', field: 'riskScore' },
                  { label: 'Reference', field: null },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && toggleSort(field)}
                    className={cn(
                      'px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#4B5563] font-medium',
                      field && 'cursor-pointer hover:text-[#F7F9FC] select-none'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]">
              {filtered.map((txn) => {
                const risk = deriveRiskLevel(txn.riskScore)
                const isHighRisk = risk === 'HIGH'
                return (
                  <tr
                    key={txn.id}
                    onClick={() => onRowClick?.(txn)}
                    className={cn(
                      'transition-colors cursor-pointer',
                      isHighRisk
                        ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500/50'
                        : 'bg-[#111827] hover:bg-[#1C2333]'
                    )}
                  >
                    <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs whitespace-nowrap">
                      {formatDateTime(txn.date)}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[140px]">
                      <p className="text-[#F7F9FC] truncate font-medium">
                        {truncate(txn.fromEntityName ?? txn.fromEntity)}
                      </p>
                      <p className="text-[#4B5563] font-mono text-[10px] truncate">{truncate(txn.fromEntity, 14)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[140px]">
                      <p className="text-[#F7F9FC] truncate font-medium">
                        {truncate(txn.toEntityName ?? txn.toEntity)}
                      </p>
                      <p className="text-[#4B5563] font-mono text-[10px] truncate">{truncate(txn.toEntity, 14)}</p>
                    </td>
                    <td className="px-4 py-3 text-[#00D4AA] font-mono text-xs whitespace-nowrap">
                      {formatNairaShort(txn.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <ChannelBadge channel={txn.channel} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={risk} />
                    </td>
                    <td className="px-4 py-3 text-[#4B5563] font-mono text-[10px] max-w-[120px] truncate">
                      {txn.reference ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
