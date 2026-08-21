import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useVerdict } from '@/hooks/useIdentities'
import { useGraph } from '@/hooks/useGraph'
import { verdictLabel, verdictToRiskLevel } from '@/utils/verdict'
import { riskTextColor, riskBorderColor } from '@/utils/riskColors'

export default function VerdictDetail() {
  const { id } = useParams()
  const { data: verdict, isLoading, isError, error } = useVerdict(id)
  const { data: graphData } = useGraph()

  const identityLabel = graphData?.nodes?.find((n) => n.id === id)?.label ?? id

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-red-400 mb-1">Failed to load verdict</p>
        <p className="text-xs text-[#4B5563] font-mono">{error?.response?.data?.detail ?? error?.message}</p>
      </div>
    )
  }

  const riskLevel = verdictToRiskLevel(verdict.verdict)
  const color = riskTextColor[riskLevel] ?? riskTextColor.NONE
  const border = riskBorderColor[riskLevel.toLowerCase()] ?? riskBorderColor.none

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader backTo="/graph" title="Trust Verdict" subtitle={identityLabel} />

      <Card className="p-8 text-center" style={{ borderColor: border, borderWidth: 2 }}>
        <p
          className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-4"
          style={{ color, backgroundColor: color + '1A', border: `1px solid ${color}80` }}
        >
          {verdictLabel(verdict.verdict)}
        </p>
        <p className="text-6xl font-bold font-mono" style={{ color }}>
          {Math.round(verdict.trust_score * 100)}%
        </p>
        <p className="text-xs text-[#4B5563] mt-2 uppercase tracking-wider">Trust Score</p>
      </Card>

      <Card className="p-5">
        <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium mb-3">Evidence</p>
        {verdict.evidence.length === 0 ? (
          <p className="text-base text-[#94A3B8] leading-relaxed">{verdict.explanation}</p>
        ) : (
          <ul className="space-y-3">
            {verdict.evidence.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-lg text-[#F7F9FC] leading-snug">
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
