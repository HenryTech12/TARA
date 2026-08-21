import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useVerifyIdentity } from '@/hooks/useIdentities'
import { getDeviceId } from '@/utils/deviceId'

const EMPTY_FORM = {
  full_name: '',
  id_type: 'bvn',
  id_number: '',
  address: '',
  employer: '',
}

const ID_TYPE_LABELS = { bvn: 'BVN', nin: 'NIN' }

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'Required'
  if (!form.id_number.trim()) errors.id_number = 'Required'
  else if (!/^\d{11}$/.test(form.id_number.trim())) {
    errors.id_number = `${ID_TYPE_LABELS[form.id_type]} must be 11 digits`
  }
  return errors
}

// Splits "Adaeze N. Nwankwo" -> first_name "Adaeze N.", last_name "Nwankwo" —
// the backend rejoins these with a single space, so this round-trips exactly.
function splitName(fullName) {
  const trimmed = fullName.trim()
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) return { first_name: trimmed, last_name: '' }
  return { first_name: trimmed.slice(0, lastSpace), last_name: trimmed.slice(lastSpace + 1) }
}

export default function VerifyIdentity() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [showRaw, setShowRaw] = useState(true)
  const [deviceId, setDeviceId] = useState(null)
  const verifyMutation = useVerifyIdentity()

  useEffect(() => {
    getDeviceId().then(setDeviceId)
  }, [])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
  }

  const setIdType = (id_type) => () => {
    setForm((f) => ({ ...f, id_type }))
    if (errors.id_number) setErrors((err) => ({ ...err, id_number: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    const { first_name, last_name } = splitName(form.full_name)
    try {
      const data = await verifyMutation.mutateAsync({
        [form.id_type]: form.id_number.trim(),
        first_name,
        last_name,
        device_id: deviceId ?? undefined,
        address: form.address.trim() || undefined,
        employer: form.employer.trim() || undefined,
      })
      setResult(data)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setResult({ status: 'error', reason: typeof detail === 'string' ? detail : 'Verification request failed' })
    }
  }

  const handleReset = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setResult(null)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Verify Identity" subtitle="Runs a live QoreID verification and adds the identity to the graph" />

      <Card className="p-5">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Kosisochukwu Nwachukwu"
            value={form.full_name}
            onChange={set('full_name')}
            error={errors.full_name}
            disabled={verifyMutation.isPending}
          />
          <div>
            <label className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">ID Type</label>
            <div className="flex gap-2 mt-1.5 mb-3">
              {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={setIdType(value)}
                  disabled={verifyMutation.isPending}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    form.id_type === value
                      ? 'bg-[#00D4AA]/10 border-[#00D4AA]/50 text-[#00D4AA]'
                      : 'bg-[#1C2333] border-[#2D3748] text-[#94A3B8] hover:text-[#F7F9FC]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Input
              label={ID_TYPE_LABELS[form.id_type]}
              placeholder={`11-digit ${form.id_type === 'bvn' ? 'Bank Verification Number' : 'National Identity Number'}`}
              value={form.id_number}
              onChange={set('id_number')}
              error={errors.id_number}
              disabled={verifyMutation.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Device ID (auto-detected)"
              value={deviceId ?? 'Detecting…'}
              readOnly
              className="text-[#94A3B8] cursor-not-allowed"
            />
            <Input
              label="Employer"
              placeholder="e.g. Zenta Logistics Ltd"
              value={form.employer}
              onChange={set('employer')}
              disabled={verifyMutation.isPending}
            />
          </div>
          <Input
            label="Address"
            placeholder="e.g. 14 Allen Ave, Ikeja"
            value={form.address}
            onChange={set('address')}
            disabled={verifyMutation.isPending}
          />

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={verifyMutation.isPending}>
              Reset
            </Button>
            <Button type="submit" variant="primary" loading={verifyMutation.isPending} disabled={!deviceId}>
              {verifyMutation.isPending ? 'Verifying…' : 'Verify Identity'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card className="p-5 mt-4">
          {result.status === 'verified' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-green-400 text-sm font-medium">✓ Verified via QoreID</span>
                <span className="text-xs text-[#4B5563] font-mono ml-auto">{result.identity_id}</span>
              </div>

              <div>
                <button
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-xs text-[#00D4AA] hover:underline mb-2"
                >
                  {showRaw ? 'Hide' : 'Show'} raw QoreID response
                </button>
                {showRaw && (
                  <pre className="bg-[#0A0E1A] border border-[#2D3748] rounded-md p-3 text-[11px] text-[#94A3B8] font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(result.qoreid_raw, null, 2)}
                  </pre>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => navigate(`/identities/${result.identity_id}`)}>
                  View Identity →
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/verdict/${result.identity_id}`)}>
                  View Verdict →
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={handleReset}>
                  Verify Another
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-red-400 text-sm font-medium">
                ✗ {result.status === 'rejected' ? 'Identity not verified' : 'Request failed'}
              </span>
              <span className="text-xs text-[#94A3B8] ml-auto">{result.reason}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
