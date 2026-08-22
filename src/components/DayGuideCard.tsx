import { isFutureDate } from '../utils/date'
import {
  calcDayGuide,
  formatCurrency,
  formatPercent,
  STOP_LOSS_PCT,
  TARGET_PCT,
} from '../utils/calc'

interface DayGuideCardProps {
  selectedDate: string
  baseEquity: number | null
  dailyProfit: number | null
}

export function DayGuideCard({
  selectedDate,
  baseEquity,
  dailyProfit,
}: DayGuideCardProps) {
  const guide = calcDayGuide(baseEquity, dailyProfit)
  const upcoming = isFutureDate(selectedDate)

  if (!guide) {
    return (
      <section className="panel guide-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Daily guide</p>
            <h2>{selectedDate.replaceAll('-', '/')}</h2>
          </div>
        </div>
        <p className="empty">
          Starting capital is not set. Add it once in the top panel so the
          target and stop loss can be calculated.
        </p>
      </section>
    )
  }

  return (
    <section className={`panel guide-panel ${guide.shouldStop ? 'danger' : ''}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Daily guide</p>
          <h2>{selectedDate.replaceAll('-', '/')}</h2>
        </div>
      </div>

      <div className="guide-stats">
        <div>
          <p className="stat-label">Reference balance</p>
          <p className="guide-value">{formatCurrency(guide.baseEquity)}</p>
        </div>
        <div>
          <p className="stat-label">
            Profit target ({(TARGET_PCT * 100).toFixed(0)}%)
          </p>
          <p className="guide-value up">{formatCurrency(guide.targetProfit)}</p>
        </div>
        <div>
          <p className="stat-label">
            Max loss / stop ({(STOP_LOSS_PCT * 100).toFixed(1)}%)
          </p>
          <p className="guide-value down">
            −{formatCurrency(guide.stopLossAmount)}
          </p>
        </div>
      </div>

      {guide.progressToTargetPct !== null && (
        <p className="guide-progress">
          Progress to target:{' '}
          <strong
            className={
              (dailyProfit ?? 0) >= 0
                ? 'up'
                : guide.shouldStop
                  ? 'down'
                  : 'down'
            }
          >
            {formatPercent(guide.progressToTargetPct)}
          </strong>
        </p>
      )}

      {guide.shouldStop ? (
        <div className="guide-alert stop" role="alert">
          <strong>STOP trading today.</strong>
          <span>
            Loss is already {guide.lossPctOfBase.toFixed(2)}% of the reference
            balance (limit {(STOP_LOSS_PCT * 100).toFixed(1)}% /{' '}
            {formatCurrency(guide.stopLossAmount)}). Protect capital — continue
            tomorrow.
          </span>
        </div>
      ) : (
        <div className="guide-alert ok">
          <strong>
            {upcoming ? 'Plan for today.' : 'Still within the safe limit.'}
          </strong>
          <span>
            Target {formatCurrency(guide.targetProfit)}.{' '}
            <span className="down">
              Stop if loss reaches {formatCurrency(guide.stopLossAmount)}.
            </span>
          </span>
        </div>
      )}
    </section>
  )
}
