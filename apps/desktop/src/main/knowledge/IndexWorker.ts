import { Snippet } from '../../shared/knowledge'

type IndexTask = {
  snippets: Snippet[]
  onComplete?: (count: number) => void
}

export class IndexWorker {
  private queue: IndexTask[] = []
  private processing = false
  private onSnippetsReady: ((snippets: Snippet[]) => void) | null = null

  // Register callback for when snippets are ready to be stored
  onReady(callback: (snippets: Snippet[]) => void): void {
    this.onSnippetsReady = callback
  }

  // Enqueue snippets for background indexing (non-blocking)
  enqueue(snippets: Snippet[], onComplete?: (count: number) => void): void {
    if (snippets.length === 0) return
    this.queue.push({ snippets, onComplete })
    if (!this.processing) {
      this.processNext()
    }
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }
    this.processing = true
    const task = this.queue.shift()!

    // Use setImmediate to yield to the event loop before processing
    setImmediate(() => {
      try {
        if (this.onSnippetsReady) {
          this.onSnippetsReady(task.snippets)
        }
        task.onComplete?.(task.snippets.length)
      } finally {
        this.processNext()
      }
    })
  }

  get queueLength(): number {
    return this.queue.length
  }

  get isProcessing(): boolean {
    return this.processing
  }
}
