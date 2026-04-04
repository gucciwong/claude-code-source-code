import React, { useEffect } from 'react'
import { useHealthStore, ServiceHealth } from '../store/healthStore'
import { Activity, RefreshCw, CheckCircle, XCircle, HelpCircle } from 'lucide-react'

function StatusIcon({ status }: { status: ServiceHealth['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'unhealthy':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <HelpCircle className="h-5 w-5 text-gray-400" />
  }
}

export default function HealthDashboard() {
  const { services, polling, checkAll, startPolling, stopPolling } = useHealthStore()

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  const healthyCount = services.filter(s => s.status === 'healthy').length

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Service Health</h1>
            <span className="text-sm text-gray-500">
              {healthyCount}/{services.length} healthy
            </span>
          </div>
          <button
            onClick={checkAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Refresh health checks"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid gap-4">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={svc.status} />
                <div>
                  <h3 className="font-medium">{svc.name}</h3>
                  <p className="text-sm text-gray-500">{svc.url}</p>
                </div>
              </div>
              <div className="text-right">
                {svc.latencyMs !== null && (
                  <p className="text-sm font-mono">
                    {svc.latencyMs}ms
                  </p>
                )}
                {svc.error && (
                  <p className="text-sm text-red-500">{svc.error}</p>
                )}
                {svc.lastChecked && (
                  <p className="text-xs text-gray-400">
                    {svc.lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {!polling && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            Polling stopped. Click Refresh to check again.
          </p>
        )}
      </div>
    </div>
  )
}
