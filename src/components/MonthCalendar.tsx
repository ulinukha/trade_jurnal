import { useState } from 'react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { buildMonthWeeks, shiftMonth } from '../utils/calendar'
import {
  calcPeriodSummary,
  formatNumber,
  formatPnL,
} from '../utils/calc'
import { isFutureDate, todayStr } from '../utils/date'
import type { DailyEntry, Withdrawal } from '../types/journal'

const WEEKDAYS_ALL = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const WEEKDAYS_HIDE = ['MON', 'TUE', 'WED', 'THU', 'FRI']

interface MonthCalendarProps {
  monthValue: string
  entries: DailyEntry[]
  withdrawals: Withdrawal[]
  selectedDate: string
  pairs: string[]
  pairFilter: string
  onPairFilter: (pair: string) => void
  onSelectDate: (date: string) => void
  onMonthChange: (month: string) => void
}

function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  const start = new Date(2026, 0, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: enUS }),
    })
  }

  return options.reverse()
}

const MONTH_OPTIONS = buildMonthOptions()
const MONTH_VALUES = new Set(MONTH_OPTIONS.map((o) => o.value))

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M8 3.5v3.5M16 3.5v3.5M3.5 10h17"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"
      />
    </svg>
  )
}

function formatDayPct(value: number): string {
  return `${Math.round(Math.abs(value))}%`
}

function dayReturnPct(entry: DailyEntry): number | null {
  if (!entry.startingEquity) return null
  return (entry.dailyProfit / entry.startingEquity) * 100
}

export function MonthCalendar({
  monthValue,
  entries,
  withdrawals,
  selectedDate,
  pairs,
  pairFilter,
  onPairFilter,
  onSelectDate,
  onMonthChange,
}: MonthCalendarProps) {
  const [hideWeekend, setHideWeekend] = useState(true)
  const [year, month] = monthValue.split('-').map(Number)
  const weeks = buildMonthWeeks(year, month, entries, withdrawals)
  const summary = calcPeriodSummary(entries)
  const today = todayStr()
  const winDays = entries.filter((e) => e.dailyProfit > 0).length
  const lossDays = entries.filter((e) => e.dailyProfit < 0).length
  const weekdays = hideWeekend ? WEEKDAYS_HIDE : WEEKDAYS_ALL
  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy', {
    locale: enUS,
  })

  const prevMonth = shiftMonth(monthValue, -1)
  const nextMonth = shiftMonth(monthValue, 1)
  const canPrev = MONTH_VALUES.has(prevMonth)
  const canNext = MONTH_VALUES.has(nextMonth)

  return (
    <section className="calendar-panel">
      <div className="calendar-toolbar">
        <div className="calendar-title-row">
          <span className="calendar-icon" aria-hidden>
            <IconCalendar />
          </span>
          <div>
            <h2>Daily PnL Calendar</h2>
            <p className="hint">MT5 Closed Deals History</p>
          </div>
        </div>
        <label className="cal-hide-weekend">
          <input
            type="checkbox"
            checked={hideWeekend}
            onChange={(e) => setHideWeekend(e.target.checked)}
          />
          Hide Weekend
        </label>
      </div>

      <div className="calendar-controls">
        <select
          className="cal-filter"
          value={pairFilter}
          onChange={(e) => onPairFilter(e.target.value)}
          aria-label="Filter pair"
        >
          <option value="all">All Symbols</option>
          {pairs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <div className="calendar-month-nav">
          <button
            type="button"
            className="cal-nav-btn"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => onMonthChange(prevMonth)}
          >
            ‹
          </button>
          <span className="cal-month-label">{monthLabel}</span>
          <button
            type="button"
            className="cal-nav-btn"
            aria-label="Next month"
            disabled={!canNext}
            onClick={() => onMonthChange(nextMonth)}
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-stats">
        <div className="cal-stat">
          <span>Month PnL</span>
          <strong className={summary.totalProfit >= 0 ? 'up' : 'down'}>
            {formatPnL(summary.totalProfit)}
          </strong>
        </div>
        <div className="cal-stat">
          <span>Day P/L</span>
          <strong className="cal-stat-split">
            <em className="up">{winDays}d</em>
            <i>/</i>
            <em className="down">{lossDays}d</em>
          </strong>
        </div>
        <div className="cal-stat">
          <span>Pos P/L</span>
          <strong className="cal-stat-split">
            <em className="up">{formatNumber(summary.totalWins)}</em>
            <i>/</i>
            <em className="down">{formatNumber(summary.totalLosses)}</em>
          </strong>
        </div>
        <div className="cal-stat">
          <span>Deals</span>
          <strong>{formatNumber(summary.totalEntries)}</strong>
        </div>
      </div>

      <div
        className={`calendar-grid ${hideWeekend ? 'hide-weekend' : ''}`}
        role="grid"
        aria-label="Trading calendar"
      >
        <div className="calendar-head" role="row">
          {weekdays.map((d) => (
            <div
              key={d}
              className={`calendar-head-cell ${d === 'SUN' || d === 'SAT' ? 'weekend' : ''}`}
              role="columnheader"
            >
              {d}
            </div>
          ))}
          <div className="calendar-head-cell week-col" role="columnheader">
            Total
          </div>
        </div>

        {weeks.map((week, wi) => {
          const visibleDays = hideWeekend
            ? week.days.filter((day) => !day.isWeekend)
            : week.days
          const hasWeekData = week.totalTrades > 0
          const weekTone = !hasWeekData
            ? 'empty'
            : week.totalProfit > 0
              ? 'profit'
              : week.totalProfit < 0
                ? 'loss'
                : 'flat'

          return (
            <div key={wi} className="calendar-row" role="row">
              {visibleDays.map((day) => {
                if (!day.inMonth) {
                  return (
                    <div
                      key={day.date}
                      className={`day-cell out ${day.isWeekend ? 'weekend' : ''}`}
                      role="gridcell"
                      aria-hidden
                    />
                  )
                }

                const entry = day.entry
                const profit = entry?.dailyProfit
                const hasEntry = Boolean(entry)
                const cashflowNet = day.cashflowNet
                const hasCashflow = cashflowNet !== 0
                const tone = day.isWeekend
                  ? hasCashflow
                    ? cashflowNet > 0
                      ? 'deposit'
                      : 'withdraw'
                    : 'weekend'
                  : hasEntry
                    ? profit! > 0
                      ? 'profit'
                      : profit! < 0
                        ? 'loss'
                        : 'flat'
                    : hasCashflow
                      ? cashflowNet > 0
                        ? 'deposit'
                        : 'withdraw'
                      : 'empty'
                const selected = day.date === selectedDate
                const future = isFutureDate(day.date, today)
                const dayPct = entry ? dayReturnPct(entry) : null

                return (
                  <button
                    key={day.date}
                    type="button"
                    role="gridcell"
                    className={`day-cell ${tone} ${selected ? 'selected' : ''} ${future ? 'future' : ''}`}
                    onClick={() => onSelectDate(day.date)}
                  >
                    <span className="day-num">{day.dayNumber}</span>
                    {!future && hasEntry ? (
                      <>
                        <span className="day-pnl">{formatPnL(profit!)}</span>
                        {dayPct != null && (
                          <span className="day-pct">{formatDayPct(dayPct)}</span>
                        )}
                      </>
                    ) : !future && hasCashflow ? (
                      <span className="day-pnl">
                        {cashflowNet > 0 ? '+' : ''}
                        {formatPnL(cashflowNet)}
                      </span>
                    ) : null}
                  </button>
                )
              })}

              <div className={`week-total ${weekTone}`} role="gridcell">
                <span className="week-label">W{wi + 1}</span>
                {hasWeekData ? (
                  <>
                    <span
                      className={`week-pnl ${week.totalProfit >= 0 ? 'up' : 'down'}`}
                    >
                      {formatPnL(week.totalProfit)}
                    </span>
                    {week.returnPct != null && (
                      <span className="week-pct">
                        {formatDayPct(week.returnPct)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="week-empty">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
