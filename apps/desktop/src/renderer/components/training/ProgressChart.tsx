import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Experiment {
  experiment_id: string
  program_id: string
  run_tag: string
  config: Record<string, unknown>
  status: 'completed' | 'running' | 'failed'
  duration_seconds: number
  created_at: string
  updated_at: string
  metrics: {
    accuracy: number
    f1_score: number
    loss: number
    vram_peak_mb: number
  }
  parent_experiment_id: string | null
}

type MetricType = 'accuracy' | 'loss' | 'f1_score'

interface ProgressChartProps {
  experiments: Experiment[]
  currentRunTag: string
  metric: MetricType
  isLoading?: boolean
}

export function ProgressChart({
  experiments,
  currentRunTag,
  metric,
  isLoading = false,
}: ProgressChartProps) {
  // Filter and sort by run_tag and creation time
  const chartData = useMemo(() => {
    const filtered = experiments
      .filter((exp) => exp.run_tag === currentRunTag)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return filtered.map((exp, index) => ({
      index,
      experiment_id: exp.experiment_id,
      timestamp: new Date(exp.created_at).toLocaleString(),
      accuracy: exp.metrics.accuracy,
      loss: exp.metrics.loss,
      f1_score: exp.metrics.f1_score,
      vram: exp.metrics.vram_peak_mb,
    }))
  }, [experiments, currentRunTag])

  if (isLoading) {
    return (
      <div
        data-testid="chart-skeleton"
        className="w-full h-80 bg-bg-surface-2 rounded-lg animate-pulse"
      />
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-bg-surface-2 rounded-lg text-text-muted">
        <p>No experiments found for this run tag</p>
      </div>
    )
  }

  const metricConfig = {
    accuracy: {
      title: 'Accuracy Over Time, Accuracy Progress',
      label: 'Accuracy',
      color: '#10b981',
      unit: '%',
    },
    loss: {
      title: 'Loss Over Time, Loss Progress',
      label: 'Loss',
      color: '#ef4444',
      unit: '',
    },
    f1_score: {
      title: 'F1 Score Over Time, F1 Score Progress',
      label: 'F1 Score',
      color: '#3b82f6',
      unit: '',
    },
  }

  const config = metricConfig[metric]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-bg-surface-2 border border-border-default rounded p-2 text-sm">
          <p className="text-text-primary font-mono">{data.experiment_id}</p>
          <p className="text-text-secondary">{data.timestamp}</p>
          <p className="text-accent-500 font-semibold">
            {metric}: {payload[0].value.toFixed(4)}
            {config.unit}
          </p>
          <p className="text-text-muted text-xs">VRAM: {(data.vram / 1024).toFixed(1)} GB</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{config.title}</h3>
        <p className="text-sm text-text-muted">Line chart showing progression over experiments</p>
      </div>

      <div className="bg-bg-surface-2 rounded-lg h-80">
        <ResponsiveContainer width="100%" height="100%" className="w-full h-full p-4" data-testid="responsive-container">
          <LineChart data={chartData} data-testid="line-chart" role="img" aria-label={`${config.label} progress chart`}>
            <span data-points={chartData.length} style={{ display: 'none' }} aria-hidden="true" />
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="index"
              label={{ value: 'Experiment', position: 'insideBottomRight', offset: -5 }}
              stroke="#9ca3af"
            />
            <YAxis
              label={{ value: config.label, angle: -90, position: 'insideLeft' }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend data-testid="legend" />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              dot={{ fill: config.color, r: 4 }}
              activeDot={{ r: 6 }}
              name={config.label}
              data-testid={`line-${metric}`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-text-muted">
        <p>Showing {chartData.length} experiments for run: {currentRunTag}</p>
      </div>
    </div>
  )
}
