import type { InputHTMLAttributes } from 'react'
import { formatAmountInputFromString } from '../utils/amountInput'

interface AmountInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  allowNegative?: boolean
}

export function AmountInput({
  value,
  onChange,
  allowNegative = false,
  inputMode = 'numeric',
  ...props
}: AmountInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={value}
      onChange={(e) =>
        onChange(formatAmountInputFromString(e.target.value, allowNegative))
      }
    />
  )
}
