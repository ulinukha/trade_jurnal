const intlInteger = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

function amountFormatter(maxDecimals: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  })
}

/** Format angka untuk input: 5000 → "5,000", 5000.5 → "5,000.5" */
export function formatAmountInput(value: number, maxDecimals = 2): string {
  return amountFormatter(maxDecimals).format(value)
}

/** Parse "5,000" / "5,000.5" → number */
export function parseAmountInput(raw: string, maxDecimals = 2): number | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return null

  const negative = trimmed.startsWith('-')
  const body = negative ? trimmed.slice(1) : trimmed
  const dotIndex = body.indexOf('.')

  const intDigits =
    dotIndex >= 0
      ? body.slice(0, dotIndex).replace(/[^\d]/g, '')
      : body.replace(/[^\d]/g, '')
  const decDigits =
    dotIndex >= 0
      ? body.slice(dotIndex + 1).replace(/[^\d]/g, '').slice(0, maxDecimals)
      : ''

  if (!intDigits && !decDigits) return null

  const normalized = `${intDigits || '0'}${decDigits ? `.${decDigits}` : ''}`
  const n = Number(normalized)
  if (Number.isNaN(n)) return null
  return negative ? -n : n
}

/**
 * Format saat user mengetik.
 * Koma = pemisah ribuan, titik = desimal (contoh: 1,065.03).
 */
export function formatAmountInputFromString(
  raw: string,
  allowNegative = false,
  maxDecimals = 2,
): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const negative = allowNegative && trimmed.startsWith('-')
  const body = (negative ? trimmed.slice(1) : trimmed).replace(/\s/g, '')
  if (!body) return negative ? '-' : ''

  const dotIndex = body.indexOf('.')
  const intRaw = dotIndex >= 0 ? body.slice(0, dotIndex) : body
  const decRaw = dotIndex >= 0 ? body.slice(dotIndex + 1) : ''

  const intDigits = intRaw.replace(/[^\d]/g, '')
  const decDigits = decRaw.replace(/[^\d]/g, '').slice(0, maxDecimals)
  const hasDot = dotIndex >= 0

  if (!intDigits && !decDigits && !hasDot) {
    return negative ? '-' : ''
  }

  let result = intDigits
    ? intlInteger.format(Number(intDigits))
    : hasDot || decDigits
      ? '0'
      : ''

  if (hasDot) {
    result += `.${decDigits}`
  }

  return negative ? `-${result}` : result
}
