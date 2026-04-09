import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, AlertCircle, Play, Zap, Settings2, CheckSquare, Square, Database, MessageSquare, GitBranch, BookOpen } from 'lucide-react'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { useChatStore } from '../../store/chatStore'
import { TrainingConfig, AutoTrainingOptions, AutoDatasetStats, modelManagerAPI } from '../../services/modelManagerAPI'

type Mode = 'one-click' | 'professional'

export function TrainingStartDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { models, startTraining, startOneClickTraining, isLoading, error } = useModelManagerStore()
  const chatMessages = useChatStore(s => s.messages)
  const [mode, setMode] = useState<Mode>('one-click')

  // ── Professional mode state ────────────────────────────────────────────── //
  const [config, setConfig] = useState<TrainingConfig>({
    base_model: '',
    dataset_path: '',
    output_path: '',
    epochs: 3,
    batch_size: 8,
    learning_rate: 0.0001,
    lora_r: 8,
    lora_alpha: 16,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ── One-click mode state ───────────────────────────────────────────────── //
  const [autoOptions, setAutoOptions] = useState<AutoTrainingOptions>({
    use_completion_events: true,
    use_corrections: true,
    use_task_trajectories: true,
    use_chat_history: false,
    use_knowledge: false,
  })
  const [autoStats, setAutoStats] = useState<AutoDatasetStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch auto dataset stats whenever the dialog opens in one-click mode
  useEffect(() => {
    if (!open || mode !== 'one-click') return
    setStatsLoading(true)
    modelManagerAPI.getAutoDatasetStats()
      .then(stats => setAutoStats(stats))
      .catch(() => setAutoStats(null))
      .finally(() => setStatsLoading(false))
  }, [open, mode])

  const handleProfessionalStart = async () => {
    if (!config.base_model || !config.dataset_path) return
    try {
      await startTraining(config)
      onOpenChange(false)
      setConfig({ base_model: '', dataset_path: '', output_path: '', epochs: 3, batch_size: 8, learning_rate: 0.0001, lora_r: 8, lora_alpha: 16 })
    } catch (err) {
      console.error('Training start failed:', err)
    }
  }

  const handleOneClickStart = async () => {
    try {
      // Pass non-streaming chat messages for submission to backend
      const msgsToSubmit = chatMessages
        .filter(m => !m.streaming)
        .map(m => ({ role: m.role, content: m.content }))
      await startOneClickTraining(autoOptions, msgsToSubmit)
      onOpenChange(false)
    } catch {
      // error is displayed from store
    }
  }

  const toggleOpt = (key: keyof AutoTrainingOptions) => {
    setAutoOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Chat history pairs: each user message paired with the following assistant message
  const chatHistoryPairs = (() => {
    const msgs = chatMessages.filter(m => !m.streaming)
    let pairs = 0
    for (let i = 0; i < msgs.length - 1; i++) {
      if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
        pairs++
      }
    }
    return pairs
  })()

  const enabledPairs =
    (autoOptions.use_completion_events ? (autoStats?.completion_event_count ?? 0) : 0) +
    (autoOptions.use_corrections ? (autoStats?.correction_count ?? 0) : 0) +
    (autoOptions.use_task_trajectories ? (autoStats?.trajectory_count ?? 0) : 0) +
    (autoOptions.use_chat_history ? chatHistoryPairs : 0)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-surface-1 border border-border-default rounded-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-5">
            <Dialog.Title className="text-lg font-semibold text-text-primary">Start Fine-Tuning</Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-bg-surface-2 rounded">
              <X size={20} className="text-text-muted" />
            </Dialog.Close>
          </div>

          {/* ── Mode Tabs ───────────────────────────────────────────────── */}
          <div className="flex rounded-lg bg-bg-surface-2 p-1 mb-6 gap-1">
            <button
              onClick={() => setMode('one-click')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                mode === 'one-click'
                  ? 'bg-accent-500 text-white shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Zap size={15} />
              One-Click
            </button>
            <button
              onClick={() => setMode('professional')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                mode === 'professional'
                  ? 'bg-bg-surface-1 text-text-primary shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Settings2 size={15} />
              Professional
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ONE-CLICK MODE                                               */}
          {/* ════════════════════════════════════════════════════════════ */}
          {mode === 'one-click' && (
            <div className="space-y-5">
              {/* Hero card */}
              <div className="rounded-lg bg-gradient-to-br from-accent-500/10 to-purple-500/10 border border-accent-500/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent-500/20">
                    <Zap size={18} className="text-accent-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-1">Train on your personal data</p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Sovereign Code automatically collects the code you accepted, corrected,
                      and the tasks you completed. One click trains the model on everything —
                      no configuration needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data sources */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Include in training</p>
                <DataSourceRow
                  icon={<Database size={14} />}
                  label="Accepted completions"
                  count={autoStats?.completion_event_count}
                  loading={statsLoading}
                  checked={!!autoOptions.use_completion_events}
                  onToggle={() => toggleOpt('use_completion_events')}
                />
                <DataSourceRow
                  icon={<GitBranch size={14} />}
                  label="User corrections"
                  count={autoStats?.correction_count}
                  loading={statsLoading}
                  checked={!!autoOptions.use_corrections}
                  onToggle={() => toggleOpt('use_corrections')}
                />
                <DataSourceRow
                  icon={<Play size={14} />}
                  label="Completed tasks / trajectories"
                  count={autoStats?.trajectory_count}
                  loading={statsLoading}
                  checked={!!autoOptions.use_task_trajectories}
                  onToggle={() => toggleOpt('use_task_trajectories')}
                />
                <DataSourceRow
                  icon={<MessageSquare size={14} />}
                  label="Chat history"
                  count={chatHistoryPairs}
                  loading={false}
                  checked={!!autoOptions.use_chat_history}
                  onToggle={() => toggleOpt('use_chat_history')}
                  badge="beta"
                />
                <DataSourceRow
                  icon={<BookOpen size={14} />}
                  label="Knowledge base entries"
                  count={undefined}
                  loading={false}
                  checked={!!autoOptions.use_knowledge}
                  onToggle={() => toggleOpt('use_knowledge')}
                  badge="slow"
                />
              </div>

              {/* Dataset summary */}
              {!statsLoading && autoStats && (
                <div className="text-xs text-text-muted bg-bg-surface-2 rounded-lg px-3 py-2">
                  {enabledPairs > 0
                    ? <>Ready to train on <span className="text-text-primary font-semibold">{enabledPairs}</span> prompt–completion pairs using <span className="text-text-primary font-medium">{autoStats.estimated_model || 'best available model'}</span>.</>
                    : 'No data selected. Enable at least one source above.'}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Dialog.Close className="flex-1 px-4 py-2 bg-bg-surface-2 border border-border-default hover:bg-bg-surface-3 text-text-primary rounded font-medium transition">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleOneClickStart}
                  disabled={isLoading || enabledPairs === 0}
                  className="flex-[2] px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-semibold transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {isLoading ? 'Starting…' : 'Train with My Data'}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* PROFESSIONAL MODE — original form unchanged                  */}
          {/* ════════════════════════════════════════════════════════════ */}
          {mode === 'professional' && (
            <div className="space-y-4">
              {/* Base Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Base Model *</label>
                <select
                  value={config.base_model}
                  onChange={(e) => setConfig({ ...config, base_model: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary"
                >
                  <option value="">Select a model...</option>
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({(model.size_gb || 0).toFixed(1)} GB)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dataset Path */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Dataset Path *</label>
                <input
                  type="text"
                  placeholder="e.g., /path/to/dataset.jsonl"
                  value={config.dataset_path}
                  onChange={(e) => setConfig({ ...config, dataset_path: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary placeholder-text-muted"
                />
                <p className="text-xs text-text-muted">Path to JSONL file with training data</p>
              </div>

              {/* Output Path */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Output Path</label>
                <input
                  type="text"
                  placeholder="e.g., ./models/finetuned"
                  value={config.output_path}
                  onChange={(e) => setConfig({ ...config, output_path: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary placeholder-text-muted"
                />
              </div>

              {/* Basic Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Epochs</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.epochs}
                    onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    value={config.batch_size}
                    onChange={(e) => setConfig({ ...config, batch_size: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary"
                  />
                </div>
              </div>

              {/* Advanced Parameters Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-accent-500 hover:text-accent-400 font-medium"
              >
                {showAdvanced ? '−' : '+'} Advanced Parameters
              </button>

              {/* Advanced Parameters */}
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-default">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Learning Rate</label>
                    <input
                      type="number"
                      step="0.00001"
                      min="0.00001"
                      max="0.1"
                      value={config.learning_rate}
                      onChange={(e) => setConfig({ ...config, learning_rate: parseFloat(e.target.value) || 0.0001 })}
                      className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">LoRA R</label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={config.lora_r}
                      onChange={(e) => setConfig({ ...config, lora_r: parseInt(e.target.value) || 8 })}
                      className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">LoRA Alpha</label>
                    <input
                      type="number"
                      min="1"
                      max="256"
                      value={config.lora_alpha}
                      onChange={(e) => setConfig({ ...config, lora_alpha: parseInt(e.target.value) || 16 })}
                      className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border-default">
                <Dialog.Close className="flex-1 px-4 py-2 bg-bg-surface-2 border border-border-default hover:bg-bg-surface-3 text-text-primary rounded font-medium transition">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleProfessionalStart}
                  disabled={!config.base_model || !config.dataset_path || isLoading}
                  className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-medium transition flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? 'Starting...' : (
                    <>
                      <Play size={16} />
                      Start
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-text-muted">
                * Required fields. Training will run on the backend and you can monitor progress from this screen.
              </p>
            </div>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: data source row
// ────────────────────────────────────────────────────────────────────────────
function DataSourceRow({
  icon,
  label,
  count,
  loading,
  checked,
  onToggle,
  badge,
}: {
  icon: React.ReactNode
  label: string
  count: number | undefined
  loading: boolean
  checked: boolean
  onToggle: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-surface-2 transition text-left"
    >
      <span className={checked ? 'text-accent-400' : 'text-text-muted'}>
        {checked ? <CheckSquare size={16} /> : <Square size={16} />}
      </span>
      <span className="text-text-muted">{icon}</span>
      <span className={`flex-1 text-sm ${checked ? 'text-text-primary' : 'text-text-muted'}`}>{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface-3 text-text-muted uppercase font-semibold">{badge}</span>
      )}
      {loading ? (
        <Loader2 size={12} className="animate-spin text-text-muted" />
      ) : count !== undefined ? (
        <span className={`text-xs font-mono ${count > 0 ? 'text-accent-400' : 'text-text-muted'}`}>{count}</span>
      ) : null}
    </button>
  )
}

