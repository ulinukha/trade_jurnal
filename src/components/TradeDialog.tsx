import { useEffect, useRef, useState, type FormEvent } from 'react'
import type {
  Trade,
  TradeInput,
  TradeResult,
  TradeSession,
  TradeSide,
} from '../types/journal'
import {
  PRESET_PAIRS,
  SESSION_LABELS,
  TRADE_RESULTS,
  TRADE_SESSIONS,
} from '../types/journal'
import { formatAmountInput, parseAmountInput } from '../utils/amountInput'
import { isFutureDate, todayStr } from '../utils/date'
import { AmountInput } from './AmountInput'

interface TradeDialogProps {
  open: boolean
  selectedDate: string
  existing: Trade | null
  prefillPair?: string
  hasInitialEquity: boolean
  saving: boolean
  onSave: (input: TradeInput, imageFile: File | null) => Promise<void>
  onDelete: (trade: Trade) => Promise<void>
  onSelectDate: (date: string) => void
  onClose: () => void
}

const emptyForm = {
  pair: 'XAUUSD',
  side: 'buy' as TradeSide,
  session: '' as TradeSession | '',
  result: 'Pending' as TradeResult,
  entryPrice: '',
  exitPrice: '',
  lot: '',
  profit: '',
  reason: '',
}

export function TradeDialog({
  open,
  selectedDate,
  existing,
  prefillPair,
  hasInitialEquity,
  saving,
  onSave,
  onDelete,
  onSelectDate,
  onClose,
}: TradeDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (existing) {
      setForm({
        pair: existing.pair,
        side: existing.side,
        session: existing.session,
        result: existing.result,
        entryPrice: formatAmountInput(existing.entryPrice, 5),
        exitPrice:
          existing.exitPrice === null
            ? ''
            : formatAmountInput(existing.exitPrice, 5),
        lot: formatAmountInput(existing.lot, 2),
        profit: formatAmountInput(existing.profit),
        reason: existing.reason,
      })
      setImagePreview(existing.chartImageUrl)
    } else {
      setForm({
        ...emptyForm,
        pair: (prefillPair || 'XAUUSD').toUpperCase(),
      })
      setImagePreview('')
    }
    setImageFile(null)
    setError('')
  }, [open, existing, prefillPair])

  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function update<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePickImage(file: File | null) {
    if (file && !file.type.startsWith('image/')) {
      setError('File must be an image.')
      return
    }
    setImageFile(file)
    if (file) setError('')
  }

  function fileFromClipboard(e: ClipboardEvent): File | null {
    const items = e.clipboardData?.items
    if (!items) return null
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) return file
      }
    }
    return null
  }

  useEffect(() => {
    if (!open) return
    function onPaste(e: ClipboardEvent) {
      if (isFutureDate(selectedDate)) return
      const file = fileFromClipboard(e)
      if (!file) return
      e.preventDefault()
      handlePickImage(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [open, selectedDate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!hasInitialEquity) {
      setError('Set starting capital first.')
      return
    }
    if (isFutureDate(selectedDate)) {
      setError('Future dates cannot be logged.')
      return
    }

    const pair = form.pair.trim().toUpperCase()
    if (!pair) {
      setError('Pair is required.')
      return
    }
    if (!form.session) {
      setError('Select an entry session.')
      return
    }

    const entryPrice = parseAmountInput(form.entryPrice, 5)
    const exitPrice =
      form.exitPrice.trim() === ''
        ? null
        : parseAmountInput(form.exitPrice, 5)
    const lot = parseAmountInput(form.lot, 2)
    const profit =
      parseAmountInput(form.profit) ??
      (form.result === 'Pending' || form.result === 'Cancel' ? 0 : null)
    const reason = form.reason.trim()

    if (entryPrice === null) {
      setError('Entry price is invalid.')
      return
    }
    if (lot === null || lot <= 0) {
      setError('Lot must be greater than 0.')
      return
    }
    if (
      form.result !== 'Pending' &&
      form.result !== 'Cancel' &&
      exitPrice === null
    ) {
      setError('Exit price is required unless the result is Pending or Cancel.')
      return
    }
    if (profit === null) {
      setError('Profit is invalid.')
      return
    }
    if (!reason) {
      setError('Reason is required.')
      return
    }

    await onSave(
      {
        date: selectedDate,
        pair,
        side: form.side,
        session: form.session,
        result: form.result,
        entryPrice,
        exitPrice,
        lot,
        profit,
        reason,
      },
      imageFile,
    )
  }

  async function handleDelete() {
    if (!existing) return
    const ok = window.confirm(`Delete ${existing.pair} trade on ${existing.date}?`)
    if (!ok) return
    await onDelete(existing)
  }

  if (!open) return null

  const today = todayStr()
  const futureLocked = isFutureDate(selectedDate, today)

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card trade-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">/trade</p>
            <h2 id="trade-dialog-title">
              {existing ? 'Edit trade' : 'New trade'}
            </h2>
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

        <form className="trade-dialog-grid" onSubmit={handleSubmit}>
          <div
            className={`chart-drop ${imagePreview ? 'has-image' : ''} ${futureLocked ? 'disabled' : ''}`}
            role="button"
            tabIndex={futureLocked ? -1 : 0}
            onClick={() => {
              if (!futureLocked) fileRef.current?.click()
            }}
            onKeyDown={(e) => {
              if (futureLocked) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (futureLocked) return
              const file = e.dataTransfer.files[0]
              if (file) handlePickImage(file)
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview chart" />
            ) : (
              <span>
                <strong>Chart screenshot (optional)</strong>
                <em>
                  Click, paste (⌘V / Ctrl+V), or drop a screenshot
                </em>
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
          />

          <div className="trade-dialog-fields">
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                max={today}
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
              />
            </label>

            <div className="field">
              <span>Pair</span>
              <div className="choice-row">
                {PRESET_PAIRS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`choice-chip ${form.pair.toUpperCase() === p ? 'active' : ''}`}
                    onClick={() => update('pair', p)}
                    disabled={futureLocked}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                value={form.pair}
                onChange={(e) => update('pair', e.target.value.toUpperCase())}
                placeholder="Or type another pair"
                disabled={futureLocked}
              />
            </div>

            <div className="field">
              <span>Entry session</span>
              <div className="choice-row">
                {TRADE_SESSIONS.map((session) => (
                  <button
                    key={session}
                    type="button"
                    className={`choice-chip ${form.session === session ? 'active' : ''}`}
                    onClick={() => update('session', session)}
                    disabled={futureLocked}
                  >
                    {SESSION_LABELS[session]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-row cols-2">
              <div className="field">
                <span>Type</span>
                <div className="choice-row">
                  <button
                    type="button"
                    className={`choice-chip buy ${form.side === 'buy' ? 'active' : ''}`}
                    onClick={() => update('side', 'buy')}
                    disabled={futureLocked}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={`choice-chip sell ${form.side === 'sell' ? 'active' : ''}`}
                    onClick={() => update('side', 'sell')}
                    disabled={futureLocked}
                  >
                    Sell
                  </button>
                </div>
              </div>
              <div className="field">
                <span>Result</span>
                <div className="choice-row">
                  {TRADE_RESULTS.map((result) => (
                    <button
                      key={result}
                      type="button"
                      className={`choice-chip result-${result.toLowerCase()} ${form.result === result ? 'active' : ''}`}
                      onClick={() => update('result', result)}
                      disabled={futureLocked}
                    >
                      {result}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field-row">
              <label className="field">
                <span>Entry</span>
                <AmountInput
                  value={form.entryPrice}
                  onChange={(value) => update('entryPrice', value)}
                  maxDecimals={5}
                  placeholder="0"
                  required
                  disabled={futureLocked}
                />
              </label>
              <label className="field">
                <span>
                  Exit{' '}
                  {form.result === 'Pending' || form.result === 'Cancel'
                    ? '(optional)'
                    : ''}
                </span>
                <AmountInput
                  value={form.exitPrice}
                  onChange={(value) => update('exitPrice', value)}
                  maxDecimals={5}
                  placeholder={
                    form.result === 'Pending'
                      ? 'Active'
                      : form.result === 'Cancel'
                        ? '—'
                        : '0'
                  }
                  disabled={futureLocked}
                />
              </label>
              <label className="field">
                <span>Lot</span>
                <AmountInput
                  value={form.lot}
                  onChange={(value) => update('lot', value)}
                  maxDecimals={2}
                  placeholder="0.01"
                  required
                  disabled={futureLocked}
                />
              </label>
              <label className="field">
                <span>Profit (USD)</span>
                <AmountInput
                  allowNegative
                  value={form.profit}
                  onChange={(value) => update('profit', value)}
                  placeholder="0"
                  disabled={futureLocked}
                />
              </label>
            </div>

            <label className="field">
              <span>Reason</span>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => update('reason', e.target.value)}
                placeholder="Why did you take this entry?"
                required
                disabled={futureLocked}
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={saving || !hasInitialEquity || futureLocked}
              >
                {saving ? 'Saving…' : existing ? 'Update' : 'Save'}
              </button>
              {existing && (
                <button
                  type="button"
                  className="btn ghost danger"
                  onClick={() => void handleDelete()}
                  disabled={saving || futureLocked}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="btn ghost"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
