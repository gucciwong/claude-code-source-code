import { useState } from 'react'
import { Network, Lock, TrendingUp, Plus } from 'lucide-react'

interface FederationData {
  id: string
  name: string
  status: 'connected' | 'offline'
  peers: number
  round: number
  contribution: number
  lastSync: string
}

export function Federation() {
  const [federations, setFederations] = useState<FederationData[]>([
    {
      id: '1',
      name: 'Finance AI Consortium',
      status: 'connected',
      peers: 8,
      round: 127,
      contribution: 0.42,
      lastSync: '14 min ago',
    },
    {
      id: '2',
      name: 'Open Source Coder Commons',
      status: 'offline',
      peers: 0,
      round: 89,
      contribution: 0.38,
      lastSync: '3 days ago',
    },
  ])

  return (
    <div data-testid="screen-federation" className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Federation Console</h1>
          <p className="text-sm text-text-muted mt-1">Join federations, contribute gradients, monitor peer network</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-text-primary rounded font-medium cursor-pointer">
          <Plus size={16} aria-hidden="true" />
          Join Federation
        </button>
      </div>

      {/* My Federations */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary">My Federations</h2>

        <div className="space-y-3">
          {federations.map((fed) => (
            <div
              key={fed.id}
              className="flex items-start justify-between p-4 border border-border-subtle rounded-lg hover:bg-bg-surface-3/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${fed.status === 'connected' ? 'bg-green-500' : 'bg-text-muted'}`} />
                  <h3 className="font-semibold text-text-primary">{fed.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    fed.status === 'connected'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-text-muted/20 text-text-muted'
                  }`}>
                    {fed.status === 'connected' ? `Connected · ${fed.peers} peers` : 'Offline — Resume'}
                  </span>
                </div>

                {fed.status === 'connected' && (
                  <div className="text-xs text-text-muted space-y-1">
                    <p>Round: {fed.round} · My contribution: {fed.contribution}% · Epsilon: 0.1</p>
                    <p>Last sync: {fed.lastSync} · Bandwidth: ↑ 120 KB/s  ↓ 45 KB/s</p>
                  </div>
                )}

                {fed.status === 'offline' && (
                  <p className="text-xs text-text-muted">Last active: {fed.lastSync}</p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button className="px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer">
                  Details
                </button>
                {fed.status === 'connected' && (
                  <>
                    <button className="px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer">
                      Pause
                    </button>
                    <button className="px-2 py-1 text-xs rounded border border-border-default text-red-400 hover:bg-red-500/10 cursor-pointer">
                      Leave
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Status */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Lock size={18} aria-hidden="true" />
          Privacy Status
        </h2>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-text-secondary">Differential Privacy: ON (ε = 0.1, δ = 1e-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-text-secondary">Secure Aggregation: ON</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-text-secondary">Raw code transmitted: NONE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-text-secondary">Gradient encryption: TLS 1.3</span>
          </div>
        </div>

        <p className="text-xs text-text-muted border-t border-border-subtle pt-3">
          <strong>What is transmitted:</strong> gradient updates only (encrypted)<br />
          <strong>What stays local:</strong> all code, training data, chat history
        </p>
      </div>

      {/* Network Graph */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary">Network Graph</h2>

        <div className="aspect-video flex items-center justify-center bg-bg-surface-3 rounded border border-border-subtle">
          <div className="space-y-3 text-center text-text-muted text-sm">
            <Network size={32} className="mx-auto opacity-50" aria-hidden="true" />
            <div>
              <p>8 active peers in Finance AI Consortium</p>
              <p className="text-xs">Latency: 42ms</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs text-text-muted">
          <div>
            <span className="block text-text-primary font-semibold mb-1">Your Node</span>
            <span>Org-7af3 (anonymous)</span>
          </div>
          <div>
            <span className="block text-text-primary font-semibold mb-1">Aggregation</span>
            <span>agg.finai.network</span>
          </div>
          <div>
            <span className="block text-text-primary font-semibold mb-1">Connected Peers</span>
            <span>8 active</span>
          </div>
        </div>
      </div>

      {/* Contribution History */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp size={18} aria-hidden="true" />
          Contribution History
        </h2>

        <div className="space-y-2">
          {[
            { round: 127, submitted: true, quality: 0.91, reward: 12 },
            { round: 126, submitted: true, quality: 0.88, reward: 11 },
            { round: 125, submitted: true, quality: 0.92, reward: 13 },
          ].map((entry) => (
            <div key={entry.round} className="flex items-center justify-between p-2 border border-border-subtle rounded text-sm">
              <div>
                <span className="text-text-primary font-semibold">Round {entry.round}:</span>
                <span className="text-text-muted ml-2">
                  {entry.submitted ? '✓ Submitted' : '○ Pending'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-text-secondary">Quality: {entry.quality.toFixed(2)}</p>
                <p className="text-green-400 text-xs">Reward: +{entry.reward}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border-subtle pt-3">
          <p className="text-sm text-text-primary">
            <strong>Your reputation:</strong> <span className="text-accent-500">847 points</span>
          </p>
          <p className="text-xs text-text-muted mt-1">Top 15% contributor</p>
        </div>
      </div>
    </div>
  )
}
