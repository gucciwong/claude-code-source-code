import React, { useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { GitPullRequest, RefreshCw, Play } from 'lucide-react'
import { usePRReview } from '../hooks/usePRReview'
import { usePRReviewStore } from '../store/prReviewStore'
import { ReviewSummaryCard, ReviewCommentList } from '../components/prreview'

const SAMPLE_DIFF = `diff --git a/src/auth.py b/src/auth.py\nindex 1234..5678 100644\n--- a/src/auth.py\n+++ b/src/auth.py\n@@ -10,6 +10,9 @@ class Auth:\n def login(self):\n+    password = "hunter2"\n+    print("Logging in...")\n+    # TODO: add 2FA\n     return True`

export function PRReview() {
  const { reviewDiff, fetchRules } = usePRReview()
  const { result, rules, diff, isReviewing, setDiff } = usePRReviewStore()

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleReview = () => reviewDiff(diff || SAMPLE_DIFF)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-1">
          <GitPullRequest size={20} aria-hidden="true" className="text-accent-400" />
          <h1 className="text-text-primary text-xl font-semibold">PR Review Agent</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Automated code review with configurable rules
        </p>
      </div>

      <Tabs.Root defaultValue="review" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 pt-4 border-b border-border-subtle">
          {(['review', 'rules', 'history'] as const).map(t => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs.Content value="review">
            <div className="mb-4">
              <label className="text-text-secondary text-xs block mb-1">
                Paste git diff here
              </label>
              <textarea
                value={diff}
                onChange={e => setDiff(e.target.value)}
                placeholder={SAMPLE_DIFF}
                rows={6}
                aria-label="Git diff input"
                className="w-full bg-bg-surface-2 border border-border-default rounded-lg px-3 py-2 text-text-code text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              />
            </div>
            <button
              onClick={handleReview}
              disabled={isReviewing}
              className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 mb-6"
            >
              {isReviewing ? (
                <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Play size={14} aria-hidden="true" />
              )}
              {isReviewing ? 'Reviewing…' : 'Run Review'}
            </button>
            {result && (
              <>
                <ReviewSummaryCard summary={result.summary} approved={result.approved} />
                <div className="mt-4">
                  <h3 className="text-text-secondary text-sm font-medium mb-3">
                    Review Comments ({result.comments.length})
                  </h3>
                  <ReviewCommentList comments={result.comments} />
                </div>
              </>
            )}
          </Tabs.Content>
          <Tabs.Content value="rules">
            <h3 className="text-text-secondary text-sm font-medium mb-3">
              Active Rules ({rules.length})
            </h3>
            <div className="space-y-2">
              {rules.map(r => (
                <div
                  key={r.id}
                  className="bg-bg-surface-2 border border-border-default rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-text-code text-xs">{r.id}</code>
                    <span
                      className={`text-xs px-1.5 rounded ${
                        r.severity === 'error'
                          ? 'text-red-400 bg-red-500/10'
                          : r.severity === 'warning'
                            ? 'text-yellow-400 bg-yellow-400/10'
                            : 'text-blue-400 bg-blue-400/10'
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mt-1">{r.message}</p>
                </div>
              ))}
            </div>
          </Tabs.Content>
          <Tabs.Content value="history">
            <p className="text-text-muted text-sm">Review history coming soon.</p>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
