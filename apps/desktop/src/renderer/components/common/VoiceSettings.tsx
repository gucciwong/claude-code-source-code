import React, { useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { useVoiceStore } from '../../store/voiceStore'

/**
 * Voice settings panel for configuring ASR model size, language, and TTS options
 */
export function VoiceSettings() {
  const { settings, updateSettings } = useVoiceStore()

  const handleModelSizeChange = useCallback(
    (value: string) => {
      updateSettings({ modelSize: value as 'base' | 'small' | 'medium' | 'large' })
    },
    [updateSettings],
  )

  const handleLanguageChange = useCallback(
    (value: string) => {
      updateSettings({ language: value as 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' })
    },
    [updateSettings],
  )

  const handleToggleSetting = useCallback(
    (key: 'autoInsert' | 'playTTS' | 'recordAudio', value: boolean) => {
      updateSettings({ [key]: value })
    },
    [updateSettings],
  )

  return (
    <div className="space-y-4 p-4 bg-bg-surface-2 border border-border-default rounded-lg">
      <h3 className="text-sm font-semibold text-text-primary">Voice Settings</h3>

      {/* ASR Model Size */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">Speech Recognition Model</label>
        <div className="relative">
          <select
            value={settings.modelSize}
            onChange={(e) => handleModelSizeChange(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-bg-surface-1 border border-border-default rounded-md text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
          >
            <option value="base">Base (80M) - Fast</option>
            <option value="small">Small (140M) - Balanced</option>
            <option value="medium">Medium (300M) - More Accurate</option>
            <option value="large">Large (700M) - Most Accurate</option>
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
        </div>
        <p className="text-xs text-text-muted">Larger models are slower but more accurate</p>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-secondary">Language</label>
        <div className="relative">
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full appearance-none px-3 py-2 bg-bg-surface-1 border border-border-default rounded-md text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Toggle options */}
      <div className="space-y-2 border-t border-border-subtle pt-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoInsert}
            onChange={(e) => handleToggleSetting('autoInsert', e.target.checked)}
            className="w-4 h-4 rounded border border-border-default bg-bg-surface-1 text-accent-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500"
          />
          <span className="text-sm text-text-secondary">Auto-insert transcription</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.playTTS}
            onChange={(e) => handleToggleSetting('playTTS', e.target.checked)}
            className="w-4 h-4 rounded border border-border-default bg-bg-surface-1 text-accent-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500"
          />
          <span className="text-sm text-text-secondary">Play text-to-speech</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.recordAudio}
            onChange={(e) => handleToggleSetting('recordAudio', e.target.checked)}
            className="w-4 h-4 rounded border border-border-default bg-bg-surface-1 text-accent-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500"
          />
          <span className="text-sm text-text-secondary">Record audio locally</span>
        </label>
      </div>
    </div>
  )
}
