import { useEffect, useState, type FormEvent } from 'react'
import type { DailyEntry, DailyEntryInput } from '../types/journal'
import { formatCurrency } from '../utils/calc'

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
  totalEntries: '',
  lostEntries: '',
  profitEntries: '',
  dailyProfit: '',
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
        totalEntries: String(existing.totalEntries),
        lostEntries: String(existing.lostEntries),
        profitEntries: String(existing.profitEntries),
        dailyProfit: String(existing.dailyProfit),
      })
    } else {
      setForm(emptyForm)
    }
    setMoveDate(selectedDate)
    setError('')
  }, [existing, selectedDate])

  useEffect(() => {
    const profit =
      form.dailyProfit === '' || Number.isNaN(Number(form.dailyProfit))
        ? null
        : Number(form.dailyProfit)
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

    const totalEntries = Number(form.totalEntries)
    const lostEntries = Number(form.lostEntries)
    const profitEntries = Number(form.profitEntries)
    const dailyProfit = Number(form.dailyProfit)

    if (
      [totalEntries, lostEntries, profitEntries].some(
        (n) => Number.isNaN(n) || n < 0 || !Number.isInteger(n),
      )
    ) {
      setError('Jumlah entry harus bilangan bulat ≥ 0.')
      return
    }
    if (lostEntries + profitEntries > totalEntries) {
      setError('Lost + profit entry tidak boleh melebihi total entry.')
      return
    }
    if (Number.isNaN(dailyProfit)) {
      setError('Total profit hari ini tidak valid.')
      return
    }

    await onSave({
      date: selectedDate,
      totalEntries,
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

  const liveProfit =
    form.dailyProfit === '' || Number.isNaN(Number(form.dailyProfit))
      ? null
      : Number(form.dailyProfit)

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
            <span>Total entry</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.totalEntries}
              onChange={(e) => update('totalEntries', e.target.value)}
              placeholder="0"
              required
            />
          </label>
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

        <label className="field">
          <span>Total profit hari ini (Rp)</span>
          <input
            type="number"
            step="any"
            value={form.dailyProfit}
            onChange={(e) => update('dailyProfit', e.target.value)}
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
