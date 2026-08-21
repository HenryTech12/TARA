import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { formatNairaShort, formatDate } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'

const CHANNEL_COLORS = {
  squad:    '#00D4AA',
  transfer: '#3B82F6',
  pos:      '#F59E0B',
  ussd:     '#8B5CF6',
  mobile:   '#EC4899',
  web:      '#06B6D4',
  atm:      '#84CC16',
  other:    '#6B7280',
}

function channelColor(ch) {
  return CHANNEL_COLORS[(ch ?? '').toLowerCase()] ?? '#6B7280'
}

function buildChannelVolume(transactions) {
  const map = {}
  transactions.forEach((t) => {
    const ch = (t.channel || 'other').toLowerCase()
    map[ch] = (map[ch] ?? 0) + t.amount
  })
  return Object.entries(map)
    .map(([channel, volume]) => ({ channel: channel.toUpperCase(), volume, fill: channelColor(channel) }))
    .sort((a, b) => b.volume - a.volume)
}

function buildTimeSeries(transactions) {
  // Bucket by day
  const map = {}
  transactions.forEach((t) => {
    const day = (t.date ?? '').slice(0, 10)
    if (!day) return
    if (!map[day]) map[day] = { date: day, count: 0, volume: 0 }
    map[day].count += 1
    map[day].volume += t.amount
  })
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
}

const VolumeTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p className="text-[#94A3B8] mb-1">{d.channel}</p>
      <p style={{ color: d.fill }}>{formatNairaShort(d.volume)}</p>
    </div>
  )
}

const TimeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p className="text-[#94A3B8] mb-1">{label}</p>
      <p className="text-[#00D4AA]">{payload[0].value} txns</p>
      <p className="text-[#94A3B8]">{formatNairaShort(payload[1]?.value ?? 0)}</p>
    </div>
  )
}

export function SquadFlowChart({ transactions, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[#111827] border border-[#2D3748] rounded-lg p-5 h-[260px] flex items-center justify-center">
            <Spinner />
          </div>
        ))}
      </div>
    )
  }

  const channelData = buildChannelVolume(transactions)
  const timeData = buildTimeSeries(transactions)

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Volume by channel */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-5">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium mb-4">
          Volume by Channel
        </p>
        {channelData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-[#4B5563] text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={channelData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap="30%">
              <XAxis
                type="number"
                tick={{ fill: '#4B5563', fontSize: 10 }}
                tickFormatter={(v) => formatNairaShort(v)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="channel"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip content={<VolumeTooltip />} />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={12}>
                {channelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Transaction count over time */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-5">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium mb-4">
          Transaction Activity · Last 14 Days
        </p>
        {timeData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-[#4B5563] text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="squadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2333" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4B5563', fontSize: 9 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#4B5563', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<TimeTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#00D4AA"
                strokeWidth={2}
                fill="url(#squadGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
