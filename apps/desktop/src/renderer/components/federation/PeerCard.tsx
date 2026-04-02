import React from 'react'
import { Server, Trash2 } from 'lucide-react'
import type { PeerInfo } from '../../../shared/federationCore'

interface PeerCardProps {
  peer: PeerInfo
  onRemove: (id: string) => void
}

export function PeerCard({ peer, onRemove }: PeerCardProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Server size={16} aria-hidden="true" className="text-accent-400" />
        <div>
          <p className="text-text-primary text-sm font-medium">{peer.peer_id}</p>
          <p className="text-text-muted text-xs">
            {peer.address} · {peer.data_size} samples
          </p>
        </div>
      </div>
      <button
        onClick={() => onRemove(peer.peer_id)}
        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-label={`Remove peer ${peer.peer_id}`}
      >
        <Trash2 size={13} aria-hidden="true" />
      </button>
    </div>
  )
}
