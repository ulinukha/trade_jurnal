import {
  calcAccountEquity,
  calcDailyMetrics,
  calcPeriodSummary,
  calcTotalDeposit,
  calcTotalWithdraw,
  formatCurrency,
  formatPercent,
} from '../utils/calc'
import type { DailyEntry, Withdrawal } from '../types/journal'

interface SummaryCardsProps {
  monthEntries: DailyEntry[]
  allEntries: DailyEntry[]
  selectedEntry: DailyEntry | null
  todayEntry: DailyEntry | null
  initialEquity: number | null
  withdrawals: Withdrawal[]
}

function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a1 1 0 1 1 0 2H6.5a.5.5 0 0 0 0 1H19a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-9c0-.4.1-.78.28-1.12A2.49 2.49 0 0 1 4 6.5Zm13 8.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
      />
    </svg>
  )
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 19V5h2v14H4Zm5-6v6H7v-6h2Zm5-5v11h-2V8h2Zm5-4v15h-2V4h2Z"
      />
    </svg>
  )
}

function IconPulse() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3 13h3.4l1.7-5.1 3.2 10.2 2.2-5.1H21v-2h-6.1L13 16.1 9.8 5.9 6.6 11H3v2Z"
      />
    </svg>
  )
}

function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 .01 20.01A10 10 0 0 0 12 2Zm.8 14.6V18h-1.6v-1.4A3.6 3.6 0 0 1 8 13.2l1.4-.5c.2 1 .9 1.7 2.4 1.7 1.2 0 1.9-.5 1.9-1.3 0-.8-.6-1.1-2.1-1.5-2-.5-3.2-1.2-3.2-2.9 0-1.6 1.2-2.8 3-3.1V6h1.6v1.3c1.5.2 2.6 1.1 2.9 2.5l-1.5.4c-.2-.8-.8-1.4-2-1.4-1.1 0-1.8.5-1.8 1.2 0 .8.6 1.1 2.2 1.5 2 .6 3.1 1.3 3.1 3 0 1.7-1.2 2.9-3.1 3.2Z"
      />
    </svg>
  )
}

export function SummaryCards({
  monthEntries,
  allEntries,
  selectedEntry,
  todayEntry,
  initialEquity,
  withdrawals,
}: SummaryCardsProps) {
  const month = calcPeriodSummary(monthEntries)
  const allTime = calcPeriodSummary(allEntries)
  const dayEntry = todayEntry ?? selectedEntry
  const day = dayEntry ? calcDailyMetrics(dayEntry) : null
  const balance =
    initialEquity !== null
      ? calcAccountEquity(
          initialEquity,
          allTime.totalProfit,
          calcTotalWithdraw(withdrawals),
          calcTotalDeposit(withdrawals),
        )
      : null

  return (
    <section className="summary-grid">
      <article className="stat tone-orange">
        <div>
          <p className="stat-label">Current Balance</p>
          <p className="stat-value">
            {balance !== null ? formatCurrency(balance) : '—'}
          </p>
          <p className="stat-sub">
            {initialEquity !== null
              ? `Capital ${formatCurrency(initialEquity)}`
              : 'Starting capital not set'}
          </p>
        </div>
        <span className="stat-icon">
          <IconWallet />
        </span>
      </article>

      <article
        className={`stat tone-green ${allTime.totalProfit < 0 ? 'tone-red' : ''}`}
      >
        <div>
          <p className="stat-label">Total Profit</p>
          <p className="stat-value">{formatCurrency(allTime.totalProfit)}</p>
          <p className="stat-sub">
            {allTime.tradingDays} days · {allTime.totalEntries} trades
          </p>
        </div>
        <span className="stat-icon">
          <IconChart />
        </span>
      </article>

      <article
        className={`stat tone-purple ${day && day.dailyReturnPct < 0 ? 'tone-red' : ''}`}
      >
        <div>
          <p className="stat-label">Daily % Growth</p>
          <p className="stat-value">
            {day ? formatPercent(day.dailyReturnPct) : '—'}
          </p>
          <p className="stat-sub">
            {dayEntry ? dayEntry.date : 'No trades today'}
          </p>
        </div>
        <span className="stat-icon">
          <IconPulse />
        </span>
      </article>

      <article
        className={`stat tone-cyan ${month.totalProfit < 0 ? 'tone-red' : ''}`}
      >
        <div>
          <p className="stat-label">Total PnL Today</p>
          <p className="stat-value">
            {todayEntry ? formatCurrency(todayEntry.dailyProfit) : '—'}
          </p>
          <p className="stat-sub">
            {todayEntry
              ? `${todayEntry.totalEntries} deal`
              : 'No trades today'}
          </p>
        </div>
        <span className="stat-icon">
          <IconCoin />
        </span>
      </article>
    </section>
  )
}
