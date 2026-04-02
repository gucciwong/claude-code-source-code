import { useCallback } from 'react'
import { useAnalyticsStore } from '../store/analyticsStore'
import type { MetricEvent, AnalyticsReport, ProductivityMetrics, QualityTrend, TrainingROI } from '../../shared/analytics'

const BASE_URL = 'http://localhost:8009'

export function useAnalytics() {
  const { setReport, setLoading, setError } = useAnalyticsStore()

  const ingestEvent = useCallback(async (event: MetricEvent): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  const fetchReport = useCallback(async (): Promise<AnalyticsReport | null> => {
    setLoading(true)
    setError(null)
    try {
      const [prodRes, qualRes, roiRes] = await Promise.all([
        fetch(`${BASE_URL}/metrics/productivity`),
        fetch(`${BASE_URL}/metrics/quality-trends`),
        fetch(`${BASE_URL}/metrics/training-roi`),
      ])
      if (!prodRes.ok || !qualRes.ok || !roiRes.ok) throw new Error('Failed to fetch metrics')
      const [productivity, quality_trends, training_roi] = await Promise.all([
        prodRes.json() as Promise<ProductivityMetrics>,
        qualRes.json() as Promise<QualityTrend[]>,
        roiRes.json() as Promise<TrainingROI>,
      ])
      const report: AnalyticsReport = {
        generated_at: Date.now() / 1000,
        total_events: 0,
        productivity,
        quality_trends,
        training_roi,
      }
      setReport(report)
      return report
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [setReport, setLoading, setError])

  const exportReport = useCallback(async (format: 'json' | 'csv' = 'json'): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/reports/export?format=${format}`)
      if (!res.ok) return null
      return await res.text()
    } catch {
      return null
    }
  }, [])

  return { ingestEvent, fetchReport, exportReport }
}
