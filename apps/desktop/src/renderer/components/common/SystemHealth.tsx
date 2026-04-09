import React, { useState, useEffect } from 'react'
import { Activity, Thermometer, Zap, HardDrive, Cpu, AlertCircle } from 'lucide-react'
import { useSystemStore } from '../../store/systemStore'
import { useModelsStore } from '../../store/modelsStore'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { useHardwareProfile } from '../../hooks/useHardwareProfile'
import { HardwareCompatibilityCard } from './HardwareCompatibilityCard'
import { evaluateHardwareCompatibility } from '../../utils/modelCompatibility'

interface HealthMetric {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  value: string
  icon: React.ReactNode
}

export function SystemHealth() {
  const { gpuTemp, vramUsed, vramTotal, tokensPerSec, activeModel } = useSystemStore()
  const installedModels = useModelsStore(s => s.installed)
  const modelManagerModels = useModelManagerStore(s => s.models)
  const hardwareProfile = useHardwareProfile()
  const [metrics, setMetrics] = useState<HealthMetric[]>([])

  const activeInstalledModel = activeModel ? installedModels.find(model => model.name === activeModel) ?? null : null
  const activeManagedModel = activeModel
    ? modelManagerModels.find(model => model.id === activeModel || model.name === activeModel) ?? null
    : null
  const compatibilityReport = activeInstalledModel
    ? evaluateHardwareCompatibility(hardwareProfile, {
        name: activeInstalledModel.name,
        sizeBytes: activeInstalledModel.size,
        format: activeInstalledModel.details?.format ?? 'gguf',
        parameterText: activeInstalledModel.details?.parameter_size ?? activeInstalledModel.name,
      })
    : activeManagedModel
      ? evaluateHardwareCompatibility(hardwareProfile, {
          name: activeManagedModel.name,
          sizeBytes: activeManagedModel.size_bytes,
          format: activeManagedModel.format,
          parameterText: activeManagedModel.name,
        })
      : null

  useEffect(() => {
    const newMetrics: HealthMetric[] = []

    // GPU Temperature
    const tempStatus =
      gpuTemp == null ? 'healthy' : gpuTemp > 85 ? 'critical' : gpuTemp > 75 ? 'warning' : 'healthy'
    newMetrics.push({
      name: 'GPU Temperature',
      status: tempStatus,
      value: gpuTemp != null ? `${gpuTemp}°C` : 'N/A',
      icon: <Thermometer size={16} aria-hidden="true" />,
    })

    // VRAM Usage
    const vramPercent =
      vramUsed != null && vramTotal != null && vramTotal > 0
        ? (vramUsed / vramTotal) * 100
        : null
    const vramStatus =
      vramPercent == null ? 'healthy' : vramPercent > 90 ? 'critical' : vramPercent > 75 ? 'warning' : 'healthy'
    newMetrics.push({
      name: 'VRAM Usage',
      status: vramStatus,
      value:
        vramUsed != null && vramTotal != null && vramPercent != null
          ? `${vramUsed}/${vramTotal} GB (${Math.round(vramPercent)}%)`
          : 'N/A',
      icon: <HardDrive size={16} aria-hidden="true" />,
    })

    // Inference Performance
    const tokStatus = tokensPerSec != null && tokensPerSec < 10 ? 'warning' : 'healthy'
    newMetrics.push({
      name: 'Inference Speed',
      status: tokStatus,
      value: tokensPerSec != null ? `${tokensPerSec} tok/s` : 'N/A',
      icon: <Zap size={16} aria-hidden="true" />,
    })

    // Model Status
    const modelStatus = activeModel ? 'healthy' : 'warning'
    newMetrics.push({
      name: 'Model Status',
      status: modelStatus,
      value: activeModel ? 'Loaded' : 'No model',
      icon: <Cpu size={16} aria-hidden="true" />,
    })

    setMetrics(newMetrics)
  }, [gpuTemp, vramUsed, vramTotal, tokensPerSec, activeModel])

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500'
      case 'critical':
        return 'bg-red-500/10 border-red-500'
      default:
        return 'bg-bg-surface-2 border-border-default'
    }
  }

  const statusTextColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'critical':
        return 'text-red-400'
      default:
        return 'text-text-secondary'
    }
  }

  const criticalCount = metrics.filter(m => m.status === 'critical').length
  const warningCount = metrics.filter(m => m.status === 'warning').length

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Activity size={20} aria-hidden="true" />
          System Health
        </h3>
        {(criticalCount > 0 || warningCount > 0) && (
          <div className="text-xs flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                {warningCount} warning
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`border-l-4 rounded-md p-4 ${statusColor(metric.status)}`}
            role="status"
            aria-label={`${metric.name}: ${metric.value}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                {metric.icon}
                {metric.name}
              </h4>
              <span className={`text-xs font-semibold ${statusTextColor(metric.status)}`}>
                {metric.status === 'healthy' ? '✓ OK' : metric.status === 'warning' ? '⚠ Warning' : '⚠ Critical'}
              </span>
            </div>
            <p className="text-lg font-mono text-text-primary">{metric.value}</p>
          </div>
        ))}
      </div>

      {criticalCount > 0 && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500 rounded-md flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-red-300">
            <p className="font-semibold mb-1">System Issues Detected</p>
            <p>Please check your GPU temperature and VRAM usage. Consider reducing model size or context length.</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <HardwareCompatibilityCard
          report={compatibilityReport}
          title="Hardware Fit"
          emptyState="Load a model to compare local CPU, RAM, GPU, VRAM, and storage headroom."
        />
      </div>
    </div>
  )
}
