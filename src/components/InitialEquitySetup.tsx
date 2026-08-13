import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import type { Withdrawal, WithdrawalInput } from '../types/journal'
import { formatAmountInput, parseAmountInput } from '../utils/amountInput'
import { formatCurrency } from '../utils/calc'
import { WithdrawModal } from './WithdrawModal'
import { AmountInput } from './AmountInput'

interface InitialEquitySetupProps {
  initialEquity: number | null
  withdrawals: Withdrawal[]
  saving: boolean
  onSave: (value: number) => Promise<void>
  onAddWithdraw: (input: WithdrawalInput) => Promise<void>
  onDeleteWithdraw: (id: string) => Promise<void>
}

export function InitialEquitySetup({
  initialEquity,
  withdrawals,
  saving,
  onSave,
  onAddWithdraw,
  onDeleteWithdraw,
}: InitialEquitySetupProps) {
  const [value, setValue] = useState(
    initialEquity !== null ? formatAmountInput(initialEquity) : '',
  )
  const [editing, setEditing] = useState(initialEquity === null)
  const [error, setError] = useState('')
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const n = parseAmountInput(value)
    if (n === null || n <= 0) {
      setError('Modal awal harus angka > 0.')
      return
    }
    setError('')
    await onSave(n)
    setEditing(false)
  }

  if (!editing && initialEquity !== null) {
    return (
      <>
        <section className="panel capital-panel">
          <div className="panel-header capital-header-compact">
            <div>
              <p className="eyebrow">Modal awal</p>
              <h2>{formatCurrency(initialEquity)}</h2>
            </div>
            <div className="panel-header-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => setWithdrawOpen(true)}
              >
                Saldo
                {withdrawals.length > 0 && (
                  <span className="btn-badge">{withdrawals.length}</span>
                )}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setValue(formatAmountInput(initialEquity))
                  setEditing(true)
                }}
              >
                Ubah
              </button>
            </div>
          </div>
        </section>

        {withdrawOpen && (
          <WithdrawModal
            defaultDate={format(new Date(), 'yyyy-MM-dd')}
            withdrawals={withdrawals}
            saving={saving}
            onClose={() => setWithdrawOpen(false)}
            onSave={onAddWithdraw}
            onDelete={onDeleteWithdraw}
          />
        )}
      </>
    )
  }

  return (
    <section className="panel capital-panel highlight">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Setup sekali</p>
          <h2>{initialEquity === null ? 'Isi modal awal' : 'Ubah modal awal'}</h2>
        </div>
      </div>
      <form className="daily-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Modal / equity awal (Rp)</span>
          <AmountInput
            value={value}
            onChange={setValue}
            placeholder="10.000.000"
            required
            autoFocus
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan modal awal'}
          </button>
          {initialEquity !== null && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
