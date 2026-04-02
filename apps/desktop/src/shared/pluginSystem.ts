export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  hooks: string[]
  enabled: boolean
}

export const BUILTIN_HOOKS = [
  'on_startup',
  'on_chat_message',
  'on_code_review',
  'on_training_complete',
  'on_search_query',
] as const

export type HookName = (typeof BUILTIN_HOOKS)[number]

export interface HookEvent {
  hook: string
  payload: Record<string, unknown>
}
