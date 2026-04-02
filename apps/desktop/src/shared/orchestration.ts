export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface TaskSpec {
  id: string
  title: string
  description: string
  dependencies: string[]
  status: TaskStatus
  result?: string
  error?: string
}

export interface OrchestratorSession {
  id: string
  goal: string
  context: string
  tasks: TaskSpec[]
  status: TaskStatus
  created_at: number
  completed_at?: number
  merged_result?: string
}

export interface CreateSessionRequest {
  goal: string
  context: string
}
