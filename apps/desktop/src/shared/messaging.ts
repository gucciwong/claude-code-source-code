export type IMPlatform =
  | 'telegram'
  | 'slack'
  | 'discord'
  | 'feishu'
  | 'dingtalk'
  | 'wechat_work'
  | 'whatsapp'
  | 'line'

export const IM_PLATFORM_LABELS: Record<IMPlatform, string> = {
  telegram: 'Telegram',
  slack: 'Slack',
  discord: 'Discord',
  feishu: 'Feishu / Lark',
  dingtalk: 'DingTalk',
  wechat_work: 'WeChat Work',
  whatsapp: 'WhatsApp Business',
  line: 'LINE',
}

export interface PlatformConfig {
  platform: IMPlatform
  bot_token?: string
  webhook_url?: string
  allowed_user_ids: string[]
  enabled: boolean
}

export interface PlatformStatus extends PlatformConfig {
  connected: boolean
}

export interface MessageLogEntry {
  timestamp: number
  platform: string
  sender_id: string
  command: string
  response: string
  authorized: boolean
}

export interface CommandSpec {
  name: string
  description: string
  usage: string
}

export const AVAILABLE_COMMANDS: CommandSpec[] = [
  { name: 'status', description: 'Get system status', usage: 'status' },
  { name: 'models', description: 'List installed models', usage: 'models' },
  { name: 'metrics', description: 'Get productivity metrics', usage: 'metrics' },
  { name: 'health', description: 'Check all services health', usage: 'health' },
  { name: 'chat', description: 'Chat with AI', usage: 'chat <message>' },
  { name: 'help', description: 'Show available commands', usage: 'help' },
]
