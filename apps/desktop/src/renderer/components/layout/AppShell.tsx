import React, { useEffect } from 'react'
import { useSystemStore } from '../../store/systemStore'
import { useHealthStore } from '../../store/healthStore'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const uiTemplate = useSystemStore((s) => s.uiTemplate)
  const startHealthPolling = useHealthStore((s) => s.startPolling)
  const stopHealthPolling = useHealthStore((s) => s.stopPolling)

  useEffect(() => {
    document.documentElement.dataset.theme = uiTemplate
  }, [uiTemplate])

  // v1.0 — kick off global health polling once the shell mounts.
  // The 30s interval keeps the StatusBar "Services Online" pill
  // current without flooding the local services. Idempotent: the
  // store guards against double-polling, so opening HealthDashboard
  // doesn't spawn a second loop.
  useEffect(() => {
    startHealthPolling(30000)
    return () => stopHealthPolling()
  }, [startHealthPolling, stopHealthPolling])

  return (
    <div className="flex flex-col h-screen bg-bg-base text-text-primary overflow-hidden">
      {children}
    </div>
  )
}
