/**
 * useTrainingService - React hook for training service integration
 * Provides methods to log completions and fetch training status
 */

import { useCallback, useEffect, useState } from 'react'
import { getTrainingClient } from '../services/trainingClient'
import type { CompletionEventPayload, InferenceEventPayload } from '../services/trainingClient'

interface TrainingStatus {
  model_id: string
  active_cycle: 'quick' | 'full'
  quick_train_count: number
  next_full_train_in: number
  is_training: boolean
}

interface UseTrainingServiceReturn {
  // Methods
  logCompletion: (payload: CompletionEventPayload) => Promise<{ event_id: string; created_at: string }>
  logInference: (payload: InferenceEventPayload) => Promise<void>
  getStatus: () => Promise<TrainingStatus | null>
  getStats: () => Promise<unknown>

  // State
  isServiceAvailable: boolean
  isTraining: boolean
  trainingStatus: TrainingStatus | null
  eventCount: number
}

export function useTrainingService(): UseTrainingServiceReturn {
  const client = getTrainingClient()
  const [isServiceAvailable, setIsServiceAvailable] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null)
  const [eventCount, setEventCount] = useState(0)

  // Check service availability on mount
  useEffect(() => {
    const checkHealth = async () => {
      const available = await client.healthCheck()
      setIsServiceAvailable(available)
      if (available) {
        const stats = await client.getStats()
        if (stats) {
          setEventCount(stats.total_events)
        }
      }
    }

    checkHealth()
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [client])

  // Log a completion event (chat / inline / agent)
  const logCompletion = useCallback(
    async (payload: CompletionEventPayload) => {
      if (!isServiceAvailable) {
        console.warn('[Training] Service not available, skipping event')
        return { event_id: 'skipped', created_at: new Date().toISOString() }
      }

      try {
        const result = await client.logCompletionEvent(payload)
        // Update event count
        const stats = await client.getStats()
        if (stats) {
          setEventCount(stats.total_events)
        }
        return result
      } catch (error) {
        console.error('[Training] Error logging completion:', error)
        return { event_id: 'error', created_at: new Date().toISOString() }
      }
    },
    [client, isServiceAvailable]
  )

  // Log an inference lifecycle event (non-blocking fire-and-forget)
  const logInference = useCallback(
    async (payload: InferenceEventPayload) => {
      if (!isServiceAvailable) return
      await client.logInferenceEvent(payload)
    },
    [client, isServiceAvailable]
  )

  // Get training status
  const getStatus = useCallback(async () => {
    if (!isServiceAvailable) return null
    const status = await client.getStatus()
    if (status) {
      setTrainingStatus(status)
    }
    return status
  }, [client, isServiceAvailable])

  // Get training stats
  const getStats = useCallback(async () => {
    if (!isServiceAvailable) return null
    return await client.getStats()
  }, [client, isServiceAvailable])

  return {
    // Methods
    logCompletion,
    logInference,
    getStatus,
    getStats,

    // State
    isServiceAvailable,
    isTraining: trainingStatus?.is_training ?? false,
    trainingStatus,
    eventCount,
  }
}

