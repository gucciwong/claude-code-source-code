export type CompatibilityStatus = 'pass' | 'warn' | 'fail' | 'unknown'

export interface HardwareProfile {
  cpuThreads: number | null
  systemMemoryGb: number | null
  storageAvailableGb: number | null
  storageQuotaGb: number | null
  storageUsedGb: number | null
  gpuName: string | null
  vramTotalGb: number | null
  vramFreeGb: number | null
}

export interface ModelCompatibilityInput {
  id?: string
  name: string
  sizeBytes: number
  format?: string | null
  parameterText?: string | null
}

export interface CompatibilityCheck {
  label: 'CPU Threads' | 'RAM' | 'GPU / VRAM' | 'SSD / Storage'
  status: CompatibilityStatus
  available: string
  required: string
  detail: string
  ratio: number | null
}

export interface CompatibilityReport {
  modelName: string
  score: number
  overallStatus: CompatibilityStatus
  summary: string
  recommendedRuntime: string
  checks: CompatibilityCheck[]
}

function formatGb(value: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return 'Unknown'
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} GB`
}

function toStatus(points: number): CompatibilityStatus {
  if (points >= 1) {
    return 'pass'
  }
  if (points >= 0.5) {
    return 'warn'
  }
  return 'fail'
}

export function parseParameterBillions(value?: string | null): number | null {
  if (!value) {
    return null
  }

  const billions = value.match(/(\d+(?:\.\d+)?)\s*[Bb]\b/)
  if (billions) {
    return Number.parseFloat(billions[1])
  }

  const millions = value.match(/(\d+(?:\.\d+)?)\s*[Mm]\b/)
  if (millions) {
    return Number.parseFloat(millions[1]) / 1000
  }

  return null
}

/**
 * Estimate KV cache memory for a typical context window.
 *
 * GGUF runtimes (llama.cpp / Ollama) allocate KV cache proportional to:
 *   2 * n_layers * n_kv_heads * head_dim * context_length * sizeof(float16)
 *
 * We approximate this as ~0.5 GB per 1B params per 8K context for Q4 models,
 * which matches empirical measurements from llama.cpp benchmarks.
 */
function estimateKvCacheGb(parameterBillions: number | null, sizeGb: number): number {
  const effectiveParams = parameterBillions ?? Math.max(sizeGb * 1.5, 1)
  // ~0.5 GB per 1B params per 8K context tokens (conservative for Q4_K_M)
  const kvPer8kContext = effectiveParams * 0.06
  // Assume default 8K context; users with longer contexts will need even more
  return Math.max(kvPer8kContext, 0.3)
}

function estimateRequirements(model: ModelCompatibilityInput) {
  const sizeGb = Math.max(model.sizeBytes / 1e9, 0.1)
  const parameterBillions = parseParameterBillions(model.parameterText ?? model.name)
  const format = (model.format ?? 'unknown').toLowerCase()
  const isGguf = format.includes('gguf')
  const kvCacheGb = estimateKvCacheGb(parameterBillions, sizeGb)
  const runtimeOverheadGb = 0.5 // llama.cpp / Ollama runtime overhead

  // GGUF: full model weights in RAM + KV cache + runtime overhead
  // VRAM: full model weights for GPU offload + KV cache (GPU-side) + runtime overhead
  // Previously used sizeGb * 0.5 for VRAM which assumed partial offload —
  // but users expect the model to actually run on GPU, so we estimate full offload.
  const ramGb = isGguf
    ? Math.max(sizeGb + kvCacheGb + runtimeOverheadGb, parameterBillions != null ? parameterBillions * 0.7 : 0, 4)
    : Math.max(sizeGb * 1.55, parameterBillions != null ? parameterBillions * 1.3 : 0, 6)
  const vramGb = isGguf
    ? Math.max(sizeGb + kvCacheGb + runtimeOverheadGb, parameterBillions != null ? parameterBillions * 0.5 : 0, 1)
    : Math.max(sizeGb * 1.05, parameterBillions != null ? parameterBillions * 1.1 : sizeGb, 4)
  const storageGb = Math.max(sizeGb * 1.15, sizeGb + 0.5)
  const cpuThreads = Math.max(
    4,
    Math.min(16, Math.ceil(((parameterBillions ?? Math.max(sizeGb, 3)) / 2)) * 2)
  )

  return {
    cpuThreads,
    ramGb,
    vramGb,
    storageGb,
    isGguf,
  }
}

function evaluateGenericResource(
  label: CompatibilityCheck['label'],
  availableValue: number | null,
  requiredValue: number,
  detail: string,
  options?: {
    warnThreshold?: number
    allowUnknown?: boolean
  }
): CompatibilityCheck {
  if (availableValue == null) {
    return {
      label,
      status: options?.allowUnknown === false ? 'fail' : 'unknown',
      available: 'Unknown',
      required: formatGb(requiredValue),
      detail,
      ratio: null,
    }
  }

  const ratio = requiredValue > 0 ? availableValue / requiredValue : 1
  const warnThreshold = options?.warnThreshold ?? 0.8
  return {
    label,
    status: toStatus(availableValue >= requiredValue ? 1 : availableValue >= requiredValue * warnThreshold ? 0.5 : 0),
    available: label === 'CPU Threads' ? `${Math.round(availableValue)} threads` : formatGb(availableValue),
    required: label === 'CPU Threads' ? `${Math.round(requiredValue)} threads` : formatGb(requiredValue),
    detail,
    ratio,
  }
}

export function evaluateHardwareCompatibility(
  hardware: HardwareProfile,
  model: ModelCompatibilityInput
): CompatibilityReport {
  const requirements = estimateRequirements(model)
  const cpuCheck = evaluateGenericResource(
    'CPU Threads',
    hardware.cpuThreads,
    requirements.cpuThreads,
    requirements.isGguf ? 'Enough threads improves prompt processing and streaming speed.' : 'Transformer snapshots need stronger CPU support even with GPU acceleration.'
  )
  const ramCheck = evaluateGenericResource(
    'RAM',
    hardware.systemMemoryGb,
    requirements.ramGb,
    requirements.isGguf ? 'CPU execution keeps most of the model in system memory.' : 'Non-GGUF runtimes need extra headroom for weights and runtime buffers.'
  )

  let gpuCheck: CompatibilityCheck
  if (requirements.isGguf) {
    if (hardware.vramTotalGb == null || hardware.vramTotalGb <= 0) {
      gpuCheck = {
        label: 'GPU / VRAM',
        status: 'warn',
        available: 'CPU only',
        required: formatGb(requirements.vramGb),
        detail: 'GGUF can still run on CPU, but GPU offload would improve latency.',
        ratio: null,
      }
    } else {
      const vramHeadroom = hardware.vramFreeGb ?? hardware.vramTotalGb
      const ratio = requirements.vramGb > 0 ? vramHeadroom / requirements.vramGb : 1
      // If total VRAM is less than required, the model cannot fully offload to GPU → fail
      // If total VRAM is enough but free VRAM is tight → warn (other processes may free up)
      // If free VRAM is sufficient → pass
      const status: CompatibilityStatus = vramHeadroom >= requirements.vramGb
        ? 'pass'
        : hardware.vramTotalGb >= requirements.vramGb
          ? 'warn'
          : 'fail'
      gpuCheck = {
        label: 'GPU / VRAM',
        status,
        available: `${formatGb(vramHeadroom)} free of ${formatGb(hardware.vramTotalGb)}`,
        required: formatGb(requirements.vramGb),
        detail: status === 'fail'
          ? 'Total VRAM is less than required for full GPU offload. Model will fall back to CPU layers, which is much slower.'
          : 'Use lower GPU offload or shorter context if free VRAM is tight.',
        ratio,
      }
    }
  } else if (hardware.vramTotalGb == null || hardware.vramTotalGb <= 0) {
    gpuCheck = {
      label: 'GPU / VRAM',
      status: 'fail',
      available: 'No GPU detected',
      required: formatGb(requirements.vramGb),
      detail: 'This model format needs GPU-backed loading on this desktop runtime.',
      ratio: 0,
    }
  } else {
    const vramHeadroom = hardware.vramFreeGb ?? hardware.vramTotalGb
    const ratio = requirements.vramGb > 0 ? vramHeadroom / requirements.vramGb : 1
    gpuCheck = {
      label: 'GPU / VRAM',
      status: vramHeadroom >= requirements.vramGb ? 'pass' : hardware.vramTotalGb >= requirements.vramGb ? 'warn' : 'fail',
      available: `${formatGb(vramHeadroom)} free of ${formatGb(hardware.vramTotalGb)}`,
      required: formatGb(requirements.vramGb),
      detail: 'This path expects dedicated GPU memory for interactive loading.',
      ratio,
    }
  }

  const storageCheck = evaluateGenericResource(
    'SSD / Storage',
    hardware.storageAvailableGb,
    requirements.storageGb,
    'Keep extra disk headroom for tokenizer files, caches, and exported variants.',
    { warnThreshold: 0.9 }
  )

  const checks = [cpuCheck, ramCheck, gpuCheck, storageCheck]
  const weights: Record<CompatibilityCheck['label'], number> = {
    'CPU Threads': 20,
    RAM: 35,
    'GPU / VRAM': 30,
    'SSD / Storage': 15,
  }

  const score = Math.round(
    checks.reduce((total, check) => {
      const points = check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : check.status === 'unknown' ? 0.65 : 0
      return total + weights[check.label] * points
    }, 0) / 100
  )

  const hasFailure = checks.some(check => check.status === 'fail')
  const hasWarning = checks.some(check => check.status === 'warn')
  const overallStatus: CompatibilityStatus = hasFailure ? 'fail' : hasWarning ? 'warn' : 'pass'

  let summary = 'Ready for local use.'
  if (!requirements.isGguf && gpuCheck.status === 'fail') {
    summary = 'GPU-backed runtime required for this model format on this host.'
  } else if (requirements.isGguf && gpuCheck.status === 'fail') {
    summary = 'Not enough VRAM for full GPU offload. Model will run on CPU layers, which is much slower and may OOM.'
  } else if (hasFailure) {
    summary = 'This model is likely to exceed at least one local hardware limit.'
  } else if (hasWarning && requirements.isGguf) {
    summary = 'Model should run locally, but lower context or less GPU offload is safer.'
  } else if (hasWarning) {
    summary = 'Hardware headroom is thin. Expect slower loads or reduced concurrency.'
  }

  return {
    modelName: model.name,
    score,
    overallStatus,
    summary,
    recommendedRuntime: requirements.isGguf
      ? hardware.vramTotalGb != null && hardware.vramTotalGb > 0
        ? 'Best on GGUF with optional GPU offload'
        : 'Best on CPU GGUF'
      : 'Best on dedicated GPU runtime',
    checks,
  }
}