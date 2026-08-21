export function GraphControls({ riskFilter, onRiskFilterChange, onReset }) {
  const risks = ['ALL', 'HIGH', 'MEDIUM', 'LOW']
  return (
    <div className="flex items-center gap-3 p-3 bg-[#111827] border-b border-[#2D3748]">
      <span className="text-xs text-[#4B5563] uppercase tracking-wider">Risk Filter:</span>
      <div className="flex gap-1">
        {risks.map((r) => (
          <button
            key={r}
            onClick={() => onRiskFilterChange(r)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              riskFilter === r
                ? 'bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/40'
                : 'bg-[#1C2333] text-[#94A3B8] border border-[#2D3748] hover:text-[#F7F9FC]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        onClick={onReset}
        className="ml-auto px-3 py-1 rounded text-xs text-[#94A3B8] border border-[#2D3748] hover:text-[#F7F9FC] hover:bg-[#1C2333] transition-colors"
      >
        Reset View
      </button>
    </div>
  )
}
