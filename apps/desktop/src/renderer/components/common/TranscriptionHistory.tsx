import React, { useState, useMemo } from 'react'
import { Trash2, Download, Search } from 'lucide-react'
import { useVoiceStore } from '../../store/voiceStore'

/**
 * Transcription history component with search, export, and delete functionality
 */
export function TranscriptionHistory() {
  const { transcriptions, deleteTranscription, clearTranscriptions } = useVoiceStore()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter transcriptions by search query
  const filteredTranscriptions = useMemo(() => {
    if (!searchQuery.trim()) return transcriptions

    const query = searchQuery.toLowerCase()
    return transcriptions.filter((t) => t.text.toLowerCase().includes(query))
  }, [transcriptions, searchQuery])

  // Export transcriptions as JSON
  const handleExport = () => {
    const dataToExport = {
      exportedAt: new Date().toISOString(),
      total: filteredTranscriptions.length,
      transcriptions: filteredTranscriptions.map((t) => ({
        text: t.text,
        language: t.language,
        confidence: t.confidence,
        duration: t.duration,
        timestamp: new Date(t.timestamp).toISOString(),
      })),
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcriptions-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  return (
    <div className="space-y-3 p-4 bg-bg-surface-2 border border-border-default rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Transcription History</h3>
        <span className="text-xs text-text-muted">{filteredTranscriptions.length} items</span>
      </div>

      {/* Search box */}
      {transcriptions.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search transcriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg-surface-1 border border-border-default rounded-md text-sm text-text-primary placeholder-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          />
        </div>
      )}

      {/* Controls */}
      {transcriptions.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={filteredTranscriptions.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer border border-border-default text-text-secondary hover:bg-bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} aria-hidden="true" />
            Export
          </button>

          <button
            onClick={() => clearTranscriptions()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer border border-border-default text-red-400 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
          >
            <Trash2 size={16} aria-hidden="true" />
            Clear All
          </button>
        </div>
      )}

      {/* History list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTranscriptions.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            {transcriptions.length === 0 ? 'No transcriptions yet' : 'No matches found'}
          </p>
        ) : (
          filteredTranscriptions.map((entry) => (
            <div key={entry.id} className="p-3 bg-bg-surface-1 border border-border-subtle rounded-md space-y-2 hover:border-border-default transition-colors">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-text-primary flex-1 break-words line-clamp-2">{entry.text}</p>
                <button
                  onClick={() => deleteTranscription(entry.id)}
                  className="flex-shrink-0 p-1.5 hover:bg-red-500/10 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={`Delete "${entry.text}"`}
                >
                  <Trash2 size={14} className="text-red-400" aria-hidden="true" />
                </button>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-text-muted space-x-2">
                <span>{entry.language.toUpperCase()}</span>
                <span>Confidence: {formatConfidence(entry.confidence)}</span>
                <span>{entry.duration.toFixed(1)}s</span>
                <span className="text-text-muted text-right">{formatTime(entry.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
