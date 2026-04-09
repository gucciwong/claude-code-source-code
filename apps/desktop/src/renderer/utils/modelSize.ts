export function formatModelSizeFromBytes(bytes?: number | null): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return null
  }

  return `${(bytes / 1e9).toFixed(2)} GB`
}

export function formatModelSizeFromGigabytes(sizeGb?: number | null): string | null {
  if (typeof sizeGb !== 'number' || !Number.isFinite(sizeGb) || sizeGb <= 0) {
    return null
  }

  return `${sizeGb.toFixed(2)} GB`
}