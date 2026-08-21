import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { GraphControls } from '@/components/graph/GraphControls'
import { useGraphLayout } from '@/components/graph/useGraphLayout'
import { useIdentityGraph } from '@/hooks/useIdentityGraph'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { verdictLabel } from '@/utils/verdict'
import { XMarkIcon } from '@heroicons/react/24/outline'

const LEGEND = [
  ['Needs Review', '#EF4444'],
  ['Review', '#F59E0B'],
  ['Approved', '#22C55E'],
  ['Verifying…', '#3B82F6'],
]

export default function GraphExplorer() {
  const navigate = useNavigate()
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [selectedNode, setSelectedNode] = useState(null)
  const [key, setKey] = useState(0)

  const { nodes: rawNodes, links: rawLinks, isLoading, isError, error } = useIdentityGraph()
  const { nodes, links } = useGraphLayout(riskFilter, { nodes: rawNodes, links: rawLinks })

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="px-6 pt-6 pb-0">
        <PageHeader
          title="Graph Explorer"
          subtitle={`${nodes.length} identities · ${links.length} shared-attribute links`}
        />
      </div>

      <GraphControls
        riskFilter={riskFilter}
        onRiskFilterChange={(r) => { setRiskFilter(r); setKey((k) => k + 1) }}
        onReset={() => { setRiskFilter('ALL'); setKey((k) => k + 1) }}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 bg-[#0A0E1A] relative min-h-0">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400">
              <p className="text-sm">Failed to load the identity graph</p>
              <p className="text-xs font-mono text-[#4B5563]">{error?.message}</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#4B5563]">
              <p className="text-sm">No identities in the graph yet</p>
              <p className="text-xs font-mono">Verify an identity to add it</p>
            </div>
          ) : (
            <GraphCanvas
              key={key}
              nodes={nodes}
              links={links}
              onNodeClick={setSelectedNode}
            />
          )}

          <div className="absolute bottom-4 left-4 bg-[#111827]/90 border border-[#2D3748] rounded-lg p-3 flex flex-col gap-1.5">
            {LEGEND.map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: color, backgroundColor: color + '33' }} />
                <span className="text-[10px] text-[#94A3B8] font-mono">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedNode && (
          <div className="w-72 bg-[#111827] border-l border-[#2D3748] p-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#4B5563] uppercase tracking-wider">Node Details</p>
              <button onClick={() => setSelectedNode(null)} className="p-1 rounded text-[#4B5563] hover:text-[#F7F9FC] hover:bg-[#1C2333] transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-base font-semibold text-[#F7F9FC]">{selectedNode.label}</p>
                <p className="text-xs text-[#4B5563] font-mono mt-0.5">{selectedNode.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedNode.verdict ? (
                  <Badge>{verdictLabel(selectedNode.verdict)}</Badge>
                ) : (
                  <Badge>Verifying…</Badge>
                )}
                <RiskBadge level={selectedNode.risk} />
              </div>
              {selectedNode.trustScore !== null && (
                <p className="text-xs text-[#94A3B8]">
                  Trust score: <span className="font-mono text-[#F7F9FC]">{(selectedNode.trustScore * 100).toFixed(0)}%</span>
                </p>
              )}
              <div className="pt-3 border-t border-[#2D3748] flex flex-col gap-2">
                <Button variant="primary" size="sm" className="w-full" onClick={() => navigate(`/identities/${selectedNode.id}`)}>
                  View Identity →
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/verdict/${selectedNode.id}`)}>
                  View Verdict →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
