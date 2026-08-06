import { useEffect } from 'react'
import type { DailyEntry, Withdrawal } from '../types/journal'
import {
  calcDailyMetrics,
  calcDayGuide,
  formatCurrency,
  formatPercent,
  formatPnL,
  STOP_LOSS_PCT,
  TARGET_PCT,
} from '../utils/calc'

interface DayDetailModalProps {
  date: string
  entry: DailyEntry | null
  dayWithdrawals: Withdrawal[]
  dayEquity: number | null
  onClose: () => void
  onEdit: () => void
}

export function DayDetailModal({
  date,
  entry,
  dayWithdrawals,
  dayEquity,
  onClose,
  onEdit,
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
  const withdrawTotal = dayWithdrawals.reduce((s, w) => s + w.amount, 0)
  const hasData = Boolean(entry) || dayWithdrawals.length > 0

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Detail harian</p>
            <h2 id="day-detail-title">{date}</h2>
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

        {!hasData ? (
          <p className="empty">Belum ada data di tanggal ini.</p>
        ) : (
          <>
            {entry && metrics && (
              <div className="modal-stats">
                <div>
                  <p className="stat-label">Equity awal hari</p>
                  <p className="guide-value">
                    {formatCurrency(entry.startingEquity)}
                  </p>
                </div>
                <div>
                  <p className="stat-label">Equity akhir</p>
                  <p className="guide-value">
                    {formatCurrency(metrics.endingEquity)}
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
                  <p className="stat-label">% kenaikan</p>
                  <p
                    className={`guide-value ${metrics.dailyReturnPct >= 0 ? 'up' : 'down'}`}
                  >
                    {formatPercent(metrics.dailyReturnPct)}
                  </p>
                </div>
                <div>
                  <p className="stat-label">Total entry</p>
                  <p className="guide-value">{entry.totalEntries}</p>
                </div>
                <div>
                  <p className="stat-label">Win / Loss</p>
                  <p className="guide-value">
                    <span className="up">{entry.profitEntries}W</span>
                    {' / '}
                    <span className="down">{entry.lostEntries}L</span>
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

            {dayWithdrawals.length > 0 && (
              <div className="modal-withdraws">
                <p className="stat-label">Withdraw</p>
                <ul className="withdraw-list compact">
                  {dayWithdrawals.map((w) => (
                    <li key={w.id}>
                      <span className="withdraw-amount down">
                        {formatPnL(-w.amount)}
                      </span>
                      {w.note && <span className="withdraw-note">{w.note}</span>}
                    </li>
                  ))}
                </ul>
                {dayWithdrawals.length > 1 && (
                  <p className="hint">
                    Total withdraw: {formatPnL(-withdrawTotal)}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {guide?.shouldStop && (
          <p className="form-stop-banner" role="alert">
            STOP — loss sudah melewati batas {(STOP_LOSS_PCT * 100).toFixed(1)}%.
          </p>
        )}

        <div className="form-actions modal-actions">
          {entry ? (
            <button type="button" className="btn primary" onClick={onEdit}>
              Edit data
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={onEdit}>
              Isi data trading
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
