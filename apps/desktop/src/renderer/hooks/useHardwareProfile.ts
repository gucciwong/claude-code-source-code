import { useEffect, useState } from 'react'
import { HardwareProfile } from '../utils/modelCompatibility'

const MODEL_MANAGER_BASE_URL = 'http://127.0.0.1:8002'

/**
 * Fetches accurate hardware specs from the model-manager service.
 *
 * Fixes three browser-API bugs:
 *  - navigator.deviceMemory is privacy-capped at 8 GB (useless on 64 GB machines)
 *  - navigator.storage.estimate() returns browser storage quota, not real disk space
 *  - systemStore gpuName/vramTotal are never populated without an IPC bridge
 */
export function useHardwareProfile(): HardwareProfile {
  const [profile, setProfile] = useState<HardwareProfile>({
    cpuThreads: null,
    systemMemoryGb: null,
    storageAvailableGb: null,
    storageQuotaGb: null,
    storageUsedGb: null,
    gpuName: null,
    vramTotalGb: null,
    vramFreeGb: null,
  })

  useEffect(() => {
    let cancelled = false

    const fetchHardware = async () => {
      try {
        const res = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/system/hardware`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        setProfile({
          cpuThreads: data.cpu_threads ?? null,
          systemMemoryGb: data.system_memory_total_gb ?? null,
          storageAvailableGb: data.disk_free_gb ?? null,
          storageQuotaGb: data.disk_total_gb ?? null,
          storageUsedGb:
            data.disk_total_gb != null && data.disk_free_gb != null
              ? Math.max(data.disk_total_gb - data.disk_free_gb, 0)
              : null,
          gpuName: data.gpu_name ?? null,
          vramTotalGb: data.vram_total_gb ?? null,
          vramFreeGb: data.vram_free_gb ?? null,
        })
      } catch {
        // Model-manager not running yet — fall back to browser hints (imprecise but safe)
        if (cancelled) return
        setProfile({
          cpuThreads: navigator.hardwareConcurrency ?? null,
          // navigator.deviceMemory is capped at 8 GB; use as a floor, not a ceiling
          systemMemoryGb: typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null,
          storageAvailableGb: null,
          storageQuotaGb: null,
          storageUsedGb: null,
          gpuName: null,
          vramTotalGb: null,
          vramFreeGb: null,
        })
      }
    }

    void fetchHardware()
    // Re-fetch every 30 s so VRAM free stays current during a session
    const interval = setInterval(() => { void fetchHardware() }, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return profile
}