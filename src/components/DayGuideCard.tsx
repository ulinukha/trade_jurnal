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

  if (!guide) {
    return (
      <section className="panel guide-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Panduan hari ini</p>
            <h2>{selectedDate}</h2>
          </div>
        </div>
        <p className="empty">
          Belum ada modal awal. Isi modal awal sekali di panel atas agar target
          & stop loss bisa dihitung.
        </p>
      </section>
    )
  }

  return (
    <section className={`panel guide-panel ${guide.shouldStop ? 'danger' : ''}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Panduan hari ini</p>
          <h2>{selectedDate}</h2>
        </div>
      </div>

      <div className="guide-stats">
        <div>
          <p className="stat-label">Equity acuan (hari sebelumnya)</p>
          <p className="guide-value">{formatCurrency(guide.baseEquity)}</p>
        </div>
        <div>
          <p className="stat-label">
            Target profit ({(TARGET_PCT * 100).toFixed(0)}%)
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
          Progress ke target:{' '}
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
          <strong>STOP trading hari ini.</strong>
          <span>
            Loss sudah {guide.lossPctOfBase.toFixed(2)}% dari equity hari
            sebelumnya (batas {(STOP_LOSS_PCT * 100).toFixed(1)}% /{' '}
            {formatCurrency(guide.stopLossAmount)}). Lindungi modal — lanjutkan
            besok.
          </span>
        </div>
      ) : (
        <div className="guide-alert ok">
          <strong>Masih dalam batas aman.</strong>
          <span>
            Target hari ini {formatCurrency(guide.targetProfit)}.{' '}
            <span className="down">
              Stop jika loss mencapai {formatCurrency(guide.stopLossAmount)}.
            </span>
          </span>
        </div>
      )}
    </section>
  )
}
