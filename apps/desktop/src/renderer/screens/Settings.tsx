import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSystemStore } from '../store/systemStore'
import { MirrorSelector } from '../components/common/MirrorSelector'

function StyledSelect({
  value,
  onChange,
  defaultValue,
  children,
  'aria-label': ariaLabel,
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        aria-label={ariaLabel}
        className="w-full px-3 py-2 pr-8 bg-bg-surface-2 border border-border-default rounded-md text-text-primary text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors hover:border-border-strong"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'inference' | 'privacy'>('general')
  const { theme, setTheme, uiTemplate, setUiTemplate } = useSystemStore()

  return (
    <div data-testid="screen-settings" className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Configure Sovereign Code preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {(['general', 'inference', 'privacy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              activeTab === tab
                ? 'text-accent-500 border-b-2 border-accent-500 -mb-px'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-2xl space-y-8">
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
                <label htmlFor="setting-theme" className="block text-sm text-text-secondary">Theme</label>
                <StyledSelect
                  value={theme}
                  onChange={(e) => setTheme((e.target as HTMLSelectElement).value as 'dark' | 'light')}
                  aria-label="Theme"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </StyledSelect>
              </div>

              <div className="space-y-2">
                <label htmlFor="setting-fontsize" className="block text-sm text-text-secondary">Font Size</label>
                <StyledSelect defaultValue="14" aria-label="Font size">
                  <option value="12">12px (Small)</option>
                  <option value="14">14px (Default)</option>
                  <option value="16">16px (Large)</option>
                  <option value="18">18px (Extra Large)</option>
                </StyledSelect>
              </div>
            </div>

            {/* UI Template Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-text-primary">UI Template</h3>
              <p className="text-xs text-text-muted">Choose your interface design aesthetic</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Sentry card */}
                <button
                  data-testid="theme-card-sentry"
                  onClick={() => setUiTemplate('sentry')}
                  aria-pressed={uiTemplate === 'sentry'}
                  aria-label="Select Sentry theme"
                  className={`relative p-3 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    uiTemplate === 'sentry'
                      ? 'border-accent-500 bg-bg-surface-3'
                      : 'border-border-default bg-bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  {uiTemplate === 'sentry' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-lime" aria-hidden="true" />
                  )}
                  <div className="flex gap-1 mb-2" aria-hidden="true">
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#1f1633' }} />
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#6a5fc1' }} />
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#c2ef4e' }} />
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#79628c' }} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Sentry</p>
                  <p className="text-xs text-text-muted mt-0.5">Deep purple · Rubik · 13px radius</p>
                </button>

                {/* Sanity card */}
                <button
                  data-testid="theme-card-sanity"
                  onClick={() => setUiTemplate('sanity')}
                  aria-pressed={uiTemplate === 'sanity'}
                  aria-label="Select Sanity theme"
                  className={`relative p-3 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    uiTemplate === 'sanity'
                      ? 'border-accent-500 bg-bg-surface-3'
                      : 'border-border-default bg-bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  {uiTemplate === 'sanity' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-lime" aria-hidden="true" />
                  )}
                  <div className="flex gap-1 mb-2" aria-hidden="true">
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#0b0b0b', border: '1px solid #353535' }} />
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#0052ef' }} />
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#f36458' }} />
                    <span className="w-4 h-4 rounded-sm inline-block" style={{ background: '#19d600' }} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Sanity</p>
                  <p className="text-xs text-text-muted mt-0.5">Near-black · IBM Plex Mono · Pill</p>
                </button>

                {/* Mistral card */}
                <button
                  data-testid="theme-card-mistral"
                  onClick={() => setUiTemplate('mistral')}
                  aria-pressed={uiTemplate === 'mistral'}
                  aria-label="Select Mistral theme"
                  className={`relative p-3 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    uiTemplate === 'mistral'
                      ? 'border-accent-500 bg-bg-surface-3'
                      : 'border-border-default bg-bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  {uiTemplate === 'mistral' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-lime" aria-hidden="true" />
                  )}
                  <div className="flex gap-1 mb-2" aria-hidden="true">
                    <span className="w-4 h-4 inline-block" style={{ background: '#fffaeb', border: '1px solid #ffd06a' }} />
                    <span className="w-4 h-4 inline-block" style={{ background: '#fa520f' }} />
                    <span className="w-4 h-4 inline-block" style={{ background: '#ffd900' }} />
                    <span className="w-4 h-4 inline-block" style={{ background: '#1f1f1f' }} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Mistral</p>
                  <p className="text-xs text-text-muted mt-0.5">Warm ivory · Arial · Sharp</p>
                </button>

                {/* Replicate card */}
                <button
                  data-testid="theme-card-replicate"
                  onClick={() => setUiTemplate('replicate')}
                  aria-pressed={uiTemplate === 'replicate'}
                  aria-label="Select Replicate theme"
                  className={`relative p-3 rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    uiTemplate === 'replicate'
                      ? 'border-accent-500 bg-bg-surface-3'
                      : 'border-border-default bg-bg-surface-2 hover:border-border-strong'
                  }`}
                >
                  {uiTemplate === 'replicate' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-lime" aria-hidden="true" />
                  )}
                  <div className="flex gap-1 mb-2" aria-hidden="true">
                    <span className="w-4 h-4 inline-block" style={{ background: '#ffffff', border: '1px solid #202020' }} />
                    <span className="w-4 h-4 inline-block" style={{ background: '#ea2804' }} />
                    <span className="w-4 h-4 inline-block" style={{ background: '#2b9a66' }} />
                    <span className="w-4 h-4 inline-block" style={{ background: '#202020' }} />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Replicate</p>
                  <p className="text-xs text-text-muted mt-0.5">White canvas · Basier Square · Pill</p>
                </button>
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
                <StyledSelect defaultValue="ollama" aria-label="Backend">
                  <option value="ollama">Ollama</option>
                  <option value="llamacpp">llama.cpp</option>
                  <option value="vllm">vLLM</option>
                </StyledSelect>
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
                <StyledSelect defaultValue="30" aria-label="Chat history retention">
                  <option value="30">Retain 30 days</option>
                  <option value="7">Retain 7 days</option>
                  <option value="unlimited">Retain indefinitely</option>
                </StyledSelect>
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
              <p className="text-xs text-text-muted mb-3">Help improve Sovereign Code by sharing anonymous data</p>

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
