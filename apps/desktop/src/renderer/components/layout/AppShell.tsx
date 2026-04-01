import React from 'react'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-bg-base text-text-primary overflow-hidden">
      {children}
    </div>
  )
}
