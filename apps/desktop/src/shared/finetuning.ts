export interface FinetuneConfig {
  base_model: string
  dataset_path: string
  learning_rate: number
  epochs: number
  batch_size: number
  lora_rank: number
  output_dir: string
}

export interface FinetuneJob {
  job_id: string
  config: Partial<FinetuneConfig>
  status: 'queued' | 'running' | 'complete' | 'failed' | 'stopped'
  progress: number
  current_epoch: number
  total_epochs: number
  loss_history: number[]
  created_at: string
  completed_at: string | null
}

export interface Checkpoint {
  name: string
  epoch: number
  loss: number
  path: string
}
