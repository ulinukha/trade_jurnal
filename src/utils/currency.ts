import type { AppCurrency } from '../types/journal'
import { APP_CURRENCIES } from '../types/journal'

export interface CurrencyMeta {
  code: AppCurrency
  label: AppCurrency
  decimals: number
  placeholder: string
}

export const CURRENCY_META: Record<AppCurrency, CurrencyMeta> = {
  USD: {
    code: 'USD',
    label: 'USD',
    decimals: 2,
    placeholder: '1,000.00',
  },
  CENT: {
    code: 'CENT',
    label: 'CENT',
    decimals: 2,
    placeholder: '1,000.00',
  },
  IDR: {
    code: 'IDR',
    label: 'IDR',
    decimals: 0,
    placeholder: '10,000,000',
  },
}

export function parseAppCurrency(value: unknown): AppCurrency {
  return APP_CURRENCIES.includes(value as AppCurrency)
    ? (value as AppCurrency)
    : 'USD'
}

function formatAmount(value: number, currency: AppCurrency): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.trunc(value))
  }

  if (currency === 'CENT') {
    const abs = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value))
    return `${value < 0 ? '-' : ''}${abs}¢`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCurrency(
  value: number,
  currency: AppCurrency = 'USD',
): string {
  return formatAmount(value, currency)
}

export function formatPnL(
  value: number,
  currency: AppCurrency = 'USD',
): string {
  const abs = formatAmount(Math.abs(value), currency)
  if (value < 0) return `-${abs}`
  if (value > 0) return `+${abs}`
  return abs
}
