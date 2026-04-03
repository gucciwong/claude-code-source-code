import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { IMPlatform, PlatformConfig } from '../../../shared/messaging'
import { IM_PLATFORM_LABELS } from '../../../shared/messaging'
import { useMessaging } from '../../hooks/useMessaging'

interface PlatformConfigDialogProps {
  open: boolean
  platform: IMPlatform | null
  onClose: () => void
  onSaved: () => void
}

export function PlatformConfigDialog({
  open,
  platform,
  onClose,
  onSaved,
}: PlatformConfigDialogProps) {
  const [botToken, setBotToken] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [allowedIds, setAllowedIds] = useState('')
  const { configurePlatform } = useMessaging()

  const label = platform ? (IM_PLATFORM_LABELS[platform] ?? platform) : ''

  const handleSave = async () => {
    if (!platform) return
    const config: PlatformConfig = {
      platform,
      bot_token: botToken || undefined,
      webhook_url: webhookUrl || undefined,
      allowed_user_ids: allowedIds
        .split(',')
        .map(id => id.trim())
        .filter(Boolean),
      enabled: true,
    }
    const ok = await configurePlatform(config)
    if (ok) {
      onSaved()
      onClose()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          aria-labelledby="config-dialog-title"
        >
          <div className="bg-bg-surface-2 border border-border-default rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title
                id="config-dialog-title"
                className="text-text-primary text-lg font-semibold"
              >
                Configure {label}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  aria-label="Close dialog"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="bot-token"
                  className="block text-text-secondary text-xs font-medium mb-1"
                >
                  Bot Token (optional)
                </label>
                <input
                  id="bot-token"
                  type="password"
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  placeholder="Enter bot token…"
                  className="w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label
                  htmlFor="webhook-url"
                  className="block text-text-secondary text-xs font-medium mb-1"
                >
                  Outbound Webhook URL (optional)
                </label>
                <input
                  id="webhook-url"
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label
                  htmlFor="allowed-ids"
                  className="block text-text-secondary text-xs font-medium mb-1"
                >
                  Authorized User IDs (comma-separated, leave blank for open access)
                </label>
                <input
                  id="allowed-ids"
                  type="text"
                  value={allowedIds}
                  onChange={e => setAllowedIds(e.target.value)}
                  placeholder="user123, user456"
                  className="w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-4 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-accent-500 hover:bg-accent-400 text-text-primary rounded-md px-4 py-2 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                Save
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
