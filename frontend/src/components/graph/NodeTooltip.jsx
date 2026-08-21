import { riskNodeColor } from '@/utils/riskColors'
import { verdictLabel } from '@/utils/verdict'

export function NodeTooltip({ node, x, y }) {
  if (!node) return null
  return (
    <div
      className="absolute pointer-events-none bg-[#1C2333] border border-[#2D3748] rounded-lg p-3 text-xs z-10 shadow-xl min-w-36"
      style={{ left: x + 12, top: y - 10 }}
    >
      <p className="text-[#F7F9FC] font-medium mb-0.5">{node.label}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskNodeColor[node.risk] }} />
        <span style={{ color: riskNodeColor[node.risk] }}>
          {node.verdict ? verdictLabel(node.verdict) : 'Verifying…'}
        </span>
      </div>
      <p className="text-[#4B5563] font-mono mt-1">{node.id}</p>
    </div>
  )
}
