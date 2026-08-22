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

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2 4 5v6.5c0 5 3.4 9.4 8 10.5 4.6-1.1 8-5.5 8-10.5V5l-8-3Zm0 2.2 6 2.25V11.5c0 3.9-2.5 7.3-6 8.4-3.5-1.1-6-4.5-6-8.4V6.45l6-2.25Z"
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

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M7 4h10v2h2.5a1.5 1.5 0 0 1 1.5 1.5V9a4 4 0 0 1-3.2 3.9A5.01 5.01 0 0 1 13 16.9V18h3v2H8v-2h3v-1.1A5.01 5.01 0 0 1 6.2 12.9 4 4 0 0 1 3 9V7.5A1.5 1.5 0 0 1 4.5 6H7V4Zm0 4H4.5V9a2 2 0 0 0 2 2V8Zm10 0v3a2 2 0 0 0 2-2V8H17Z"
      />
    </svg>
  )
}

export function SummaryCards({
  monthEntries: _monthEntries,
  allEntries,
  selectedEntry,
  todayEntry,
  initialEquity,
  withdrawals,
}: SummaryCardsProps) {
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
        <div className="stat-face">
          <div className="stat-copy">
            <p className="stat-label">Current Balance</p>
            <p className="stat-value">
              {balance !== null ? formatCurrency(balance) : '—'}
              {balance !== null && <span className="stat-unit">USD</span>}
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
        </div>
      </article>

      <article className="stat tone-blue">
        <div className="stat-face">
          <div className="stat-copy">
            <p className="stat-label">Total Profit</p>
            <p
              className={`stat-value ${allTime.totalProfit > 0 ? 'is-up' : allTime.totalProfit < 0 ? 'is-down' : ''}`}
            >
              {formatCurrency(allTime.totalProfit)}
              <span className="stat-unit">USD</span>
            </p>
            <p className="stat-sub accent">
              {allTime.tradingDays} days · {allTime.totalEntries} trades
            </p>
          </div>
          <span className="stat-icon">
            <IconShield />
          </span>
        </div>
      </article>

      <article className="stat tone-purple">
        <div className="stat-face">
          <div className="stat-copy">
            <p className="stat-label">Daily % Growth</p>
            <p
              className={`stat-value ${day && day.dailyReturnPct > 0 ? 'is-up' : day && day.dailyReturnPct < 0 ? 'is-down' : ''}`}
            >
              {day ? formatPercent(day.dailyReturnPct) : '—'}
            </p>
            <p className="stat-sub">
              {dayEntry ? dayEntry.date : 'No trades today'}
            </p>
          </div>
          <span className="stat-icon">
            <IconChart />
          </span>
        </div>
      </article>

      <article className="stat tone-green">
        <div className="stat-face">
          <div className="stat-copy">
            <p className="stat-label">Total PnL Today</p>
            <p
              className={`stat-value ${todayEntry && todayEntry.dailyProfit > 0 ? 'is-up' : todayEntry && todayEntry.dailyProfit < 0 ? 'is-down' : ''}`}
            >
              {todayEntry ? formatCurrency(todayEntry.dailyProfit) : '—'}
              {todayEntry && <span className="stat-unit">USD</span>}
            </p>
            <p className="stat-sub">
              {todayEntry
                ? `${todayEntry.totalEntries} deal`
                : 'No trades today'}
            </p>
          </div>
          <span className="stat-icon">
            <IconTrophy />
          </span>
        </div>
      </article>
    </section>
  )
}
