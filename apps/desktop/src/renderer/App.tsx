import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { MainContent } from './components/layout/MainContent'
import { VoicePanelDrawer } from './components/layout/VoicePanelDrawer'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useOllamaStatus } from './hooks/useOllamaStatus'
import { useVoiceService } from './hooks/useVoiceService'

export default function App() {
  useOllamaStatus()
  useVoiceService()
  return (
    <AppShell>
      <div className="relative flex flex-1 overflow-hidden">
        <ErrorBoundary label="Sidebar">
          <Sidebar />
        </ErrorBoundary>
        <ErrorBoundary label="Main content">
          <MainContent />
        </ErrorBoundary>
        <ErrorBoundary label="VoicePanel">
          <VoicePanelDrawer />
        </ErrorBoundary>
      </div>
      <StatusBar />
      <CommandPalette />
    </AppShell>
  )
}
