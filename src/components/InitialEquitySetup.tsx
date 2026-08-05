import { useState, type FormEvent } from 'react'
import { formatCurrency } from '../utils/calc'

interface InitialEquitySetupProps {
  initialEquity: number | null
  saving: boolean
  onSave: (value: number) => Promise<void>
}

export function InitialEquitySetup({
  initialEquity,
  saving,
  onSave,
}: InitialEquitySetupProps) {
  const [value, setValue] = useState(
    initialEquity !== null ? String(initialEquity) : '',
  )
  const [editing, setEditing] = useState(initialEquity === null)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const n = Number(value)
    if (Number.isNaN(n) || n <= 0) {
      setError('Modal awal harus angka > 0.')
      return
    }
    setError('')
    await onSave(n)
    setEditing(false)
  }

  if (!editing && initialEquity !== null) {
    return (
      <section className="panel capital-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Modal awal</p>
            <h2>{formatCurrency(initialEquity)}</h2>
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setValue(String(initialEquity))
              setEditing(true)
            }}
          >
            Ubah
          </button>
        </div>
        <p className="empty">
          Hanya diisi sekali. Equity tiap hari dihitung otomatis dari sini +
          profit hari-hari sebelumnya.
        </p>
      </section>
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
          <input
            type="number"
            min="1"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="10000000"
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
