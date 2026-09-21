import { APP_CURRENCIES } from '../types/journal'
import { useCurrency } from '../context/CurrencyContext'

interface CurrencyToggleProps {
  disabled?: boolean
}

export function CurrencyToggle({ disabled }: CurrencyToggleProps) {
  const { currency, setCurrency } = useCurrency()

  return (
    <div className="currency-toggle" role="group" aria-label="Currency">
      {APP_CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          className={`currency-toggle-btn ${currency === code ? 'active' : ''}`}
          aria-pressed={currency === code}
          disabled={disabled}
          onClick={() => {
            if (code !== currency) setCurrency(code)
          }}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
