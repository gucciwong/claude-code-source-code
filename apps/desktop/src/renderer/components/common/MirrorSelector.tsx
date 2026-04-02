import React, { useEffect, useState } from 'react'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { Loader2 } from 'lucide-react'
import { useModelManager } from '../../hooks/useModelManager'

const MIRROR_OPTIONS = [
  {
    id: 'huggingface',
    name: 'HuggingFace (Official)',
    description: 'huggingface.co — default, requires VPN in China',
  },
  {
    id: 'hf-mirror',
    name: 'HF-Mirror (China)',
    description: 'hf-mirror.com — fast access from mainland China',
  },
  {
    id: 'modelscope',
    name: 'ModelScope',
    description: 'modelscope.cn — Alibaba open-source model hub',
  },
]

type Status = 'idle' | 'switching' | 'success' | 'error'

export function MirrorSelector() {
  const { getMirrorInfo, getSwitchMirrorInstructions } = useModelManager()
  const [selected, setSelected] = useState<string>('huggingface')
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    getMirrorInfo().then(config => {
      if (config?.current_mirror) {
        setSelected(config.current_mirror)
      }
    })
  }, [getMirrorInfo])

  const handleChange = async (value: string) => {
    if (value === selected) return
    setStatus('switching')
    const result = await getSwitchMirrorInstructions(value)
    if (result !== null) {
      setSelected(value)
      setStatus('success')
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-text-primary text-sm font-medium">HuggingFace Mirror</h3>
        <p className="text-text-secondary text-xs mt-1">
          Select the download mirror for HuggingFace models
        </p>
      </div>

      <RadioGroup.Root
        value={selected}
        onValueChange={handleChange}
        className="flex flex-col gap-2"
        aria-label="HuggingFace mirror selection"
      >
        {MIRROR_OPTIONS.map(option => (
          <RadioGroup.Item
            key={option.id}
            value={option.id}
            aria-label={option.name}
            className={[
              'flex items-center gap-3 p-3 rounded-md border cursor-pointer text-left w-full',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
              'transition-colors',
              selected === option.id
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-border-default hover:border-border-strong',
            ].join(' ')}
          >
            <div
              className={[
                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                selected === option.id ? 'border-accent-500' : 'border-border-default',
              ].join(' ')}
              aria-hidden="true"
            >
              {selected === option.id && (
                <div className="w-2 h-2 rounded-full bg-accent-500" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-text-primary text-sm font-medium">{option.name}</span>
              <span className="text-text-secondary text-xs">{option.description}</span>
            </div>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>

      {status === 'switching' && (
        <div className="mt-3 flex items-center gap-2 text-text-secondary text-sm">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Switching mirror...
        </div>
      )}
      {status === 'success' && (
        <p className="mt-3 text-green-400 text-sm">Mirror updated. Restart may be required.</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-red-400 text-sm">
          Failed to switch mirror. Is the model manager running?
        </p>
      )}
    </div>
  )
}
