import React from 'react'
import { Settings, X } from 'lucide-react'
import { useVoiceStore, type VoiceSettings as VoiceSettingsType } from '../../store/voiceStore'

interface VoiceSettingsProps {
  onClose?: () => void
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onClose }) => {
  const { settings, updateSettings } = useVoiceStore()

  const handleModelSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      modelSize: e.target.value as VoiceSettingsType['modelSize'],
    })
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      language: e.target.value as VoiceSettingsType['language'],
    })
  }

  const handleToggle = (key: 'autoInsert' | 'playTTS' | 'recordAudio') => {
    updateSettings({
      [key]: !settings[key],
    })
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface-1 border-l border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-accent-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text-primary">Voice Settings</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Close settings"
          >
            <X size={16} className="text-text-secondary" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Model Size */}
        <div>
          <label htmlFor="model-size" className="block text-sm font-medium text-text-primary mb-2">
            Model Size
          </label>
          <select
            id="model-size"
            value={settings.modelSize}
            onChange={handleModelSizeChange}
            className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
          >
            <option value="base">Base (330M) - Fast, lower accuracy</option>
            <option value="small">Small (744M) - Balanced</option>
            <option value="medium">Medium (1.5B) - Better accuracy</option>
            <option value="large">Large (3B) - High accuracy, slower</option>
          </select>
          <p className="text-xs text-text-muted mt-1">
            Larger models are more accurate but require more VRAM
          </p>
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-text-primary mb-2">
            Language
          </label>
          <select
            id="language"
            value={settings.language}
            onChange={handleLanguageChange}
            className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese (Simplified)</option>
            <option value="ja">Japanese</option>
          </select>
        </div>

        {/* Recording Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Recording</h4>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.recordAudio}
              onChange={() => handleToggle('recordAudio')}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-text-primary">Record audio locally</span>
          </label>
          <p className="text-xs text-text-muted ml-7">Store transcriptions for reference</p>
        </div>

        {/* Behavior Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Behavior</h4>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoInsert}
              onChange={() => handleToggle('autoInsert')}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-text-primary">Auto-insert transcription</span>
          </label>
          <p className="text-xs text-text-muted ml-7">
            Automatically insert transcribed text into code editor
          </p>

          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={settings.playTTS}
              onChange={() => handleToggle('playTTS')}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-text-primary">Play TTS responses</span>
          </label>
          <p className="text-xs text-text-muted ml-7">
            Read LLM responses aloud (requires TTS model to be loaded)
          </p>
        </div>

        {/* Info Section */}
        <div className="border-t border-border-subtle pt-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">About</h4>
          <p className="text-xs text-text-muted">
            Voice processing runs locally on your machine. No audio is transmitted to external
            services.
          </p>
        </div>
      </div>
    </div>
  )
}
