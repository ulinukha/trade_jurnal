import {
  calcDailyMetrics,
  calcPeriodSummary,
  calcAccountEquity,
  calcTotalWithdraw,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/calc'
import type { DailyEntry, Withdrawal } from '../types/journal'

interface SummaryCardsProps {
  monthEntries: DailyEntry[]
  allEntries: DailyEntry[]
  selectedEntry: DailyEntry | null
  initialEquity: number | null
  withdrawals: Withdrawal[]
}

function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string
  value: string
  tone?: 'up' | 'down' | 'neutral'
  sub?: string
}) {
  return (
    <article className={`stat ${tone ?? 'neutral'}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </article>
  )
}

export function SummaryCards({
  monthEntries,
  allEntries,
  selectedEntry,
  initialEquity,
  withdrawals,
}: SummaryCardsProps) {
  const month = calcPeriodSummary(monthEntries)
  const allTime = calcPeriodSummary(allEntries)
  const day = selectedEntry ? calcDailyMetrics(selectedEntry) : null
  const totalWithdraw = calcTotalWithdraw(withdrawals)

  const currentEquity =
    initialEquity !== null
      ? calcAccountEquity(initialEquity, allTime.totalProfit, totalWithdraw)
      : null

  return (
    <section className="summary-grid">
      <Stat
        label="Total profit selama ini"
        value={formatCurrency(allTime.totalProfit)}
        tone={allTime.totalProfit >= 0 ? 'up' : 'down'}
        sub={`${allTime.tradingDays} hari trading`}
      />
      <Stat
        label="Equity di akun"
        value={currentEquity !== null ? formatCurrency(currentEquity) : '—'}
        tone="neutral"
        sub={
          totalWithdraw > 0
            ? `Withdraw −${formatCurrency(totalWithdraw)}`
            : initialEquity !== null
              ? `Modal awal ${formatCurrency(initialEquity)}`
              : 'Belum set modal awal'
        }
      />
      <Stat
        label="Profit bulan ini"
        value={formatCurrency(month.totalProfit)}
        tone={month.totalProfit >= 0 ? 'up' : 'down'}
        sub={`Avg ${formatCurrency(month.avgDailyProfit)} / hari`}
      />
      <Stat
        label="Win rate bulan ini"
        value={formatPercent(month.winRate).replace('+', '')}
        tone={month.winRate >= 50 ? 'up' : 'down'}
        sub={`${formatNumber(month.totalWins)}W / ${formatNumber(month.totalLosses)}L`}
      />

      {selectedEntry && day && (
        <>
          <Stat
            label="% kenaikan hari ini"
            value={formatPercent(day.dailyReturnPct)}
            tone={day.dailyReturnPct >= 0 ? 'up' : 'down'}
            sub={selectedEntry.date}
          />
          <Stat
            label="Profit hari ini"
            value={formatCurrency(selectedEntry.dailyProfit)}
            tone={selectedEntry.dailyProfit >= 0 ? 'up' : 'down'}
            sub={`Win rate ${formatPercent(day.winRate).replace('+', '')}`}
          />
        </>
      )}
    </section>
  )
}
