import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { STREditor } from '@/components/str/STREditor'
import { STRPreview } from '@/components/str/STRPreview'
import { AuditTrail } from '@/components/str/AuditTrail'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSTR } from '@/hooks/useSTR'
import { useAlert } from '@/hooks/useAlerts'
import { entitiesApi } from '@/api/entities'
import { strApi } from '@/api/str'
import { generateSTRPdf } from '@/utils/generateSTRPdf'
import { toast } from '@/store/toastStore'
import { Spinner } from '@/components/ui/Spinner'
import { Download } from 'lucide-react'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function STRDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: str, isLoading, isError } = useSTR(id)
  const { data: alert } = useAlert(str?.alertId)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [enforcement, setEnforcement] = useState(null)

  const entityIds = alert?.entityIds ?? []
  const entityQueries = useQueries({
    queries: entityIds.map((entityId) => ({
      queryKey: ['entity-pdf', entityId],
      queryFn: () => entitiesApi.getById(entityId),
      staleTime: 60_000,
      enabled: Boolean(entityId),
    })),
  })
  const entities = entityQueries.map((q) => q.data).filter(Boolean)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (isError || !str) return (
    <div className="flex flex-col items-center py-16 gap-3">
      <ExclamationCircleIcon className="w-10 h-10 text-red-400" />
      <p className="text-sm text-red-400">STR not found or failed to load</p>
      <button onClick={() => navigate('/str')} className="text-xs text-[#00D4AA] hover:underline">
        ← Back to STR Reports
      </button>
    </div>
  )

  const handleDownloadPDF = () => {
    try {
      const filename = generateSTRPdf({ str, alert, entities })
      toast.success(`Downloaded ${filename}`)
    } catch {
      toast.error('Failed to generate PDF — please try again')
    }
  }

  const handleApprove = async () => {
    setDecisionLoading(true)
    try {
      await strApi.updateDecision(str.id, 'approved')

      let enforcementResult = null
      try {
        const fileResult = await strApi.file(str.id)
        enforcementResult = fileResult?.enforcement ?? null
        if (enforcementResult) setEnforcement(enforcementResult)
      } catch (fileErr) {
        console.error('STR filing/enforcement error:', fileErr?.response?.data ?? fileErr)
        toast.warning('STR approved but enforcement action failed — see console for details')
      }

      await queryClient.invalidateQueries({ queryKey: ['str', id] })
      await queryClient.invalidateQueries({ queryKey: ['strs'] })
      setApproveModal(false)

      const frozenCount = enforcementResult?.frozen_count ?? 0
      if (frozenCount > 0) {
        toast.success(`STR filed — ${frozenCount} account${frozenCount !== 1 ? 's' : ''} frozen & transferred to quarantine`)
      } else {
        toast.success(`STR ${str.id.slice(0, 8)} approved and filed`)
      }
    } catch (err) {
      const detail = err?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Failed to approve STR — please try again')
    } finally {
      setDecisionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setDecisionLoading(true)
    try {
      await strApi.updateDecision(str.id, 'rejected')
      await queryClient.invalidateQueries({ queryKey: ['str', id] })
      await queryClient.invalidateQueries({ queryKey: ['strs'] })
      setRejectModal(false)
      toast.info(`STR ${str.id} rejected`)
      navigate('/str')
    } catch {
      toast.error('Failed to reject STR — please try again')
    } finally {
      setDecisionLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        backTo="/str"
        title={`STR ${str.id.slice(0, 8)}…`}
        subtitle={`Alert: ${str.alertId}`}
      />

      {/* Squad filing banner */}
      {str.squadRef && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold shrink-0">S</span>
          <span className="text-sm text-green-400 font-medium">Filed via Squad</span>
          <span className="text-xs text-[#94A3B8] font-mono truncate">{str.squadRef}</span>
        </div>
      )}

      {/* Enforcement action banner — shown after accounts are frozen */}
      {enforcement && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-red-500/20">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold shrink-0">!</span>
            <span className="text-sm font-semibold text-red-400">Enforcement Executed</span>
            <span className="ml-auto text-xs text-[#94A3B8]">{enforcement.frozen_count} account{enforcement.frozen_count !== 1 ? 's' : ''} frozen · Funds transferred to compliance quarantine</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {enforcement.frozen_entities?.map((e) => (
              <div key={e.entity_id} className="flex items-center gap-2 bg-[#1C2333] rounded-md px-3 py-2">
                <span className="text-[10px] font-bold text-red-400 bg-red-500/20 rounded px-1.5 py-0.5 shrink-0">FROZEN</span>
                <div className="min-w-0">
                  <p className="text-xs text-[#F7F9FC] truncate">{e.name}</p>
                  <p className="text-[10px] text-[#4B5563] font-mono truncate">{e.entity_id}</p>
                </div>
              </div>
            ))}
          </div>
          {enforcement.quarantine_entity_id && (
            <div className="px-4 py-2 bg-[#0D1117] border-t border-red-500/10 flex items-center gap-2">
              <span className="text-[10px] text-[#4B5563]">Quarantine account:</span>
              <span className="text-[10px] text-[#94A3B8] font-mono">{enforcement.quarantine_entity_id}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="space-y-4">
          <STRPreview str={str} />
          <AuditTrail strId={str.id} />
        </div>
        <div className="lg:col-span-2">
          <STREditor content={str.draftContent} readOnly={!str.isPending} />
        </div>
      </div>

      {/* Action bar */}
      {str.isPending ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={decisionLoading}>
            <Download size={16} />
            Download PDF
          </Button>
          <Button variant="primary" onClick={() => setApproveModal(true)} disabled={decisionLoading}>
            Approve
          </Button>
          <Button variant="danger" onClick={() => setRejectModal(true)} disabled={decisionLoading}>
            Reject
          </Button>
        </div>
      ) : str.status === 'APPROVED' ? (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="text-green-400 text-sm font-medium">✓ STR approved</span>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download size={14} />
            Download PDF
          </Button>
          <button onClick={() => navigate('/str')} className="ml-auto text-xs text-[#94A3B8] hover:text-[#F7F9FC]">
            Back to STRs →
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-sm font-medium">✗ STR rejected</span>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download size={14} />
            Download PDF
          </Button>
          <button onClick={() => navigate('/str')} className="ml-auto text-xs text-[#94A3B8] hover:text-[#F7F9FC]">
            Back to STRs →
          </button>
        </div>
      )}

      {/* Approve modal */}
      <Modal open={approveModal} onClose={() => !decisionLoading && setApproveModal(false)} title="Approve STR">
        <p className="text-sm text-[#94A3B8] mb-3">
          You are approving and filing <strong className="text-[#F7F9FC]">{str.id}</strong>. This will:
        </p>
        <ul className="text-sm text-[#94A3B8] space-y-1 mb-4 list-none">
          <li className="flex items-center gap-2"><span className="text-red-400">•</span> Freeze all flagged accounts immediately</li>
          <li className="flex items-center gap-2"><span className="text-amber-400">•</span> Transfer funds to the TARA compliance quarantine account</li>
          <li className="flex items-center gap-2"><span className="text-[#00D4AA]">•</span> Submit this STR to the NFIU audit trail</li>
        </ul>
        {str.payloadHash && (
          <div className="bg-[#1C2333] border border-[#2D3748] rounded-md p-3 mb-4">
            <p className="text-[10px] text-[#4B5563] font-mono break-all">Hash: {str.payloadHash}</p>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setApproveModal(false)} disabled={decisionLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleApprove} loading={decisionLoading}>
            {decisionLoading ? 'Approving…' : 'Confirm Approve'}
          </Button>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={rejectModal} onClose={() => !decisionLoading && setRejectModal(false)} title="Reject STR">
        <p className="text-sm text-[#94A3B8] mb-3">Provide a reason for rejecting this STR draft.</p>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Rejection reason (required)…"
          className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md p-3 text-sm text-[#F7F9FC] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setRejectModal(false)} disabled={decisionLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleReject} loading={decisionLoading}>
            {decisionLoading ? 'Rejecting…' : 'Reject STR'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
