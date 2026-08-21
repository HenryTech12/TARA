const PATTERN_DESCRIPTIONS = {
  shell_director_web: {
    title: 'Shell Director Web',
    summary: 'A single director controls multiple shell companies used to move funds while obscuring ownership.',
    signals: [
      'One individual linked as director to 3+ companies',
      'Companies show no operational transaction history',
      'Rapid fund movement between related accounts',
      'Accounts created within short time window',
    ],
    severity: 'CRITICAL',
    regulatoryRef: 'NFIU Typology T-04: Shell Company Layering',
  },
  layered_transfer_chain: {
    title: 'Layered Transfer Chain',
    summary: 'Funds routed through multiple intermediate accounts within 48 hours to obscure the money trail.',
    signals: [
      'Origin → destination route through 3+ intermediaries',
      'All transfers completed within 48-hour window',
      'Individual transfers below reporting threshold (structuring)',
      'No legitimate business relationship between entities',
    ],
    severity: 'HIGH',
    regulatoryRef: 'NFIU Typology T-07: Layering via Transfer Chains',
  },
  pos_cash_out_ring: {
    title: 'POS Cash-Out Ring',
    summary: 'Coordinated use of POS terminals to convert electronic funds to cash across multiple agents.',
    signals: [
      'Multiple POS terminals involved in coordinated pattern',
      'High-frequency small withdrawals from same source',
      'POS agents geographically dispersed',
      'Cash-out timing correlates across terminals',
    ],
    severity: 'HIGH',
    regulatoryRef: 'NFIU Typology T-12: POS Cash-Out Rings',
  },
}

function SeverityPill({ severity }) {
  const colors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${colors[severity] ?? colors.MEDIUM}`}>
      {severity}
    </span>
  )
}

export function AlertExplainability({ alert }) {
  const pattern = PATTERN_DESCRIPTIONS[alert.patternType] ?? null
  const riskPct = (alert.riskScore * 100).toFixed(1)
  const entityCount = alert.entityIds?.length ?? 0
  const anomalyScore = parseFloat(alert.anomalyScore ?? alert.anomaly_score ?? 0)
  const anomalyFlag = alert.anomalyFlag ?? alert.anomaly_flag ?? false

  // Break the reason into a readable path if it contains entity IDs
  const reasonText = alert.reason ?? ''

  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">TARA AI Reasoning</p>
        {pattern && <SeverityPill severity={pattern.severity} />}
      </div>

      {/* Risk score breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1C2333] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold font-mono text-red-400">{riskPct}%</p>
          <p className="text-[10px] text-[#4B5563] mt-1 uppercase tracking-wider">Network Risk Score</p>
        </div>
        <div className="bg-[#1C2333] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold font-mono text-[#F7F9FC]">{entityCount}</p>
          <p className="text-[10px] text-[#4B5563] mt-1 uppercase tracking-wider">Entities in Ring</p>
        </div>
        <div className={`bg-[#1C2333] rounded-lg p-3 text-center ${anomalyFlag ? 'border border-amber-500/30' : ''}`}>
          <p className={`text-2xl font-bold font-mono ${anomalyFlag ? 'text-amber-400' : 'text-[#94A3B8]'}`}>
            {anomalyFlag ? 'YES' : anomalyScore > 0 ? anomalyScore.toFixed(2) : '—'}
          </p>
          <p className="text-[10px] text-[#4B5563] mt-1 uppercase tracking-wider">Anomaly Flag</p>
        </div>
      </div>

      {/* Pattern explanation */}
      {pattern && (
        <div className="mb-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-2">Why TARA Flagged This</p>
          <p className="text-sm text-[#94A3B8] mb-3">{pattern.summary}</p>
          <div className="space-y-1.5">
            {pattern.signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#00D4AA] text-xs mt-0.5 shrink-0">✓</span>
                <span className="text-xs text-[#94A3B8]">{signal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detection reasoning from backend */}
      {reasonText && (
        <div className="mb-4 bg-[#1C2333] rounded-lg p-3 border-l-2 border-[#00D4AA]">
          <p className="text-[10px] text-[#4B5563] uppercase tracking-wider mb-1.5">Detection Output</p>
          <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">{reasonText}</p>
        </div>
      )}

      {/* Model info */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-[#2D3748]">
        <div>
          <p className="text-[10px] text-[#4B5563] uppercase tracking-wider">Detection Model</p>
          <p className="text-xs text-[#F7F9FC] font-mono mt-0.5">GNN Heuristic + Isolation Forest</p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B5563] uppercase tracking-wider">Model Version</p>
          <p className="text-xs text-[#F7F9FC] font-mono mt-0.5">heuristic_v1</p>
        </div>
        {pattern && (
          <div>
            <p className="text-[10px] text-[#4B5563] uppercase tracking-wider">Regulatory Reference</p>
            <p className="text-xs text-[#00D4AA] font-mono mt-0.5">{pattern.regulatoryRef}</p>
          </div>
        )}
      </div>
    </div>
  )
}
