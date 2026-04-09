import React, { useEffect } from 'react'
import { useSystemStore } from '../../store/systemStore'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const uiTemplate = useSystemStore((s) => s.uiTemplate)

  useEffect(() => {
    document.documentElement.dataset.theme = uiTemplate
  }, [uiTemplate])

  return (
    <div className="flex flex-col h-screen bg-bg-base text-text-primary overflow-hidden">
      {children}
    </div>
  )
}
