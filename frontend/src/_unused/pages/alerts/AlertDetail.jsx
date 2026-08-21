import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { AlertTimeline } from '@/components/alerts/AlertTimeline'
import { AlertExplainability } from '@/components/alerts/AlertExplainability'
import { useGraphLayout } from '@/components/graph/useGraphLayout'
import { useGraphData } from '@/hooks/useGraphData'
import { useAlert } from '@/hooks/useAlerts'
import { toast } from '@/store/toastStore'
import { agentApi } from '@/api/agent'
import { strApi } from '@/api/str'
import { transactionsApi } from '@/api/transactions'
import { PATTERN_LABELS, formatDateTime, formatNairaShort } from '@/utils/formatters'
import { Spinner } from '@/components/ui/Spinner'

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: alert, isLoading } = useAlert(id)
  const [noteModal, setNoteModal] = useState(false)
  const [dismissModal, setDismissModal] = useState(false)
  const [note, setNote] = useState('')
  const [strLoading, setStrLoading] = useState(false)
  const [agentLoading, setAgentLoading] = useState(false)
  const [reviewerNote, setReviewerNote] = useState('')

  const entityIds = alert?.entityIds ?? []
  const { nodes: rawNodes, links: rawLinks } = useGraphData(entityIds.length ? entityIds : null)
  const { nodes: subNodes, links: subLinks } = useGraphLayout('ALL', { nodes: rawNodes, links: rawLinks })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!alert) return <div className="text-center py-16 text-[#4B5563]">Alert not found</div>

  const handleGenerateSTR = async () => {
    setStrLoading(true)
    try {
      const draft = await strApi.generate(alert.id, null, null, reviewerNote || null)
      toast.success('STR draft generated')
      navigate(`/str/${draft.id}`)
    } catch (err) {
      toast.error('STR generation failed — check Groq API key')
      console.error(err)
    } finally {
      setStrLoading(false)
    }
  }

  const toCsv = (transactions) => {
    const headers = [
      'transaction_id',
      'source_account',
      'destination_account',
      'amount',
      'transaction_date',
      'description',
    ]

    const lines = transactions.map((txn) => {
      const description = (txn.flag || txn.type || '').replaceAll('"', '""')
      return [
        txn.id || '',
        txn.fromEntity || '',
        txn.toEntity || '',
        txn.amount ?? '',
        txn.date || '',
        `"${description}"`,
      ].join(',')
    })

    return [headers.join(','), ...lines].join('\n')
  }

  const handleRunAgentIntake = async () => {
    setAgentLoading(true)
    try {
      const transactions = await transactionsApi.getByAlert(alert.id)
      if (!transactions || transactions.length === 0) {
        toast.info('No transactions found for this alert')
        return
      }

      const period = new Date(alert.detectedAt).toISOString().slice(0, 7)
      const payload = {
        data: toCsv(transactions),
        format: 'csv',
        sensitivity: 'high',
        reason_mode: 'deterministic',
        generate_report: true,
        case_reference: alert.id,
        reporting_period: period,
        source: 'dashboard-alert-detail',
      }

      const result = await agentApi.intake(payload)
      if (result.success) {
        if (result.str_draft_id) {
          toast.success('Agent intake completed and STR draft created')
          navigate(`/str/${result.str_draft_id}`)
          return
        }
        toast.success('Agent intake completed and report generated')
      } else {
        toast.error('Agent intake returned an unsuccessful response')
      }
    } catch (err) {
      console.error(err)
      toast.error('Agent intake failed')
    } finally {
      setAgentLoading(false)
    }
  }

  const handleSaveNote = () => {
    setNoteModal(false)
    setNote('')
    toast.success('Investigation note saved')
  }

  const handleDismiss = () => {
    setDismissModal(false)
    toast.info(`Alert ${alert.id} dismissed`)
    navigate('/alerts')
  }

  const fingerprintHash = alert.subgraphJson?.fingerprint ?? alert.evidenceHash ?? '—'

  return (
    <div>
      <PageHeader
        backTo="/alerts"
        title={`Alert`}
        subtitle={`${alert.id} · Detected ${formatDateTime(alert.detectedAt)} UTC`}
        actions={
          <div className="flex items-center gap-2">
            <RiskBadge level={alert.riskLevel} />
            <StatusBadge status={alert.status} />
          </div>
        }
      />

      {/* Pattern + Score */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#F7F9FC]">
            {PATTERN_LABELS[alert.patternType] ?? alert.patternType}
          </p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{alert.reason}</p>
          <p className="text-xs text-[#4B5563] mt-0.5">{alert.entityIds?.length ?? 0} entities involved</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-red-400">{(alert.riskScore * 100).toFixed(0)}%</p>
          <p className="text-xs text-[#4B5563]">Risk Score</p>
        </div>
      </div>

      {/* AI Explainability */}
      <AlertExplainability alert={alert} />

      {/* Graph + Entity IDs */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-[#2D3748]">
            <p className="text-xs text-[#4B5563] uppercase tracking-wider">Subgraph Visualization</p>
          </div>
          <GraphCanvas
            nodes={subNodes}
            links={subLinks}
            height={300}
            onNodeClick={(n) => navigate(`/entities/${n.id}`)}
          />
        </div>

        <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Involved Entity IDs</p>
          <div className="space-y-1.5 overflow-y-auto max-h-72">
            {entityIds.length > 0 ? entityIds.map((eid) => (
              <button
                key={eid}
                onClick={() => navigate(`/entities/${eid}`)}
                className="block w-full text-left text-xs font-mono text-[#00D4AA] hover:text-white bg-[#1C2333] hover:bg-[#2D3748] px-3 py-1.5 rounded transition-colors truncate"
              >
                {eid}
              </button>
            )) : (
              <p className="text-xs text-[#4B5563]">No entity IDs available</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <AlertTimeline alert={alert} />
      </div>

      {/* Evidence fingerprint */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-3 mb-4">
        <p className="text-[10px] text-[#4B5563] uppercase tracking-wider mb-1">Pattern Fingerprint</p>
        <p className="text-xs text-[#4B5563] font-mono break-all">{fingerprintHash}</p>
      </div>

      {/* STR Generation */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-4 mb-4">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider mb-3">Generate Suspicious Transaction Report</p>
        <textarea
          value={reviewerNote}
          onChange={(e) => setReviewerNote(e.target.value)}
          placeholder="Optional reviewer notes for the AI (e.g. focus areas, context)..."
          rows={2}
          className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md p-3 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 resize-none mb-3"
        />
        <Button variant="primary" onClick={handleGenerateSTR} loading={strLoading}>
          {strLoading ? 'Generating STR…' : 'Generate STR'}
        </Button>
        <Button variant="secondary" onClick={handleRunAgentIntake} loading={agentLoading}>
          {agentLoading ? 'Running Agent Intake…' : 'Run Agent Intake'}
        </Button>
      </div>

      {/* Other Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setNoteModal(true)}>
          Add Note
        </Button>
        <Button variant="danger" onClick={() => setDismissModal(true)}>
          Dismiss Alert
        </Button>
      </div>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add Investigation Note">
        <div className="space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your investigation notes..."
            rows={4}
            className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md p-3 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setNoteModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveNote}>Save Note</Button>
          </div>
        </div>
      </Modal>

      <Modal open={dismissModal} onClose={() => setDismissModal(false)} title="Dismiss Alert">
        <p className="text-sm text-[#94A3B8] mb-4">Are you sure you want to dismiss this alert? This action will be logged in the audit trail.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDismissModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDismiss}>Confirm Dismiss</Button>
        </div>
      </Modal>
    </div>
  )
}
