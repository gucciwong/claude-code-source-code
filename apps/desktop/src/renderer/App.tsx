import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { useOllamaStatus } from './hooks/useOllamaStatus'

export default function App() {
  useOllamaStatus()
  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-bg-base overflow-auto">
          <p className="p-6 text-text-primary">Sovereign Coder — Main Content</p>
        </main>
      </div>
      <StatusBar />
      <CommandPalette />
    </AppShell>
  )
}
