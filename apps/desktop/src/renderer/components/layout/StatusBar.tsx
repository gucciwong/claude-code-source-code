import { Lock, Zap, Network } from 'lucide-react'
import { useSystemStore } from '../../store/systemStore'

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

  return (
    <footer
      role="status"
      aria-label="System status"
      className="h-[28px] flex items-center px-3 gap-3 bg-bg-surface-1 border-t border-border-subtle text-[11px] text-text-secondary flex-shrink-0 overflow-hidden"
    >
      {/* Segment 1: Running Locally — always */}
      <span className="flex items-center gap-1.5 bg-local-badge-bg text-local-badge-fg px-2 py-0.5 rounded-sm flex-shrink-0">
        <Lock size={9} aria-hidden={true} />
        Running Locally
      </span>

      <span aria-hidden="true" className="text-border-default">|</span>

      {/* Segment 2: Model — always */}
      <span className="text-text-secondary truncate max-w-[200px]">
        {activeModel ?? 'No model loaded'}
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
    </footer>
  )
}
