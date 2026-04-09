import { useState, useEffect } from 'react'
import { Copy, AlertCircle } from 'lucide-react'

interface Preset {
  preset_id: string
  name: string
  description: string
  config: Record<string, unknown>
}

interface ResearchProgramEditorProps {
  onSubmit: (data: any) => Promise<void>
  presets?: Preset[]
  presetsLoading?: boolean
  onClose: () => void
}

interface FormData {
  name: string
  description: string
  model_id: string
  dataset_id: string
  config: Record<string, unknown>
}

interface Errors {
  [key: string]: string
}

export function ResearchProgramEditor({
  onSubmit,
  presets = [],
  presetsLoading = false,
  onClose,
}: ResearchProgramEditorProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    model_id: '',
    dataset_id: '',
    config: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 10,
      warmup_steps: 100,
    },
  })

  const [selectedPreset, setSelectedPreset] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [configError, setConfigError] = useState<string>('')

  const selectedPresetData = presets.find((p) => p.preset_id === selectedPreset)

  useEffect(() => {
    if (selectedPresetData) {
      setFormData((prev) => ({
        ...prev,
        config: JSON.parse(JSON.stringify(selectedPresetData.config)),
      }))
      setConfigError('')
    }
  }, [selectedPreset, selectedPresetData])

  const validateForm = (): boolean => {
    const newErrors: Errors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Program name is required'
    }

    if (!formData.model_id) {
      newErrors.model_id = 'Model is required'
    }

    if (!formData.dataset_id) {
      newErrors.dataset_id = 'Dataset is required'
    }

    // Validate config
    if (typeof formData.config.learning_rate !== 'number' || formData.config.learning_rate <= 0) {
      newErrors.learning_rate = 'Learning rate must be positive'
    }

    if (
      typeof formData.config.batch_size !== 'number' ||
      !Number.isInteger(formData.config.batch_size) ||
      formData.config.batch_size < 1
    ) {
      newErrors.batch_size = 'Batch size must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (configError) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfigChange = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      setFormData((prev) => ({
        ...prev,
        config: parsed,
      }))
      setConfigError('')
    } catch {
      setConfigError('Invalid JSON format')
    }
  }

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(formData.config, null, 2))
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="bg-bg-surface-1 rounded-lg border border-border-default p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-text-primary mb-6">Create Research Program</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
            Program Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            placeholder="e.g., QLoRA Fine-tuning Experiment"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            placeholder="Optional description of your research"
          />
        </div>

        {/* Model Selection */}
        <div>
          <label htmlFor="model_id" className="block text-sm font-medium text-text-primary mb-2">
            Model *
          </label>
          <select
            id="model_id"
            value={formData.model_id}
            onChange={(e) => handleInputChange('model_id', e.target.value)}
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Select a model</option>
            <option value="qwen-7b">Qwen 7B</option>
            <option value="llama-7b">Llama 7B</option>
            <option value="mistral-7b">Mistral 7B</option>
          </select>
        </div>

        {/* Dataset Selection */}
        <div>
          <label htmlFor="dataset_id" className="block text-sm font-medium text-text-primary mb-2">
            Dataset *
          </label>
          <select
            id="dataset_id"
            value={formData.dataset_id}
            onChange={(e) => handleInputChange('dataset_id', e.target.value)}
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">Select a dataset</option>
            <option value="dataset-1">Dataset 1 (1K samples)</option>
            <option value="dataset-2">Dataset 2 (10K samples)</option>
            <option value="dataset-3">Dataset 3 (100K samples)</option>
          </select>
        </div>

        {/* Preset Selector */}
        <div>
          <label htmlFor="preset" className="block text-sm font-medium text-text-primary mb-2">
            Select Preset
          </label>
          {presetsLoading ? (
            <>
              <div role="status" aria-live="polite" aria-label="Loading presets" data-testid="preset-skeleton" className="h-10 bg-bg-surface-2 rounded animate-pulse" />
              <span className="sr-only">Loading presets...</span>
            </>
          ) : (
            <>
              <select
                id="preset"
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="">-- Custom Configuration --</option>
                {presets.map((preset) => (
                  <option key={preset.preset_id} value={preset.preset_id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              {selectedPresetData && (
                <p className="text-sm text-text-muted mt-2 italic">{selectedPresetData.description}</p>
              )}
            </>
          )}
        </div>

        {/* Hyperparameters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-primary">Hyperparameters</label>
            <button
              type="button"
              onClick={handleCopyConfig}
              className="text-xs flex items-center gap-1 text-accent-500 hover:text-accent-600"
            >
              <Copy size={14} />
              Copy config
            </button>
          </div>

          {/* Learning Rate & Batch Size inputs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="learning_rate" className="block text-sm font-medium text-text-primary mb-1">
                Learning Rate
              </label>
              <input
                id="learning_rate"
                type="number"
                step="any"
                value={typeof formData.config.learning_rate === 'number' ? formData.config.learning_rate : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setFormData((prev) => ({
                    ...prev,
                    config: { ...prev.config, learning_rate: isNaN(val) ? 0 : val },
                  }))
                  if (errors.learning_rate) setErrors((prev) => { const n = { ...prev }; delete n.learning_rate; return n })
                }}
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div>
              <label htmlFor="batch_size" className="block text-sm font-medium text-text-primary mb-1">
                Batch Size
              </label>
              <input
                id="batch_size"
                type="number"
                step="1"
                value={typeof formData.config.batch_size === 'number' ? formData.config.batch_size : ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  setFormData((prev) => ({
                    ...prev,
                    config: { ...prev.config, batch_size: isNaN(val) ? 0 : val },
                  }))
                  if (errors.batch_size) setErrors((prev) => { const n = { ...prev }; delete n.batch_size; return n })
                }}
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div
            data-testid="config-editor"
            className="bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden"
          >
            <textarea
              value={JSON.stringify(formData.config, null, 2)}
              onChange={(e) => handleConfigChange(e.target.value)}
              className="w-full p-3 bg-bg-surface-3 text-text-primary font-mono text-xs focus:outline-none resize-none h-32"
              spellCheck={false}
            />
          </div>
          {configError && (
            <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle size={14} />
              {configError}
            </p>
          )}
        </div>

        {/* General Form Errors */}
        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3"
          >
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Fix the following errors:</p>
              <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border-default text-text-primary hover:bg-bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || configError !== ''}
            className="px-4 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Creating...' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  )
}
