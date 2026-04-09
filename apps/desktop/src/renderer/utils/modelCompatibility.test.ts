import { describe, expect, it } from 'vitest'
import { evaluateHardwareCompatibility, parseParameterBillions } from './modelCompatibility'

describe('modelCompatibility', () => {
  it('parses parameter counts from B-sized labels', () => {
    expect(parseParameterBillions('Qwen 2.5 Coder 7B')).toBe(7)
    expect(parseParameterBillions('3.8B')).toBe(3.8)
  })

  it('parses parameter counts from M-sized labels', () => {
    expect(parseParameterBillions('850M')).toBe(0.85)
  })

  it('marks a compact GGUF model as locally usable on a balanced machine', () => {
    const report = evaluateHardwareCompatibility(
      {
        cpuThreads: 12,
        systemMemoryGb: 32,
        storageAvailableGb: 400,
        storageQuotaGb: 500,
        storageUsedGb: 100,
        gpuName: 'RTX 4090',
        vramTotalGb: 24,
        vramFreeGb: 18,
      },
      {
        name: 'Qwen2.5-Coder-3B-Instruct',
        sizeBytes: 2_900_000_000,
        format: 'gguf',
        parameterText: '3B',
      }
    )

    expect(report.overallStatus).toBe('pass')
    expect(report.summary).toMatch(/Ready for local use/i)
  })

  it('fails non-GGUF models on CPU-only hosts', () => {
    const report = evaluateHardwareCompatibility(
      {
        cpuThreads: 12,
        systemMemoryGb: 64,
        storageAvailableGb: 900,
        storageQuotaGb: 1000,
        storageUsedGb: 100,
        gpuName: null,
        vramTotalGb: null,
        vramFreeGb: null,
      },
      {
        name: 'Qwen2.5-Coder-7B-Instruct',
        sizeBytes: 15_000_000_000,
        format: 'hf_snapshot',
        parameterText: '7B',
      }
    )

    expect(report.overallStatus).toBe('fail')
    expect(report.summary).toMatch(/GPU-backed runtime required/i)
    expect(report.checks.find(check => check.label === 'GPU / VRAM')?.status).toBe('fail')
  })

  it('fails GGUF models when total VRAM is less than required', () => {
    // A 7B Q4_K_M model (~4.1 GB file) needs ~5+ GB VRAM with KV cache.
    // A machine with only 4 GB VRAM should get a FAIL, not a WARN.
    const report = evaluateHardwareCompatibility(
      {
        cpuThreads: 8,
        systemMemoryGb: 16,
        storageAvailableGb: 100,
        storageQuotaGb: 500,
        storageUsedGb: 400,
        gpuName: 'GTX 1650',
        vramTotalGb: 4,
        vramFreeGb: 3.5,
      },
      {
        name: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M',
        sizeBytes: 4_100_000_000,
        format: 'gguf',
        parameterText: '7B',
      }
    )

    const gpuCheck = report.checks.find(check => check.label === 'GPU / VRAM')
    expect(gpuCheck?.status).toBe('fail')
    expect(report.overallStatus).toBe('fail')
    expect(report.summary).toMatch(/Not enough VRAM|OOM/i)
  })

  it('warns when free VRAM is tight but total VRAM is sufficient', () => {
    // A 7B model needs ~5+ GB VRAM. Machine has 8 GB total but only 3 GB free.
    // Should warn (other processes might free up), not fail.
    const report = evaluateHardwareCompatibility(
      {
        cpuThreads: 8,
        systemMemoryGb: 16,
        storageAvailableGb: 100,
        storageQuotaGb: 500,
        storageUsedGb: 400,
        gpuName: 'RTX 4060',
        vramTotalGb: 8,
        vramFreeGb: 3,
      },
      {
        name: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M',
        sizeBytes: 4_100_000_000,
        format: 'gguf',
        parameterText: '7B',
      }
    )

    const gpuCheck = report.checks.find(check => check.label === 'GPU / VRAM')
    expect(gpuCheck?.status).toBe('warn')
  })

  it('passes when free VRAM exceeds model requirements including KV cache', () => {
    // A 7B model needs ~5+ GB VRAM. Machine has 24 GB total with 18 GB free.
    const report = evaluateHardwareCompatibility(
      {
        cpuThreads: 12,
        systemMemoryGb: 32,
        storageAvailableGb: 400,
        storageQuotaGb: 500,
        storageUsedGb: 100,
        gpuName: 'RTX 4090',
        vramTotalGb: 24,
        vramFreeGb: 18,
      },
      {
        name: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M',
        sizeBytes: 4_100_000_000,
        format: 'gguf',
        parameterText: '7B',
      }
    )

    const gpuCheck = report.checks.find(check => check.label === 'GPU / VRAM')
    expect(gpuCheck?.status).toBe('pass')
  })

  it('accounts for KV cache overhead in VRAM estimates', () => {
    // Two models with same file size but different parameter counts
    // should have different VRAM requirements (larger params = more KV cache)
    const smallModel = evaluateHardwareCompatibility(
      {
        cpuThreads: 12,
        systemMemoryGb: 32,
        storageAvailableGb: 400,
        storageQuotaGb: 500,
        storageUsedGb: 100,
        gpuName: 'RTX 4090',
        vramTotalGb: 24,
        vramFreeGb: 18,
      },
      {
        name: 'Small-Model-3B',
        sizeBytes: 2_000_000_000,
        format: 'gguf',
        parameterText: '3B',
      }
    )

    const largeModel = evaluateHardwareCompatibility(
      {
        cpuThreads: 12,
        systemMemoryGb: 32,
        storageAvailableGb: 400,
        storageQuotaGb: 500,
        storageUsedGb: 100,
        gpuName: 'RTX 4090',
        vramTotalGb: 24,
        vramFreeGb: 18,
      },
      {
        name: 'Large-Model-32B',
        sizeBytes: 2_000_000_000,
        format: 'gguf',
        parameterText: '32B',
      }
    )

    const smallVram = smallModel.checks.find(c => c.label === 'GPU / VRAM')!
    const largeVram = largeModel.checks.find(c => c.label === 'GPU / VRAM')!

    // The 32B model should require more VRAM than the 3B model
    // (even with same file size, KV cache scales with params)
    expect(parseFloat(largeVram.required)).toBeGreaterThan(parseFloat(smallVram.required))
  })

  it('does not falsely pass a 32B model on 8 GB VRAM', () => {
    // Regression test: previously, sizeGb * 0.5 for GGUF meant a 20 GB file
    // only "needed" 10 GB VRAM, which could pass on a 12 GB card.
    // With KV cache, a 32B model needs ~20+ GB VRAM.
    const report = evaluateHardwareCompatibility(
      {
        cpuThreads: 8,
        systemMemoryGb: 32,
        storageAvailableGb: 200,
        storageQuotaGb: 500,
        storageUsedGb: 300,
        gpuName: 'RTX 4060',
        vramTotalGb: 8,
        vramFreeGb: 7,
      },
      {
        name: 'Qwen2.5-Coder-32B-Instruct-Q4_K_M',
        sizeBytes: 20_000_000_000,
        format: 'gguf',
        parameterText: '32B',
      }
    )

    const gpuCheck = report.checks.find(check => check.label === 'GPU / VRAM')
    expect(gpuCheck?.status).toBe('fail')
    expect(report.overallStatus).toBe('fail')
  })
})