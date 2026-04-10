import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { CommandPalette } from './components/CommandPalette'
import { MainContent } from './components/layout/MainContent'
import { VoicePanelDrawer } from './components/layout/VoicePanelDrawer'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ResizeHandle } from './components/common/ResizeHandle'
import { useOllamaStatus } from './hooks/useOllamaStatus'
import { useVoiceService } from './hooks/useVoiceService'
import { useResize } from './hooks/useResize'
import { useUILayoutStore } from './store/uiLayoutStore'

export default function App() {
  useOllamaStatus()
  useVoiceService()

  const sidebarWidth = useUILayoutStore(s => s.sidebarWidth)
  const setSidebarWidth = useUILayoutStore(s => s.setSidebarWidth)
  const voicePanelWidth = useUILayoutStore(s => s.voicePanelWidth)
  const setVoicePanelWidth = useUILayoutStore(s => s.setVoicePanelWidth)

  const { onMouseDown: sidebarOnMouseDown } = useResize({
    value: sidebarWidth,
    min: 160,
    max: 400,
    direction: 'horizontal',
    onValueChange: setSidebarWidth,
  })

  return (
    <AppShell>
      <div className="relative flex flex-1 overflow-hidden">
        <ErrorBoundary label="Sidebar">
          <Sidebar />
        </ErrorBoundary>
        <ResizeHandle
          orientation="vertical"
          ariaLabel="Resize navigation sidebar"
          onMouseDown={sidebarOnMouseDown}
        />
        <ErrorBoundary label="Main content">
          <MainContent />
        </ErrorBoundary>
        <ErrorBoundary label="VoicePanel">
          <VoicePanelDrawer
            voicePanelWidth={voicePanelWidth}
            onVoicePanelWidthChange={setVoicePanelWidth}
          />
        </ErrorBoundary>
      </div>
      <StatusBar />
      <CommandPalette />
    </AppShell>
  )
}
