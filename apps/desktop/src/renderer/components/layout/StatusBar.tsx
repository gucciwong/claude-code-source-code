import { Lock, Zap, Network, Mic } from 'lucide-react'
import { useSystemStore } from '../../store/systemStore'
import { useVoiceStore } from '../../store/voiceStore'
import { useKnowledgeLibraryStore } from '../../store/knowledgeLibraryStore'
import { useDownloadStore } from '../../store/downloadStore'
import { useModelsStore } from '../../store/modelsStore'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { formatModelSizeFromBytes } from '../../utils/modelSize'

function formatDownloadSpeed(downloadedGbPerSecond: number): string {
  const mbPerSecond = downloadedGbPerSecond * 1024
  if (mbPerSecond >= 1024) {
    return `DL ${(mbPerSecond / 1024).toFixed(2)} GB/s`
  }
  return `DL ${mbPerSecond.toFixed(1)} MB/s`
}

export function StatusBar() {
  const {
    activeModel,
    tokensPerSec,
    vramUsed,
    vramTotal,
    gpuTemp,
    trainingStatus,
    federationPeers,
  } = useSystemStore()
  const { serviceReady, isRecording } = useVoiceStore()
  const { totalItems } = useKnowledgeLibraryStore()
  const downloadDetails = useDownloadStore(s => s.downloadDetails)
  const ollamaModels = useModelsStore(s => s.installed)
  const mmModels = useModelManagerStore(s => s.models)

  const activeModelMeta = mmModels.find(model => model.id === activeModel || model.name === activeModel)
    ?? ollamaModels.find(model => model.name === activeModel)
  const activeModelSize = activeModelMeta && 'size_bytes' in activeModelMeta
    ? formatModelSizeFromBytes(activeModelMeta.size_bytes)
    : activeModelMeta && 'size' in activeModelMeta
      ? formatModelSizeFromBytes(activeModelMeta.size)
      : null

  const activeDownloadSpeedGbPerSecond = Object.values(downloadDetails).reduce((total, download) => {
    if (download.status !== 'pending' && download.status !== 'downloading') {
      return total
    }

    const elapsedSeconds = Math.max(Date.now() / 1000 - download.started_at, 0)
    if (elapsedSeconds < 1 || download.downloaded_gb <= 0) {
      return total
    }

    return total + download.downloaded_gb / elapsedSeconds
  }, 0)

  return (
    <footer
      role="status"
      aria-label="System status"
      className="h-[32px] flex items-center px-3 gap-3 bg-bg-deeper border-t border-border-subtle text-[11px] text-text-muted flex-shrink-0 overflow-hidden"
    >
      {/* Segment 1: Running Locally — always */}
      <span className="flex items-center gap-1.5 bg-local-badge-bg text-local-badge-fg px-2 py-0.5 rounded-sm flex-shrink-0">
        <Lock size={9} aria-hidden={true} />
        Running Locally
      </span>

      <span aria-hidden="true" className="text-border-default">|</span>

      {/* Segment 2: Model — always */}
      <span className="text-text-secondary truncate max-w-[200px]">
        {activeModel ? `${activeModel}${activeModelSize ? ` · ${activeModelSize}` : ''}` : 'No model loaded'}
      </span>

      {/* Segment 3: GPU VRAM + temp — when loaded */}
      {vramUsed !== null && vramTotal !== null && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className="flex-shrink-0">
            GPU {vramUsed.toFixed(1)}/{vramTotal} GB
            {gpuTemp !== null && ` · ${gpuTemp}°C`}
          </span>
        </>
      )}

      {/* Segment 4: tok/s — when loaded */}
      {tokensPerSec !== null && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className="flex-shrink-0">{Math.round(tokensPerSec)} tok/s</span>
        </>
      )}

      {activeDownloadSpeedGbPerSecond > 0 && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className="flex-shrink-0">{formatDownloadSpeed(activeDownloadSpeedGbPerSecond)}</span>
        </>
      )}

      {/* Conditional: Training */}
      {trainingStatus === 'running' && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className="flex items-center gap-1 text-yellow-400 flex-shrink-0">
            <Zap size={10} aria-hidden={true} />
            Training: Running
          </span>
        </>
      )}

      {/* Conditional: Federation peers */}
      {federationPeers > 0 && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className="flex items-center gap-1 text-green-400 flex-shrink-0">
            <Network size={10} aria-hidden={true} />
            {federationPeers} peers
          </span>
        </>
      )}

      {/* Conditional: PKL snippet count */}
      {totalItems > 0 && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className="flex-shrink-0">{totalItems} snippets</span>
        </>
      )}

      {/* Conditional: Voice service status */}
      {(serviceReady || isRecording) && (
        <>
          <span aria-hidden="true" className="text-border-default">|</span>
          <span className={`flex items-center gap-1 flex-shrink-0 ${
            isRecording ? 'text-red-400' : serviceReady ? 'text-green-400' : 'text-yellow-400'
          }`}>
            <Mic size={10} aria-hidden={true} />
            {isRecording ? 'Recording' : serviceReady ? 'Voice Ready' : 'Voice Loading'}
          </span>
        </>
      )}
    </footer>
  )
}
