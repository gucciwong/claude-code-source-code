import React, { useState } from 'react'
import { useVoiceStore } from '../../store/voiceStore'
import { VoicePanel } from '../voice/VoicePanel'
import { VoiceSettings } from '../voice/VoiceSettings'
import { TranscriptionHistory } from '../voice/TranscriptionHistory'

type PanelView = 'main' | 'settings' | 'history'

export const VoicePanelDrawer: React.FC = () => {
  const { isPanelOpen, setPanelOpen } = useVoiceStore()
  const [currentView, setCurrentView] = useState<PanelView>('main')

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
    <div className="absolute right-0 top-0 h-full w-[280px] bg-bg-surface-1 border-l border-border-subtle flex flex-col overflow-hidden z-40 shadow-xl">
      {renderView()}
    </div>
  )
}
