import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useJob } from '@/hooks/useJobs'
import { transactionsApi } from '@/api/transactions'
import { toast } from '@/store/toastStore'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Spinner } from '@/components/ui/Spinner'

const CHANNELS = ['pos', 'transfer', 'ussd', 'mobile', 'web', 'squad', 'atm', 'other']

const EMPTY_FORM = {
  source_entity_id: '',
  destination_entity_id: '',
  amount: '',
  currency: 'NGN',
  occurred_at: '',
  reference: '',
  channel: 'transfer',
}

function validate(form) {
  const errors = {}
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!form.source_entity_id) errors.source_entity_id = 'Required'
  else if (!uuidRe.test(form.source_entity_id)) errors.source_entity_id = 'Must be a valid UUID'

  if (!form.destination_entity_id) errors.destination_entity_id = 'Required'
  else if (!uuidRe.test(form.destination_entity_id)) errors.destination_entity_id = 'Must be a valid UUID'

  if (form.source_entity_id && form.destination_entity_id && form.source_entity_id === form.destination_entity_id)
    errors.destination_entity_id = 'Source and destination must differ'

  if (!form.amount) errors.amount = 'Required'
  else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) errors.amount = 'Must be a positive number'

  if (!form.occurred_at) errors.occurred_at = 'Required'

  if (!form.reference.trim()) errors.reference = 'Required'
  else if (form.reference.trim().length < 4) errors.reference = 'Minimum 4 characters'

  return errors
}

function JobPoller({ jobId, onDone }) {
  const { data: job } = useJob(jobId)

  if (!job) return <div className="flex items-center gap-2 text-sm text-[#94A3B8]"><Spinner className="w-4 h-4" /> Checking job status…</div>

  if (job.status === 'completed') {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm text-green-400 font-medium">Ingest completed</p>
          <p className="text-xs text-[#94A3B8]">{job.processed_records ?? 1} record(s) processed</p>
        </div>
        <Button variant="primary" size="sm" className="ml-auto" onClick={onDone}>Done</Button>
      </div>
    )
  }

  if (job.status === 'failed') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <XCircleIcon className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-sm text-red-400 font-medium">Ingest failed</p>
          {job.error_message && <p className="text-xs text-[#94A3B8]">{job.error_message}</p>}
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onDone}>Close</Button>
      </div>
    )
  }

  const pct = job.total_records > 0 ? Math.round((job.processed_records / job.total_records) * 100) : null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
        <Spinner className="w-4 h-4" />
        <span className="capitalize">{job.status}…</span>
        {pct !== null && <span className="ml-auto font-mono text-xs">{pct}%</span>}
      </div>
      {pct !== null && (
        <div className="w-full bg-[#1C2333] rounded-full h-1.5">
          <div className="bg-[#00D4AA] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-xs text-[#4B5563] font-mono">Job ID: {jobId}</p>
    </div>
  )
}

export function IngestTransactionModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [jobId, setJobId] = useState(null)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  const handleClose = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setJobId(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const payload = {
        source_entity_id: form.source_entity_id.trim(),
        destination_entity_id: form.destination_entity_id.trim(),
        amount: Number(form.amount),
        currency: form.currency,
        occurred_at: new Date(form.occurred_at).toISOString(),
        reference: form.reference.trim(),
        channel: form.channel,
      }
      const result = await transactionsApi.ingest(payload)
      setJobId(result.job_id)
      toast.success('Transaction accepted — processing…')
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        const fieldErrors = {}
        detail.forEach(({ loc, msg }) => {
          const field = loc[loc.length - 1]
          fieldErrors[field] = msg
        })
        setErrors(fieldErrors)
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Ingest failed — please try again')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Ingest Transaction" size="md">
      {jobId ? (
        <JobPoller jobId={jobId} onDone={() => { onSuccess?.(); handleClose() }} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Source Entity ID"
            placeholder="UUID of the sending entity"
            value={form.source_entity_id}
            onChange={set('source_entity_id')}
            error={errors.source_entity_id}
          />
          <Input
            label="Destination Entity ID"
            placeholder="UUID of the receiving entity"
            value={form.destination_entity_id}
            onChange={set('destination_entity_id')}
            error={errors.destination_entity_id}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₦)"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 50000"
              value={form.amount}
              onChange={set('amount')}
              error={errors.amount}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Currency</label>
              <select
                value={form.currency}
                onChange={set('currency')}
                className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-2 text-sm text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Occurred At"
              type="datetime-local"
              value={form.occurred_at}
              onChange={set('occurred_at')}
              error={errors.occurred_at}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Channel</label>
              <select
                value={form.channel}
                onChange={set('channel')}
                className="w-full bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-2 text-sm text-[#F7F9FC] focus:outline-none focus:border-[#00D4AA]/50"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Reference"
            placeholder="Unique transaction reference"
            value={form.reference}
            onChange={set('reference')}
            error={errors.reference}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? 'Submitting…' : 'Submit Transaction'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
