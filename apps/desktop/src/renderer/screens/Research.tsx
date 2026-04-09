import { useState, useEffect } from 'react'
import { useResearchProgram } from '../hooks/useResearchProgram'
import { ExperimentTable } from '../components/training/ExperimentTable'
import { ProgressChart } from '../components/training/ProgressChart'
import { ResearchProgramEditor } from '../components/training/ResearchProgramEditor'
import { RunTagSelector } from '../components/training/RunTagSelector'
import { ExperimentDetailModal } from '../components/training/ExperimentDetailModal'
import { Plus, Play, AlertCircle, Loader } from 'lucide-react'

type Metric = 'accuracy' | 'loss' | 'f1_score'

export function Research() {
  const {
    createProgram,
    listPrograms,
    listExperiments,
    listPresets,
    submitExperiment,
    isServiceAvailable,
    programs,
    experiments,
    presets,
    currentRunTags,
    isLoading,
    error,
  } = useResearchProgram()

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)
  const [currentRunTag, setCurrentRunTag] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<Metric>('accuracy')
  const [showEditor, setShowEditor] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Load programs on mount
  useEffect(() => {
    if (isServiceAvailable) {
      listPrograms()
    }
  }, [isServiceAvailable])

  // Load experiments when program changes
  useEffect(() => {
    if (selectedProgram && isServiceAvailable) {
      listExperiments(selectedProgram)
    }
  }, [selectedProgram, isServiceAvailable])

  // Set default run tag
  useEffect(() => {
    if (currentRunTags.length > 0 && !currentRunTag) {
      setCurrentRunTag(currentRunTags[0])
    }
  }, [currentRunTags, currentRunTag])

  const handleCreateProgram = async (data: any) => {
    try {
      const program = await createProgram(data)
      setSelectedProgram(program.program_id)
      setShowEditor(false)
    } catch (err) {
      console.error('Failed to create program:', err)
    }
  }

  const handleSubmitExperiment = async () => {
    if (!selectedProgram) return

    try {
      // Pass empty config — backend uses program's search_dimensions defaults
      await submitExperiment(selectedProgram, {})
    } catch (err) {
      console.error('Failed to submit experiment:', err)
    }
  }

  const handleSelectExperiment = (experiment: any) => {
    setSelectedExperiment(experiment)
    if (experiment) {
      setShowDetailModal(true)
    }
  }

  // Filter experiments by run tag
  const filteredExperiments = experiments.filter((exp) => exp.run_tag === currentRunTag)

  if (!isServiceAvailable) {
    return (
      <div data-testid="screen-research" className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="text-yellow-600" size={20} />
          <div>
            <p className="font-semibold text-yellow-900">Research Service Unavailable</p>
            <p className="text-sm text-yellow-800 mt-1">Make sure the training service is running on port 8001</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="screen-research" className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Research Programs</h1>
        <p className="text-sm text-text-muted mt-1">Create and manage research programs with experiment tracking</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Program Selector */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="program-select" className="block text-sm font-medium text-text-primary mb-2">
              Select Program
            </label>
            <select
              id="program-select"
              value={selectedProgram || ''}
              onChange={(e) => setSelectedProgram(e.target.value || null)}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">-- Create or select a program --</option>
              {programs.map((prog) => (
                <option key={prog.program_id} value={prog.program_id}>
                  {prog.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowEditor(true)}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors font-medium"
          >
            <Plus size={18} />
            New Program
          </button>
        </div>
      </div>

      {/* Program Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <ResearchProgramEditor
              onSubmit={handleCreateProgram}
              presets={presets}
              presetsLoading={isLoading}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}

      {selectedProgram && (
        <>
          {/* Run Tag Selector & Experiment Submission */}
          <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <RunTagSelector
                runTags={currentRunTags}
                currentRunTag={currentRunTag}
                onRunTagChange={setCurrentRunTag}
                isLoading={isLoading}
              />

              <button
                onClick={handleSubmitExperiment}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    New Run
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metric Selection */}
          <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
            <label className="block text-sm font-medium text-text-primary mb-3">Metrics to Display</label>
            <div className="flex gap-3 flex-wrap">
              {(['accuracy', 'loss', 'f1_score'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedMetric === metric
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-surface-1 text-text-primary border border-border-default hover:border-accent-500'
                  }`}
                >
                  {metric === 'f1_score' ? 'F1 Score' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6">
            <ProgressChart
              experiments={filteredExperiments}
              currentRunTag={currentRunTag}
              metric={selectedMetric}
              isLoading={isLoading}
            />
          </div>

          {/* Experiments Table */}
          <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Experiments</h2>
            <ExperimentTable
              experiments={filteredExperiments}
              currentRunTag={currentRunTag}
              onSelectExperiment={handleSelectExperiment}
              isLoading={isLoading}
            />
          </div>

          {/* Experiment Detail Modal */}
          <ExperimentDetailModal
            experiment={showDetailModal ? selectedExperiment : null}
            onClose={() => setShowDetailModal(false)}
          />
        </>
      )}
    </div>
  )
}
