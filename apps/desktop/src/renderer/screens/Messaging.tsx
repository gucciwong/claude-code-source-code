import React, { useEffect, useMemo, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Smartphone, RefreshCw } from 'lucide-react'
import { useMessaging } from '../hooks/useMessaging'
import { useMessagingStore } from '../store/messagingStore'
import {
  PlatformCard,
  PlatformConfigDialog,
  MessageLog,
  CommandReference,
} from '../components/messaging'
import type { IMPlatform, PlatformStatus } from '../../shared/messaging'

const ALL_PLATFORMS: IMPlatform[] = [
  'telegram',
  'slack',
  'discord',
  'feishu',
  'dingtalk',
  'wechat_work',
  'whatsapp',
  'line',
]

export function Messaging() {
  const { listPlatforms, removePlatform, fetchMessageLog } = useMessaging()
  const { platforms, messageLog, isLoading } = useMessagingStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<IMPlatform | null>(null)

  useEffect(() => {
    listPlatforms()
    fetchMessageLog().then(entries => {
      const { addLogEntry } = useMessagingStore.getState()
      entries.forEach(e => addLogEntry(e))
    })
  }, [listPlatforms, fetchMessageLog])

  // Merge all 8 platforms with configured status from the backend
  const allPlatformStatuses: PlatformStatus[] = useMemo(() => {
    const configured = new Map(platforms.map(p => [p.platform, p]))
    return ALL_PLATFORMS.map(platform =>
      configured.get(platform) ?? {
        platform,
        connected: false,
        allowed_user_ids: [],
        enabled: false,
      }
    )
  }, [platforms])

  const handleConfigurePlatform = (platform: string) => {
    setSelectedPlatform(platform as IMPlatform)
    setDialogOpen(true)
  }

  const handleRemovePlatform = async (platform: string) => {
    await removePlatform(platform)
    listPlatforms()
  }

  const webhookBase = 'http://localhost:8010/webhooks'

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Smartphone size={20} aria-hidden="true" className="text-accent-400" />
              <h1 className="text-text-primary text-xl font-semibold">IM Bridge</h1>
            </div>
            <p className="text-text-secondary text-sm">
              Monitor and remote-control Sovereign Code via Telegram, Slack, Discord and more
            </p>
          </div>
          <button
            onClick={() => listPlatforms()}
            disabled={isLoading}
            className="flex items-center gap-2 border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50"
            aria-label="Refresh platform list"
          >
            <RefreshCw
              size={14}
              aria-hidden="true"
              className={isLoading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </div>

      <Tabs.Root defaultValue="platforms" className="flex flex-col flex-1 min-h-0">
        <Tabs.List
          className="flex gap-1 px-6 border-b border-border-subtle bg-bg-surface-1"
          aria-label="IM Bridge tabs"
        >
          {[
            { value: 'platforms', label: 'Platforms' },
            { value: 'log', label: 'Message Log' },
            { value: 'commands', label: 'Commands' },
            { value: 'setup', label: 'Setup Guide' },
          ].map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="px-4 py-3 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-500 -mb-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="platforms" className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {allPlatformStatuses.map(p => (
              <PlatformCard
                key={p.platform}
                platform={p}
                onRemove={handleRemovePlatform}
                onConfigure={handleConfigurePlatform}
              />
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="log" className="flex-1 overflow-y-auto p-6">
          <MessageLog entries={messageLog} />
        </Tabs.Content>

        <Tabs.Content value="commands" className="flex-1 overflow-y-auto p-6">
          <CommandReference />
        </Tabs.Content>

        <Tabs.Content value="setup" className="flex-1 overflow-y-auto p-6">
          <div className="bg-bg-surface-2 border border-border-default rounded-lg p-5 space-y-4">
            <h3 className="text-text-primary text-sm font-semibold">Setup Instructions</h3>
            <p className="text-text-secondary text-sm">
              This service runs locally at{' '}
              <code className="text-accent-400">http://localhost:8010</code>. Configure your IM bot
              to send webhook events to:
            </p>
            <div className="bg-bg-surface-3 rounded-md p-3">
              <code className="text-text-code text-sm">{webhookBase}/&#123;platform&#125;</code>
            </div>
            <ul className="space-y-2 text-text-secondary text-sm list-disc list-inside">
              {ALL_PLATFORMS.map(p => (
                <li key={p}>
                  <span className="text-text-primary font-medium">{p}</span>
                  {' — '}
                  <code className="text-accent-400 text-xs">
                    {webhookBase}/{p}
                  </code>
                </li>
              ))}
            </ul>
            <p className="text-text-muted text-xs">
              For ngrok or public tunneling: expose port 8010 and update your bot webhook URL
              accordingly.
            </p>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <PlatformConfigDialog
        open={dialogOpen}
        platform={selectedPlatform}
        onClose={() => setDialogOpen(false)}
        onSaved={() => listPlatforms()}
      />
    </div>
  )
}
