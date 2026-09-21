import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AppCurrency } from '../types/journal'
import {
  CURRENCY_META,
  formatCurrency as formatCurrencyValue,
  formatPnL as formatPnLValue,
  type CurrencyMeta,
} from '../utils/currency'

interface CurrencyContextValue extends CurrencyMeta {
  currency: AppCurrency
  setCurrency: (currency: AppCurrency) => void
  formatCurrency: (value: number) => string
  formatPnL: (value: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

interface CurrencyProviderProps {
  currency: AppCurrency
  onChange: (currency: AppCurrency) => void
  children: ReactNode
}

export function CurrencyProvider({
  currency,
  onChange,
  children,
}: CurrencyProviderProps) {
  const value = useMemo<CurrencyContextValue>(() => {
    const meta = CURRENCY_META[currency]
    return {
      ...meta,
      currency,
      setCurrency: onChange,
      formatCurrency: (amount) => formatCurrencyValue(amount, currency),
      formatPnL: (amount) => formatPnLValue(amount, currency),
    }
  }, [currency, onChange])

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return ctx
}
