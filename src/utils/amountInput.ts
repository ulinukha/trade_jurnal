/** Format angka untuk input: 5000 → "5.000" */
export function formatAmountInput(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Parse "5.000" / "5.000,5" → number */
export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return null

  const negative = trimmed.startsWith('-')
  const normalized = trimmed
    .replace(/^-/, '')
    .replace(/\./g, '')
    .replace(',', '.')

  if (!normalized) return null

  const n = Number(normalized)
  if (Number.isNaN(n)) return null
  return negative ? -n : n
}

/** Format saat user mengetik — hanya digit & minus (opsional). */
export function formatAmountInputFromString(
  raw: string,
  allowNegative = false,
): string {
  const negative = allowNegative && raw.trim().startsWith('-')
  const digits = raw.replace(/[^\d]/g, '')

  if (!digits) return negative ? '-' : ''

  const formatted = formatAmountInput(Number(digits))
  return negative ? `-${formatted}` : formatted
}
