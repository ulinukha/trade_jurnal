import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { Withdrawal, WithdrawalInput } from '../types/journal'
import { parseAmountInput } from '../utils/amountInput'
import { calcTotalWithdraw, formatCurrency, formatPnL } from '../utils/calc'
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
  const [date, setDate] = useState(defaultDate)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const sorted = [...withdrawals].sort((a, b) => b.date.localeCompare(a.date))
  const totalWithdraw = calcTotalWithdraw(withdrawals)

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
      setError('Tanggal wajib diisi.')
      return
    }
    if (n === null || n <= 0) {
      setError('Jumlah withdraw harus > 0.')
      return
    }
    setError('')
    try {
      await onSave({
        date,
        amount: n,
        note: note.trim() || undefined,
      })
      setAmount('')
      setNote('')
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : 'Gagal menyimpan withdraw.'
      setError(detail)
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm('Hapus catatan withdraw ini?')
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
            <p className="eyebrow">Tarik dana</p>
            <h2 id="withdraw-title">Withdraw</h2>
          </div>
          <button
            type="button"
            className="cal-btn icon modal-close"
            aria-label="Tutup"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="daily-form withdraw-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Tanggal</span>
            <input
              type="date"
              value={date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Jumlah (Rp)</span>
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder="500.000"
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>Catatan (opsional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kebutuhan mendesak"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions modal-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={saving}
            >
              Tutup
            </button>
          </div>
        </form>

        {sorted.length > 0 && (
          <div className="withdraw-history">
            <div className="withdraw-history-head">
              <p className="stat-label">Riwayat</p>
              {totalWithdraw > 0 && (
                <p className="withdraw-history-total down">
                  −{formatCurrency(totalWithdraw)}
                </p>
              )}
            </div>
            <ul className="withdraw-list withdraw-history-list">
              {sorted.map((w) => (
                <li key={w.id}>
                  <div>
                    <span className="withdraw-date">
                      {format(new Date(w.date + 'T12:00:00'), 'd MMM yyyy', {
                        locale: localeId,
                      })}
                    </span>
                    <span className="withdraw-amount down">
                      {formatPnL(-w.amount)}
                    </span>
                    {w.note && <span className="withdraw-note">{w.note}</span>}
                  </div>
                  <button
                    type="button"
                    className="withdraw-delete"
                    aria-label="Hapus withdraw"
                    onClick={() => void handleDelete(w.id)}
                    disabled={saving}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
