import { useResponsibleAiMetrics } from '../../hooks/useResponsibleAi'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Spinner'
import { Badge } from '../ui/Badge'

export function ResponsibleAiMetrics() {
  const { data: metrics, isLoading, error } = useResponsibleAiMetrics()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Failed to load AI metrics</p>
      </Card>
    )
  }

  const fprPercentage = (metrics.false_positive_rate * 100).toFixed(2)
  const reviewRate = metrics.alerts_raised_total > 0
    ? ((metrics.alerts_reviewed_total / metrics.alerts_raised_total) * 100).toFixed(1)
    : 0

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Responsible AI Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">False Positive Rate</p>
          <p className="text-2xl font-bold">{fprPercentage}%</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Alerts Raised</p>
          <p className="text-2xl font-bold">{metrics.alerts_raised_total}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Alerts Reviewed</p>
          <p className="text-2xl font-bold">{metrics.alerts_reviewed_total}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Review Rate</p>
          <p className="text-2xl font-bold">{reviewRate}%</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Model Contamination</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${metrics.model_contamination * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium">{(metrics.model_contamination * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Model Features</p>
        <div className="flex flex-wrap gap-2">
          {metrics.model_feature_list.map((feature) => (
            <Badge key={feature} variant="secondary">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {metrics.training_data_size > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">Training Data Size</p>
          <p className="text-lg font-semibold">{metrics.training_data_size.toLocaleString()} samples</p>
        </div>
      )}
    </Card>
  )
}
