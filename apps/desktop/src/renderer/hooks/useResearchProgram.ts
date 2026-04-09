/**
 * useResearchProgram - React hook for research program service integration
 * Provides methods to fetch programs, experiments, and manage research workflows
 * Follows same pattern as useTrainingService
 */

import { useCallback, useEffect, useState } from 'react'
import { getResearchClient } from '../services/trainingClient'

export interface ResearchProgram {
  program_id: string
  name: string
  description?: string
  model_id: string
  dataset_id: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
  status: 'active' | 'completed' | 'failed'
}

export interface Preset {
  preset_id: string
  name: string
  description: string
  config: Record<string, unknown>
}

export interface Experiment {
  experiment_id: string
  program_id: string
  run_tag: string
  config: Record<string, unknown>
  status: 'completed' | 'running' | 'failed'
  duration_seconds: number
  created_at: string
  updated_at: string
  metrics: {
    accuracy: number
    f1_score: number
    loss: number
    vram_peak_mb: number
  }
  parent_experiment_id: string | null
}

interface UseResearchProgramReturn {
  // Methods
  createProgram: (data: Partial<ResearchProgram>) => Promise<ResearchProgram>
  listPrograms: () => Promise<ResearchProgram[]>
  getProgram: (programId: string) => Promise<ResearchProgram | null>
  listExperiments: (programId: string, runTag?: string) => Promise<Experiment[]>
  getExperiment: (experimentId: string) => Promise<Experiment | null>
  listPresets: () => Promise<Preset[]>
  submitExperiment: (programId: string, config: Record<string, unknown>) => Promise<Experiment>

  // State
  isServiceAvailable: boolean
  programs: ResearchProgram[]
  experiments: Experiment[]
  presets: Preset[]
  currentRunTags: string[]
  isLoading: boolean
  error: string | null
}

export function useResearchProgram(): UseResearchProgramReturn {
  const client = getResearchClient()
  const [isServiceAvailable, setIsServiceAvailable] = useState(false)
  const [programs, setPrograms] = useState<ResearchProgram[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check service availability on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const available = await client.healthCheckResearch()
        setIsServiceAvailable(available)
        if (available) {
          // Load initial data
          const presetsData = await client.listPresets()
          if (presetsData) {
            setPresets(presetsData)
          }
        }
      } catch (err) {
        console.warn('[Research] Health check failed:', err)
        setIsServiceAvailable(false)
      }
    }

    checkHealth()
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [client])

  // Create a new research program
  const createProgram = useCallback(
    async (data: Partial<ResearchProgram>): Promise<ResearchProgram> => {
      if (!isServiceAvailable) {
        throw new Error('Research service not available')
      }

      setIsLoading(true)
      setError(null)
      try {
        const program = await client.createProgram(data)
        setPrograms((prev) => [...prev, program])
        return program
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create program'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [client, isServiceAvailable]
  )

  // List all programs
  const listPrograms = useCallback(async (): Promise<ResearchProgram[]> => {
    if (!isServiceAvailable) {
      return []
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await client.listPrograms()
      setPrograms(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch programs'
      setError(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [client, isServiceAvailable])

  // Get single program
  const getProgram = useCallback(
    async (programId: string): Promise<ResearchProgram | null> => {
      if (!isServiceAvailable) {
        return null
      }

      try {
        return await client.getProgram(programId)
      } catch (err) {
        console.warn('[Research] Failed to fetch program:', err)
        return null
      }
    },
    [client, isServiceAvailable]
  )

  // List experiments for a program
  const listExperiments = useCallback(
    async (programId: string, runTag?: string): Promise<Experiment[]> => {
      if (!isServiceAvailable) {
        return []
      }

      setIsLoading(true)
      setError(null)
      try {
        const data = await client.listExperiments(programId, runTag)
        setExperiments(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch experiments'
        setError(message)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [client, isServiceAvailable]
  )

  // Get single experiment
  const getExperiment = useCallback(
    async (experimentId: string): Promise<Experiment | null> => {
      if (!isServiceAvailable) {
        return null
      }

      try {
        return await client.getExperiment(experimentId)
      } catch (err) {
        console.warn('[Research] Failed to fetch experiment:', err)
        return null
      }
    },
    [client, isServiceAvailable]
  )

  // List presets (cached)
  const listPresets = useCallback(async (): Promise<Preset[]> => {
    if (presets.length > 0) {
      return presets
    }

    if (!isServiceAvailable) {
      return []
    }

    setIsLoading(true)
    try {
      const data = await client.listPresets()
      setPresets(data)
      return data
    } catch (err) {
      console.warn('[Research] Failed to fetch presets:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [client, isServiceAvailable, presets])

  // Submit experiment for a program
  const submitExperiment = useCallback(
    async (programId: string, config: Record<string, unknown>): Promise<Experiment> => {
      if (!isServiceAvailable) {
        throw new Error('Research service not available')
      }

      setIsLoading(true)
      setError(null)
      try {
        const experiment = await client.submitExperiment(programId, config)
        setExperiments((prev) => [...prev, experiment])
        return experiment
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit experiment'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [client, isServiceAvailable]
  )

  // Extract unique run tags from experiments
  const currentRunTags = experiments.reduce((acc, exp) => {
    if (!acc.includes(exp.run_tag)) {
      acc.push(exp.run_tag)
    }
    return acc
  }, [] as string[])

  return {
    createProgram,
    listPrograms,
    getProgram,
    listExperiments,
    getExperiment,
    listPresets,
    submitExperiment,
    isServiceAvailable,
    programs,
    experiments,
    presets,
    currentRunTags,
    isLoading,
    error,
  }
}
