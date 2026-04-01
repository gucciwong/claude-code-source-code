import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { MainContent } from './components/layout/MainContent'
import { useOllamaStatus } from './hooks/useOllamaStatus'

export default function App() {
  useOllamaStatus()
  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
      <CommandPalette />
    </AppShell>
  )
}
