import { useEffect, useRef } from 'react'
import { ollamaClient } from '../services/ollamaClient'
import { useSystemStore } from '../store/systemStore'
import { useModelsStore } from '../store/modelsStore'

export function useOllamaStatus() {
  const failCountRef = useRef(0)

  useEffect(() => {
    async function poll() {
      try {
        const online = await ollamaClient.isOnline()
        const models = online ? await ollamaClient.getModels() : []
        const currentActiveModel = useSystemStore.getState().activeModel

        if (online) {
          failCountRef.current = 0
        } else {
          failCountRef.current++
        }

        useSystemStore.setState({
          ollamaOnline: online,
          activeModel: currentActiveModel ?? (models.length > 0 ? models[0].name : null),
          ollamaConnectionError: online ? null :
            failCountRef.current >= 3 ? 'Ollama is not responding. Check that it is running.' : null,
        })
        useModelsStore.getState().setInstalled(models)
      } catch {
        failCountRef.current++
        useSystemStore.setState({
          ollamaOnline: false,
          ollamaConnectionError: failCountRef.current >= 3
            ? 'Ollama is not responding. Check that it is running.'
            : null,
        })
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])
}
