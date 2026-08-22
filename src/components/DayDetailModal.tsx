import { useEffect } from 'react'
import type { DailyEntry, Trade, Withdrawal } from '../types/journal'
import { SESSION_LABELS } from '../types/journal'
import {
  calcDailyMetrics,
  calcDayGuide,
  calcNetCashflow,
  cashflowSigned,
  cashflowType,
  formatCurrency,
  formatPercent,
  formatPnL,
  formatPrice,
  STOP_LOSS_PCT,
  TARGET_PCT,
} from '../utils/calc'

interface DayDetailModalProps {
  date: string
  entry: DailyEntry | null
  trades: Trade[]
  dayWithdrawals: Withdrawal[]
  dayEquity: number | null
  onClose: () => void
  onAdd: () => void
  onEditTrade: (trade: Trade) => void
}

export function DayDetailModal({
  date,
  entry,
  trades,
  dayWithdrawals,
  dayEquity,
  onClose,
  onAdd,
  onEditTrade,
}: DayDetailModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const metrics = entry ? calcDailyMetrics(entry) : null
  const guide = calcDayGuide(dayEquity, entry?.dailyProfit ?? null)
  const cashflowNet = calcNetCashflow(dayWithdrawals)
  const hasData = Boolean(entry) || dayWithdrawals.length > 0 || trades.length > 0

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card modal-card-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Daily detail</p>
            <h2 id="day-detail-title">{date}</h2>
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

        {!hasData ? (
          <p className="empty">No data on this date.</p>
        ) : (
          <>
            {entry && metrics && (
              <div className="modal-stats">
                <div>
                  <p className="stat-label">Reference balance</p>
                  <p className="guide-value">
                    {formatCurrency(entry.startingEquity)}
                  </p>
                </div>
                <div>
                  <p className="stat-label">Profit / loss</p>
                  <p
                    className={`guide-value ${entry.dailyProfit >= 0 ? 'up' : 'down'}`}
                  >
                    {formatPnL(entry.dailyProfit)}
                  </p>
                </div>
                <div>
                  <p className="stat-label">Daily % growth</p>
                  <p
                    className={`guide-value ${metrics.dailyReturnPct >= 0 ? 'up' : 'down'}`}
                  >
                    {formatPercent(metrics.dailyReturnPct)}
                  </p>
                </div>
                <div>
                  <p className="stat-label">Trade</p>
                  <p className="guide-value">
                    {entry.totalEntries} ·{' '}
                    <span className="up">{entry.profitEntries} TP</span>
                    {' / '}
                    <span className="down">{entry.lostEntries} SL</span>
                  </p>
                </div>
                <div>
                  <p className="stat-label">Win rate</p>
                  <p className="guide-value">
                    {formatPercent(metrics.winRate).replace('+', '')}
                  </p>
                </div>
                {guide && (
                  <>
                    <div>
                      <p className="stat-label">
                        Target ({(TARGET_PCT * 100).toFixed(0)}%)
                      </p>
                      <p className="guide-value up">
                        {formatCurrency(guide.targetProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="stat-label">
                        Stop ({(STOP_LOSS_PCT * 100).toFixed(1)}%)
                      </p>
                      <p className="guide-value down">
                        −{formatCurrency(guide.stopLossAmount)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {trades.length > 0 && (
              <div className="modal-trades">
                <p className="stat-label">Trades today</p>
                <ul className="trade-mini-list">
                  {trades.map((trade) => (
                    <li key={trade.id}>
                      <button
                        type="button"
                        className="trade-mini-btn"
                        onClick={() => onEditTrade(trade)}
                      >
                        <span className="trade-mini-copy">
                          <strong>
                            {trade.pair}{' '}
                            <span className={`side-tag ${trade.side}`}>
                              {trade.side === 'buy' ? 'Buy' : 'Sell'}
                            </span>
                          </strong>
                          <span className="hint">
                            {SESSION_LABELS[trade.session]} ·{' '}
                            {formatPrice(trade.entryPrice)}
                            {trade.exitPrice !== null
                              ? ` → ${formatPrice(trade.exitPrice)}`
                              : ' · Active'}
                          </span>
                        </span>
                        <span className="trade-mini-meta">
                          <span
                            className={`result-tag result-${trade.result.toLowerCase()}`}
                          >
                            {trade.result}
                          </span>
                          <span
                            className={trade.profit >= 0 ? 'up' : 'down'}
                          >
                            {formatPnL(trade.profit)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dayWithdrawals.length > 0 && (
              <div className="modal-withdraws">
                <p className="stat-label">Balance changes</p>
                <ul className="withdraw-list compact">
                  {dayWithdrawals.map((w) => {
                    const signed = cashflowSigned(w)
                    const kindLabel =
                      cashflowType(w) === 'deposit' ? 'Deposit' : 'WD'
                    return (
                      <li key={w.id}>
                        <span
                          className={`withdraw-amount ${signed >= 0 ? 'up' : 'down'}`}
                        >
                          <span className="cashflow-chip">{kindLabel}</span>
                          {signed >= 0 ? '+' : ''}
                          {formatPnL(signed)}
                        </span>
                        {w.note && (
                          <span className="withdraw-note">{w.note}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {dayWithdrawals.length > 1 && (
                  <p className="hint">
                    Net:{' '}
                    <span className={cashflowNet >= 0 ? 'up' : 'down'}>
                      {cashflowNet > 0 ? '+' : ''}
                      {formatPnL(cashflowNet)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {guide?.shouldStop && (
          <p className="form-stop-banner" role="alert">
            STOP — loss already exceeded the {(STOP_LOSS_PCT * 100).toFixed(1)}% limit.
          </p>
        )}

        <div className="form-actions modal-actions">
          <button type="button" className="btn primary" onClick={onAdd}>
            Add trade
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
