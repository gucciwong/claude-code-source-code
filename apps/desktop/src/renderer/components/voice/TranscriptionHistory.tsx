import React, { useMemo, useState } from 'react'
import { Trash2, Copy, Download, History } from 'lucide-react'
import { useVoiceStore, TranscriptionEntry } from '../../store/voiceStore'

export const TranscriptionHistory: React.FC = () => {
  const { transcriptions, deleteTranscription, clearTranscriptions } = useVoiceStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredTranscriptions = useMemo(() => {
    if (!searchTerm) return transcriptions
    return transcriptions.filter((t) =>
      t.text.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [transcriptions, searchTerm])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExport = () => {
    if (transcriptions.length === 0) return

    const data = transcriptions.map((t) => ({
      timestamp: new Date(t.timestamp).toISOString(),
      text: t.text,
      language: t.language,
      confidence: t.confidence,
      duration: t.duration,
    }))

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcriptions-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-bg-surface-2 border border-border-subtle rounded-lg p-8">
        <History size={32} className="text-text-muted mb-3" aria-hidden="true" />
        <p className="text-sm text-text-secondary mb-1">No transcriptions yet</p>
        <p className="text-xs text-text-muted">Start recording to see your transcription history</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface-1 border-l border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2">
          <History size={16} className="text-accent-500" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text-primary">
            Transcription History ({transcriptions.length})
          </h3>
        </div>
        <div className="flex gap-2">
          {transcriptions.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-1.5 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Export transcriptions"
                title="Export as JSON"
              >
                <Download size={14} className="text-text-secondary" aria-hidden="true" />
              </button>
              <button
                onClick={() => clearTranscriptions()}
                className="p-1.5 hover:bg-bg-surface-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Clear all transcriptions"
                title="Clear history"
              >
                <Trash2 size={14} className="text-red-400" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border-subtle flex-shrink-0">
        <input
          type="text"
          placeholder="Search transcriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTranscriptions.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-text-muted">No results found</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {filteredTranscriptions.map((entry) => (
              <li key={entry.id} className="p-4 hover:bg-bg-surface-2 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted mb-1">
                      {formatDate(entry.timestamp)} {formatTime(entry.timestamp)} • {entry.language.toUpperCase()}
                    </p>
                    <p className="text-sm text-text-primary break-words">{entry.text}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(entry.text, entry.id)}
                      className="p-1 hover:bg-bg-surface-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors"
                      aria-label="Copy transcription"
                      title={copiedId === entry.id ? 'Copied!' : 'Copy'}
                    >
                      <Copy
                        size={14}
                        className={copiedId === entry.id ? 'text-green-400' : 'text-text-secondary'}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={() => deleteTranscription(entry.id)}
                      className="p-1 hover:bg-bg-surface-1 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors"
                      aria-label="Delete transcription"
                    >
                      <Trash2 size={14} className="text-red-400 hover:text-red-300" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500"
                      style={{ width: `${entry.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {(entry.confidence * 100).toFixed(0)}% • {entry.duration}s
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
