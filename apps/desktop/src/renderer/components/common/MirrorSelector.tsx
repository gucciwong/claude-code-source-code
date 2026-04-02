import React, { useEffect, useState } from 'react'
import { Globe, AlertCircle } from 'lucide-react'
import { useModelManager, type MirrorConfig } from '../../hooks/useModelManager'

export function MirrorSelector() {
  const { getMirrorInfo, getSwitchMirrorInstructions, loading, error } = useModelManager()
  const [mirrorConfig, setMirrorConfig] = useState<MirrorConfig | null>(null)
  const [switchInstructions, setSwitchInstructions] = useState<string | null>(null)

  useEffect(() => {
    const loadMirrorInfo = async () => {
      const config = await getMirrorInfo()
      if (config) {
        setMirrorConfig(config)
      }
    }
    loadMirrorInfo()
  }, [getMirrorInfo])

  const handleMirrorSwitch = async (mirrorName: string) => {
    const instructions = await getSwitchMirrorInstructions(mirrorName)
    if (instructions) {
      setSwitchInstructions(instructions.instruction)
      // Show copy-to-clipboard toast or notification
    }
  }

  if (!mirrorConfig) {
    return (
      <div className="p-4 bg-bg-surface-2 border border-border-default rounded-lg">
        <div className="flex items-center gap-2 text-text-secondary">
          <Globe size={16} aria-hidden="true" />
          Loading mirror configuration...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Mirror Badge */}
      <div className="p-4 bg-bg-surface-2 border border-border-default rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} aria-hidden="true" />
          <h3 className="text-sm font-medium text-text-primary">Huggingface Mirror</h3>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-3 h-3 rounded-full ${
              mirrorConfig.is_china_mirror ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-sm text-text-secondary">
            {mirrorConfig.current_mirror === 'mirror'
              ? '🇨🇳 China Mirror (hf-mirror.com)'
              : '🌐 Official (huggingface.co)'}
          </span>
        </div>
      </div>

      {/* Mirror Options */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Choose Mirror
        </label>
        <div className="grid grid-cols-2 gap-2">
          {mirrorConfig.available_mirrors.map(mirror => (
            <button
              key={mirror.name}
              onClick={() => handleMirrorSwitch(mirror.name)}
              disabled={loading}
              className={`p-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
                mirrorConfig.current_mirror === mirror.name
                  ? 'bg-accent-500 text-text-primary'
                  : 'bg-bg-surface-2 border border-border-default text-text-secondary hover:bg-bg-surface-3'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-pressed={mirrorConfig.current_mirror === mirror.name}
            >
              {mirror.display}
            </button>
          ))}
        </div>
      </div>

      {/* Switch Instructions */}
      {switchInstructions && (
        <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-md">
          <div className="flex gap-2 mb-2">
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0" aria-hidden="true" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">To switch mirrors, run:</p>
              <code className="block bg-bg-base/50 p-2 rounded font-mono text-xs text-text-code">
                {switchInstructions}
              </code>
              <p className="mt-2 text-blue-200">Then restart the Model Manager service.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-md">
          <p className="text-xs text-red-300">Error: {error}</p>
        </div>
      )}

      {/* Mirror Endpoint Info */}
      <div className="text-xs text-text-muted space-y-1">
        <p>
          <span className="text-text-secondary">Current endpoint: </span>
          <code className="bg-bg-surface-3 px-1 py-0.5 rounded">{mirrorConfig.huggingface_endpoint}</code>
        </p>
        {mirrorConfig.is_china_mirror && (
          <p className="text-yellow-400">💡 Mirror is recommended for faster access in China</p>
        )}
      </div>
    </div>
  )
}
