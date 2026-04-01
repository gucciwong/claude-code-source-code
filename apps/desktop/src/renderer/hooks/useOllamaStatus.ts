import { useEffect } from 'react'
import { ollamaClient } from '../services/ollamaClient'
import { useSystemStore } from '../store/systemStore'
import { useModelsStore } from '../store/modelsStore'

export function useOllamaStatus() {
  useEffect(() => {
    async function poll() {
      const online = await ollamaClient.isOnline()
      const models = online ? await ollamaClient.getModels() : []
      useSystemStore.setState({
        ollamaOnline: online,
        activeModel: models.length > 0 ? models[0].name : null,
      })
      if (models.length > 0) {
        useModelsStore.getState().setInstalled(models)
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])
}
