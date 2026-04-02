import React, { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Network, RefreshCw, Play, Plus } from 'lucide-react'
import { useFederationCore } from '../hooks/useFederationCore'
import { useFederationCoreStore } from '../store/federationCoreStore'
import { PeerCard, RoundStatusCard } from '../components/federation'
import type { PeerInfo } from '../../shared/federationCore'

export function FederationCore() {
  const { fetchPeers, registerPeer, unregisterPeer, startRound, fetchHistory } =
    useFederationCore()
  const { peers, currentRound, roundHistory, isLoading } = useFederationCoreStore()
  const [newPeerId, setNewPeerId] = useState('')
  const [newPeerAddr, setNewPeerAddr] = useState('')

  useEffect(() => {
    fetchPeers()
    fetchHistory()
  }, [fetchPeers, fetchHistory])

  const handleAddPeer = async () => {
    if (!newPeerId.trim()) return
    const peer: PeerInfo = {
      peer_id: newPeerId,
      address: newPeerAddr || 'localhost',
      data_size: 100,
    }
    await registerPeer(peer)
    setNewPeerId('')
    setNewPeerAddr('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Network size={20} aria-hidden="true" className="text-accent-400" />
            <h1 className="text-text-primary text-xl font-semibold">
              Federated Learning Core
            </h1>
          </div>
          <button
            onClick={() => {
              fetchPeers()
              fetchHistory()
            }}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Refresh federation data"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
        <p className="text-text-secondary text-sm">
          Federated Averaging with Differential Privacy (DP-SGD)
        </p>
      </div>

      <Tabs.Root defaultValue="peers" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 pt-4 border-b border-border-subtle">
          {(['peers', 'rounds', 'history'] as const).map(t => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {t === 'peers'
                ? `Peers (${peers.length})`
                : t === 'rounds'
                  ? 'Current Round'
                  : `History (${roundHistory.length})`}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs.Content value="peers">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPeerId}
                onChange={e => setNewPeerId(e.target.value)}
                placeholder="Peer ID"
                aria-label="New peer ID"
                className="flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              />
              <input
                type="text"
                value={newPeerAddr}
                onChange={e => setNewPeerAddr(e.target.value)}
                placeholder="Address"
                aria-label="New peer address"
                className="flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              />
              <button
                onClick={handleAddPeer}
                className="flex items-center gap-1 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Add peer"
              >
                <Plus size={14} aria-hidden="true" />
                Add
              </button>
            </div>
            {peers.length === 0 ? (
              <p className="text-text-muted text-sm">No peers registered.</p>
            ) : (
              <div className="space-y-2">
                {peers.map(p => (
                  <PeerCard key={p.peer_id} peer={p} onRemove={unregisterPeer} />
                ))}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="rounds">
            <div className="mb-4">
              <button
                onClick={startRound}
                disabled={isLoading || peers.length === 0}
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Play size={14} aria-hidden="true" />
                )}
                Start Federated Round
              </button>
            </div>
            {currentRound ? (
              <RoundStatusCard round={currentRound} />
            ) : (
              <p className="text-text-muted text-sm">
                No active round. Add peers and start a round.
              </p>
            )}
          </Tabs.Content>

          <Tabs.Content value="history">
            {roundHistory.length === 0 ? (
              <p className="text-text-muted text-sm">No completed rounds yet.</p>
            ) : (
              <div className="space-y-3">
                {roundHistory.map(r => (
                  <RoundStatusCard key={r.round_id} round={r} />
                ))}
              </div>
            )}
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
