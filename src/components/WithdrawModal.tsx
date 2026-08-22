import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { CashflowType, Withdrawal, WithdrawalInput } from '../types/journal'
import { parseAmountInput } from '../utils/amountInput'
import {
  calcNetCashflow,
  calcTotalDeposit,
  calcTotalWithdraw,
  cashflowSigned,
  cashflowType,
  formatCurrency,
  formatPnL,
} from '../utils/calc'
import { AmountInput } from './AmountInput'

interface WithdrawModalProps {
  defaultDate: string
  withdrawals: Withdrawal[]
  saving: boolean
  onClose: () => void
  onSave: (input: WithdrawalInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function WithdrawModal({
  defaultDate,
  withdrawals,
  saving,
  onClose,
  onSave,
  onDelete,
}: WithdrawModalProps) {
  const [kind, setKind] = useState<CashflowType>('withdraw')
  const [date, setDate] = useState(defaultDate)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const sorted = [...withdrawals].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })
  const totalWithdraw = calcTotalWithdraw(withdrawals)
  const totalDeposit = calcTotalDeposit(withdrawals)
  const net = calcNetCashflow(withdrawals)
  const isDeposit = kind === 'deposit'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const n = parseAmountInput(amount)
    if (!date) {
      setError('Date is required.')
      return
    }
    if (n === null || n <= 0) {
      setError(
        isDeposit
          ? 'Deposit amount must be greater than 0.'
          : 'Withdraw amount must be greater than 0.',
      )
      return
    }
    setError('')
    try {
      await onSave({
        date,
        amount: n,
        type: kind,
        note: note.trim() || undefined,
      })
      setAmount('')
      setNote('')
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : 'Failed to save cashflow.'
      setError(detail)
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm('Delete this cashflow record?')
    if (!ok) return
    await onDelete(id)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card withdraw-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Account funds</p>
            <h2 id="withdraw-title">Manage balance</h2>
          </div>
          <button
            type="button"
            className="cal-btn icon modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="daily-form withdraw-form" onSubmit={handleSubmit}>
          <div className="cashflow-toggle" role="tablist" aria-label="Type">
            <button
              type="button"
              role="tab"
              aria-selected={!isDeposit}
              className={`cashflow-toggle-btn ${!isDeposit ? 'active down' : ''}`}
              onClick={() => setKind('withdraw')}
            >
              Withdraw
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isDeposit}
              className={`cashflow-toggle-btn ${isDeposit ? 'active up' : ''}`}
              onClick={() => setKind('deposit')}
            >
              Deposit
            </button>
          </div>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Amount (USD)</span>
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder="50.00"
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isDeposit ? 'Reason for deposit' : 'Reason for withdraw'
              }
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions modal-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </button>
          </div>
        </form>

        {sorted.length > 0 && (
          <div className="withdraw-history">
            <div className="withdraw-history-head">
              <p className="stat-label">History</p>
              <p
                className={`withdraw-history-total ${net >= 0 ? 'up' : 'down'}`}
              >
                Net {net > 0 ? '+' : ''}
                {formatPnL(net)}
              </p>
            </div>
            {(totalWithdraw > 0 || totalDeposit > 0) && (
              <p className="withdraw-history-breakdown">
                {totalWithdraw > 0 && (
                  <span className="down">WD −{formatCurrency(totalWithdraw)}</span>
                )}
                {totalWithdraw > 0 && totalDeposit > 0 && ' · '}
                {totalDeposit > 0 && (
                  <span className="up">+{formatCurrency(totalDeposit)}</span>
                )}
              </p>
            )}
            <ul className="withdraw-list withdraw-history-list">
              {sorted.map((w) => {
                const signed = cashflowSigned(w)
                const kindLabel =
                  cashflowType(w) === 'deposit' ? 'Deposit' : 'WD'
                return (
                  <li key={w.id}>
                    <div>
                      <span className="withdraw-date">
                        {format(new Date(w.date + 'T12:00:00'), 'd MMM yyyy', {
                          locale: enUS,
                        })}
                        <span className="cashflow-chip">{kindLabel}</span>
                      </span>
                      <span
                        className={`withdraw-amount ${signed >= 0 ? 'up' : 'down'}`}
                      >
                        {signed >= 0 ? '+' : ''}
                        {formatPnL(signed)}
                      </span>
                      {w.note && <span className="withdraw-note">{w.note}</span>}
                    </div>
                    <button
                      type="button"
                      className="withdraw-delete"
                      aria-label="Delete cashflow record"
                      onClick={() => void handleDelete(w.id)}
                      disabled={saving}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
