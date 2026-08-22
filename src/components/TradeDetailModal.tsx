import { useEffect } from 'react'
import type { Trade } from '../types/journal'
import { SESSION_LABELS } from '../types/journal'
import { formatCurrency, formatPrice } from '../utils/calc'

interface TradeDetailModalProps {
  trade: Trade
  onClose: () => void
  onEdit: (trade: Trade) => void
}

export function TradeDetailModal({
  trade,
  onClose,
  onEdit,
}: TradeDetailModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const open = trade.result === 'Pending'

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card trade-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Trade detail</p>
            <h2 id="trade-detail-title">
              {trade.pair} · {trade.date}
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

        {trade.chartImageUrl ? (
          <img
            src={trade.chartImageUrl}
            alt={`Chart ${trade.pair}`}
            className="trade-detail-chart"
          />
        ) : (
          <p className="empty">No chart screenshot.</p>
        )}

        <div className="modal-stats">
          <div>
            <p className="stat-label">Type</p>
            <p className="guide-value">
              <span className={`side-tag ${trade.side}`}>
                {trade.side === 'buy' ? 'BUY' : 'SELL'}
              </span>
            </p>
          </div>
          <div>
            <p className="stat-label">Result</p>
            <p className="guide-value">
              <span className={`result-tag result-${trade.result.toLowerCase()}`}>
                {trade.result}
              </span>
            </p>
          </div>
          <div>
            <p className="stat-label">Status</p>
            <p className="guide-value">
              <span className={`status-tag ${open ? 'open' : 'closed'}`}>
                <span className="status-dot" />
                {open ? 'OPEN' : 'CLOSED'}
              </span>
            </p>
          </div>
          <div>
            <p className="stat-label">Session</p>
            <p className="guide-value">{SESSION_LABELS[trade.session]}</p>
          </div>
          <div>
            <p className="stat-label">Entry</p>
            <p className="guide-value">{formatPrice(trade.entryPrice)}</p>
          </div>
          <div>
            <p className="stat-label">Exit</p>
            <p className="guide-value">
              {trade.exitPrice === null ? '—' : formatPrice(trade.exitPrice)}
            </p>
          </div>
          <div>
            <p className="stat-label">Profit</p>
            <p className={`guide-value ${trade.profit >= 0 ? 'up' : 'down'}`}>
              {formatCurrency(trade.profit)}
            </p>
          </div>
        </div>

        <div className="trade-detail-reason">
          <p className="stat-label">Reason</p>
          <p>{trade.reason}</p>
        </div>

        <div className="form-actions modal-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => onEdit(trade)}
          >
            Edit trade
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
