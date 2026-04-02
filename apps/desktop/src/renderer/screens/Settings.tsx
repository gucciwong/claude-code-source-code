import { useState } from 'react'
import { useSystemStore } from '../store/systemStore'
import { useNavigationStore } from '../store/navigationStore'
import { MirrorSelector } from '../components/common/MirrorSelector'

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'inference' | 'privacy'>('general')
  const { theme, setTheme } = useSystemStore()

  return (
    <div data-testid="screen-settings" className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Configure Sovereign Coder preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {(['general', 'inference', 'privacy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'text-accent-500 border-b-2 border-accent-500 -mb-1'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl space-y-8">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Model Source Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Model Source</h3>
              <MirrorSelector />
            </div>

            {/* Display Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Display</h3>

              <div className="space-y-2">
                <label className="block text-sm text-text-secondary">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                  className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-text-secondary">Font Size</label>
                <select className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm">
                  <option value="12">12px (Small)</option>
                  <option value="14" defaultValue="14">14px (Default)</option>
                  <option value="16">16px (Large)</option>
                  <option value="18">18px (Extra Large)</option>
                </select>
              </div>
            </div>

            {/* Editor Integration Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Editor Integration</h3>

              <div className="flex items-center justify-between p-3 bg-bg-surface-2 border border-border-default rounded-md">
                <span className="text-sm text-text-primary">VSCode Extension</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Connected ✓</span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-secondary">Tab to accept completions</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-secondary">Show ghost text suggestions</span>
                </label>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Notifications</h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-secondary">Training complete</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-secondary">Federation sync</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-secondary">Model update available</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Inference Tab */}
        {activeTab === 'inference' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Active Model</h3>

              <div className="flex items-center justify-between p-3 bg-bg-surface-2 border border-border-default rounded-md">
                <span className="text-sm text-text-primary">Qwen2.5-Coder-32B</span>
                <button className="text-xs px-2 py-1 rounded border border-border-default text-text-secondary hover:bg-bg-surface-3">
                  Switch
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Backend Configuration</h3>

              <div className="space-y-2">
                <label className="block text-sm text-text-secondary">Backend</label>
                <select className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm">
                  <option value="ollama">Ollama</option>
                  <option value="llamacpp">llama.cpp</option>
                  <option value="vllm">vLLM</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-text-secondary">Ollama Host</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue="http://localhost:11434"
                    className="flex-1 px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                  />
                  <button className="px-3 py-2 border border-border-default rounded-md text-text-secondary hover:bg-bg-surface-3 text-sm">
                    Test
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Inference Parameters</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm text-text-secondary">Max Context (tokens)</label>
                  <input
                    type="number"
                    defaultValue="32768"
                    className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-text-secondary">Max Tokens (response)</label>
                  <input
                    type="number"
                    defaultValue="2048"
                    className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-text-secondary">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue="0.2"
                    className="w-full"
                  />
                  <span className="text-xs text-text-muted">0.2 (focused)</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-text-secondary">Top-P</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    defaultValue="0.95"
                    className="w-full"
                  />
                  <span className="text-xs text-text-muted">0.95 (diverse)</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-text-secondary">Stream responses</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">Privacy Guarantees</h3>
              <ul className="space-y-1 text-xs text-green-300">
                <li>✓ All inference is local (no cloud calls)</li>
                <li>✓ No telemetry collected</li>
                <li>✓ No API keys sent externally</li>
                <li>✓ All data encrypted at rest</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Data Storage</h3>

              <div className="space-y-2">
                <label className="block text-sm text-text-secondary">Chat History</label>
                <select className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm">
                  <option value="30">Retain 30 days</option>
                  <option value="7">Retain 7 days</option>
                  <option value="unlimited">Retain indefinitely</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-2 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-surface-3">
                  Clear Chat History
                </button>
                <button className="px-3 py-2 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-surface-3">
                  Clear Training Data
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">Opt-in Telemetry</h3>
              <p className="text-xs text-text-muted mb-3">Help improve Sovereign Coder by sharing anonymous data</p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-text-secondary">Usage analytics (no code)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-text-secondary">Crash reports (anonymized)</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
