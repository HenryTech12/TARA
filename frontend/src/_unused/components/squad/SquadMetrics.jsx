import { motion } from 'framer-motion'
import { formatNairaShort } from '@/utils/formatters'

function Tile({ label, value, sub, accent, isSquad }) {
  const border = {
    teal:   'border-l-[#00D4AA]',
    red:    'border-l-red-500',
    amber:  'border-l-amber-500',
    blue:   'border-l-blue-500',
  }[accent] ?? 'border-l-[#2D3748]'

  if (isSquad) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#0D1117] border border-[#FF4C1D]/25 rounded-lg p-4 overflow-hidden"
      >
        {/* Squad gradient left strip */}
        <div className="absolute left-0 inset-y-0 w-0.5 squad-gradient-bg" />
        {/* Subtle gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF4C1D]/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <img src="/squad-logo.svg" alt="Squad" className="h-3 w-auto opacity-80" />
            <p className="text-[10px] text-[#FF6B3D]/70 uppercase tracking-widest font-medium">{label}</p>
          </div>
          <p className="text-2xl font-semibold font-mono text-[#F7F9FC]">{value}</p>
          {sub && <p className="text-xs text-[#4B5563] mt-1">{sub}</p>}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0D1117] border border-[#1E2535] border-l-2 ${border} rounded-lg p-4`}
    >
      <p className="text-[10px] text-[#4B5563] uppercase tracking-widest font-medium mb-2">{label}</p>
      <p className="text-2xl font-semibold font-mono text-[#F7F9FC]">{value}</p>
      {sub && <p className="text-xs text-[#4B5563] mt-1">{sub}</p>}
    </motion.div>
  )
}

export function SquadMetrics({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#0D1117] border border-[#1E2535] rounded-lg p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  const { total, squadCount, squadVolume, totalVolume, highRisk, channelBreakdown } = metrics
  const squadPct = total > 0 ? ((squadCount / total) * 100).toFixed(0) : 0
  const topChannel = Object.entries(channelBreakdown).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Tile
        label="Total Transactions"
        value={total.toLocaleString()}
        sub={`${formatNairaShort(totalVolume)} total volume`}
        accent="teal"
      />
      <Tile
        label="Channel"
        value={squadCount.toLocaleString()}
        sub={`${squadPct}% of all · ${formatNairaShort(squadVolume)}`}
        isSquad
      />
      <Tile
        label="High Risk Flagged"
        value={highRisk.toLocaleString()}
        sub={total > 0 ? `${((highRisk / total) * 100).toFixed(1)}% flag rate` : 'No data'}
        accent={highRisk > 0 ? 'red' : 'teal'}
      />
      <Tile
        label="Top Channel"
        value={topChannel ? topChannel[0].toUpperCase() : '—'}
        sub={topChannel ? `${topChannel[1]} transactions` : 'No data'}
        accent="amber"
      />
    </div>
  )
}
