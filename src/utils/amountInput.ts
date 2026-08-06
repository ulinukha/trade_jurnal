const intlInteger = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
})

const intlAmount = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Format angka untuk input: 5000 → "5.000", 5000.5 → "5.000,5" */
export function formatAmountInput(value: number): string {
  return intlAmount.format(value)
}

/** Parse "5.000" / "5.000,5" → number */
export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return null

  const negative = trimmed.startsWith('-')
  const body = negative ? trimmed.slice(1) : trimmed
  const commaIndex = body.indexOf(',')

  const intDigits =
    commaIndex >= 0
      ? body.slice(0, commaIndex).replace(/[^\d]/g, '')
      : body.replace(/[^\d]/g, '')
  const decDigits =
    commaIndex >= 0
      ? body.slice(commaIndex + 1).replace(/[^\d]/g, '').slice(0, 2)
      : ''

  if (!intDigits && !decDigits) return null

  const normalized = `${intDigits || '0'}${decDigits ? `.${decDigits}` : ''}`
  const n = Number(normalized)
  if (Number.isNaN(n)) return null
  return negative ? -n : n
}

/**
 * Format saat user mengetik.
 * Titik = pemisah ribuan, koma = desimal (contoh: 5.000,5).
 */
export function formatAmountInputFromString(
  raw: string,
  allowNegative = false,
): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const negative = allowNegative && trimmed.startsWith('-')
  const body = (negative ? trimmed.slice(1) : trimmed).replace(/\s/g, '')
  if (!body) return negative ? '-' : ''

  const commaIndex = body.indexOf(',')
  const intRaw = commaIndex >= 0 ? body.slice(0, commaIndex) : body
  const decRaw = commaIndex >= 0 ? body.slice(commaIndex + 1) : ''

  const intDigits = intRaw.replace(/[^\d]/g, '')
  const decDigits = decRaw.replace(/[^\d]/g, '').slice(0, 2)
  const hasComma = commaIndex >= 0

  if (!intDigits && !decDigits && !hasComma) {
    return negative ? '-' : ''
  }

  let result = intDigits
    ? intlInteger.format(Number(intDigits))
    : hasComma || decDigits
      ? '0'
      : ''

  if (hasComma) {
    result += `,${decDigits}`
  }

  return negative ? `-${result}` : result
}
