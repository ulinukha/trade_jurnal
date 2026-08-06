import { useEffect, useState, type FormEvent } from 'react'
import type { DailyEntry, DailyEntryInput } from '../types/journal'
import { formatAmountInput, parseAmountInput } from '../utils/amountInput'
import { formatCurrency } from '../utils/calc'
import { AmountInput } from './AmountInput'

interface DailyFormProps {
  selectedDate: string
  existing: DailyEntry | null
  /** Equity otomatis untuk tanggal terpilih (dari modal awal). */
  dayEquity: number | null
  hasInitialEquity: boolean
  saving: boolean
  onSave: (input: DailyEntryInput) => Promise<void>
  onDelete: (date: string) => Promise<void>
  onMove: (fromDate: string, toDate: string) => Promise<void>
  onSelectDate: (date: string) => void
  onDraftProfitChange?: (profit: number | null) => void
}

const emptyForm = {
  lostEntries: '',
  profitEntries: '',
  dailyProfit: '',
}

function parseCount(raw: string): number | null {
  if (raw === '') return null
  const n = Number(raw)
  if (Number.isNaN(n) || n < 0 || !Number.isInteger(n)) return null
  return n
}

export function DailyForm({
  selectedDate,
  existing,
  dayEquity,
  hasInitialEquity,
  saving,
  onSave,
  onDelete,
  onMove,
  onSelectDate,
  onDraftProfitChange,
}: DailyFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [moveDate, setMoveDate] = useState(selectedDate)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        lostEntries: String(existing.lostEntries),
        profitEntries: String(existing.profitEntries),
        dailyProfit: formatAmountInput(existing.dailyProfit),
      })
    } else {
      setForm(emptyForm)
    }
    setMoveDate(selectedDate)
    setError('')
  }, [existing, selectedDate])

  useEffect(() => {
    const profit = parseAmountInput(form.dailyProfit)
    onDraftProfitChange?.(profit)
  }, [form.dailyProfit, onDraftProfitChange])

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!hasInitialEquity) {
      setError('Isi modal awal dulu di atas.')
      return
    }

    const lostEntries = parseCount(form.lostEntries)
    const profitEntries = parseCount(form.profitEntries)
    const dailyProfit = parseAmountInput(form.dailyProfit)

    if (lostEntries === null || profitEntries === null) {
      setError('Jumlah lost & profit entry harus bilangan bulat ≥ 0.')
      return
    }
    if (dailyProfit === null) {
      setError('Total profit hari ini tidak valid.')
      return
    }

    await onSave({
      date: selectedDate,
      lostEntries,
      profitEntries,
      dailyProfit,
    })
  }

  async function handleDelete() {
    if (!existing) return
    const ok = window.confirm(`Hapus data tanggal ${selectedDate}?`)
    if (!ok) return
    await onDelete(selectedDate)
  }

  async function handleMove() {
    if (!existing || moveDate === selectedDate) return
    const ok = window.confirm(
      `Pindahkan data dari ${selectedDate} ke ${moveDate}?`,
    )
    if (!ok) return
    try {
      await onMove(selectedDate, moveDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal pindah tanggal.')
    }
  }

  const liveProfit = parseAmountInput(form.dailyProfit)
  const lostCount = parseCount(form.lostEntries)
  const profitCount = parseCount(form.profitEntries)
  const totalTrades =
    lostCount !== null && profitCount !== null ? lostCount + profitCount : null

  const previewPct =
    dayEquity && liveProfit !== null
      ? (liveProfit / dayEquity) * 100
      : null

  return (
    <section className="panel form-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Input harian</p>
          <h2>Catat trading</h2>
        </div>
        {existing && <span className="badge">Edit</span>}
      </div>

      <label className="field form-date-field">
        <span>Tanggal</span>
        <input
          type="date"
          value={existing ? moveDate : selectedDate}
          onChange={(e) => {
            if (existing) {
              setMoveDate(e.target.value)
            } else {
              onSelectDate(e.target.value)
            }
          }}
        />
        {existing && moveDate !== selectedDate && (
          <small className="hint">
            Tanggal diubah — klik “Pindah tanggal” untuk menyimpan pindahan.
          </small>
        )}
      </label>

      {dayEquity !== null && (
        <p className="equity-readonly">
          Equity hari ini (otomatis):{' '}
          <strong>{formatCurrency(dayEquity)}</strong>
        </p>
      )}

      <form className="daily-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label className="field">
            <span>Lost entry</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.lostEntries}
              onChange={(e) => update('lostEntries', e.target.value)}
              placeholder="0"
              required
            />
          </label>
          <label className="field">
            <span>Profit entry</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.profitEntries}
              onChange={(e) => update('profitEntries', e.target.value)}
              placeholder="0"
              required
            />
          </label>
        </div>

        {totalTrades !== null && (
          <p className="equity-readonly trade-total">
            Total trade: <strong>{totalTrades}</strong>
          </p>
        )}

        <label className="field">
          <span>Total profit hari ini (Rp)</span>
          <AmountInput
            allowNegative
            value={form.dailyProfit}
            onChange={(value) => update('dailyProfit', value)}
            placeholder="0"
            required
          />
          {previewPct !== null && !Number.isNaN(previewPct) && (
            <small className={`hint ${previewPct >= 0 ? 'up' : 'down'}`}>
              % vs equity: {previewPct >= 0 ? '+' : ''}
              {previewPct.toFixed(2)}%
            </small>
          )}
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={saving || !hasInitialEquity}
          >
            {saving ? 'Menyimpan…' : existing ? 'Update' : 'Simpan'}
          </button>
          {existing && moveDate !== selectedDate && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => void handleMove()}
              disabled={saving}
            >
              Pindah tanggal
            </button>
          )}
          {existing && (
            <button
              type="button"
              className="btn ghost danger"
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              Hapus
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
