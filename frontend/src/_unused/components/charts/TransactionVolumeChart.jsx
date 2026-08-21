import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAlerts } from '@/hooks/useAlerts'
import { useSTRs } from '@/hooks/useSTR'
import { Spinner } from '@/components/ui/Spinner'

const STATUS_COLORS = {
  open: '#ef4444',
  generated: '#f59e0b',
  approved: '#22c55e',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs">
      <p style={{ color: payload[0].payload.fill }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

export function TransactionVolumeChart() {
  const { data: alerts, isLoading: alertsLoading } = useAlerts()
  const { data: strs, isLoading: strsLoading } = useSTRs()

  const isLoading = alertsLoading || strsLoading

  if (isLoading) {
    return <div className="flex justify-center items-center h-[200px]"><Spinner /></div>
  }
  if (!alerts?.length) {
    return <div className="flex justify-center items-center h-[200px] text-[#4B5563] text-sm">No alerts detected yet</div>
  }

  const openCount = (alerts ?? []).filter((a) => a.status === 'OPEN').length
  const strCount = strs?.length ?? 0
  const approvedCount = (strs ?? []).filter((s) => s.decision === 'approved').length
  const total = alerts.length

  const data = [
    { key: 'open', name: 'Open', value: openCount, fill: STATUS_COLORS.open },
    { key: 'generated', name: 'STR Generated', value: strCount, fill: STATUS_COLORS.generated },
    { key: 'approved', name: 'Approved', value: approvedCount, fill: STATUS_COLORS.approved },
  ]
  const pieData = data.filter((d) => d.value > 0)

  return (
    <div className="h-[250px] grid grid-cols-[minmax(0,1fr)_156px] gap-3 items-center">
      <div className="relative h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={4}
              dataKey="value"
              stroke="#0B1220"
              strokeWidth={2}
            >
              {pieData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} fillOpacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold font-mono text-[#F7F9FC] leading-none">{total}</span>
          <span className="text-[11px] text-[#4B5563] mt-1 tracking-wide uppercase">Alerts</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.key} className="rounded-md border border-[#2D3748] bg-[#1C2333]/45 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-2 text-[#94A3B8]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.name}
              </span>
              <span className="font-mono text-[#F7F9FC]">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
