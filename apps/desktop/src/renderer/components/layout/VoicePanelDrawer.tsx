import React, { useState } from 'react'
import { useVoiceStore } from '../../store/voiceStore'
import { VoicePanel } from '../voice/VoicePanel'
import { VoiceSettings } from '../voice/VoiceSettings'
import { TranscriptionHistory } from '../voice/TranscriptionHistory'
import { useResize } from '../../hooks/useResize'
import { useUILayoutStore } from '../../store/uiLayoutStore'

type PanelView = 'main' | 'settings' | 'history'

interface VoicePanelDrawerProps {
  voicePanelWidth: number
  onVoicePanelWidthChange: (width: number) => void
}

export const VoicePanelDrawer: React.FC<VoicePanelDrawerProps> = ({
  voicePanelWidth,
  onVoicePanelWidthChange,
}) => {
  const { isPanelOpen, setPanelOpen } = useVoiceStore()
  const [currentView, setCurrentView] = useState<PanelView>('main')

  const { containerStyle, onMouseDown } = useResize({
    value: voicePanelWidth,
    min: 220,
    max: 400,
    direction: 'horizontal',
    onValueChange: onVoicePanelWidthChange,
  })

  if (!isPanelOpen) {
    return null
  }

  const renderView = () => {
    switch (currentView) {
      case 'settings':
        return <VoiceSettings onClose={() => setCurrentView('main')} />
      case 'history':
        return <TranscriptionHistory />
      case 'main':
        return (
          <VoicePanel
            onClose={() => setPanelOpen(false)}
            onSettingsClick={() => setCurrentView('settings')}
            onHistoryClick={() => setCurrentView('history')}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div
        onMouseDown={onMouseDown}
        className="w-1 flex-shrink-0 cursor-col-resize hover:bg-accent-500/40 transition-colors bg-transparent"
        role="separator"
        aria-label="Resize voice panel"
        aria-orientation="vertical"
      />
      <div
        className="absolute right-0 top-0 h-full bg-bg-surface-1 border-l border-border-subtle flex flex-col overflow-hidden z-40 shadow-xl"
        style={containerStyle}
      >
        {renderView()}
      </div>
    </>
  )
}
