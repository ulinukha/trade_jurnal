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

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']

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
  onToday: () => void
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
  onToday,
}: MonthCalendarProps) {
  const [year, month] = monthValue.split('-').map(Number)
  const weeks = buildMonthWeeks(year, month, entries, withdrawals)
  const summary = calcPeriodSummary(entries)
  const today = todayStr()
  const winDays = entries.filter((e) => e.dailyProfit > 0).length
  const lossDays = entries.filter((e) => e.dailyProfit < 0).length

  const hasCurrent = MONTH_OPTIONS.some((o) => o.value === monthValue)
  const selectOptions = hasCurrent
    ? MONTH_OPTIONS
    : [
        {
          value: monthValue,
          label: format(new Date(year, month - 1, 1), 'MMMM yyyy', {
            locale: enUS,
          }),
        },
        ...MONTH_OPTIONS,
      ]

  const prevMonth = shiftMonth(monthValue, -1)
  const nextMonth = shiftMonth(monthValue, 1)
  const canPrev = MONTH_VALUES.has(prevMonth)
  const canNext = MONTH_VALUES.has(nextMonth)

  return (
    <section className="calendar-panel">
      <div className="calendar-toolbar">
        <div>
          <p className="eyebrow">Daily PnL</p>
          <h2>Calendar</h2>
        </div>
        <div className="calendar-nav">
          <select
            className="cal-filter"
            value={pairFilter}
            onChange={(e) => onPairFilter(e.target.value)}
            aria-label="Filter pair"
          >
            <option value="all">All symbols</option>
            {pairs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button type="button" className="cal-btn" onClick={onToday}>
            Today
          </button>
          <button
            type="button"
            className="cal-btn icon"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => onMonthChange(prevMonth)}
          >
            ‹
          </button>
          <button
            type="button"
            className="cal-btn icon"
            aria-label="Next month"
            disabled={!canNext}
            onClick={() => onMonthChange(nextMonth)}
          >
            ›
          </button>
          <label className="cal-month-select">
            <span className="sr-only">Select month</span>
            <select
              value={monthValue}
              onChange={(e) => onMonthChange(e.target.value)}
              aria-label="Select month"
            >
              {selectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="calendar-stats">
        <div>
          <span>Month PnL</span>
          <strong className={summary.totalProfit >= 0 ? 'up' : 'down'}>
            {formatPnL(summary.totalProfit)}
          </strong>
        </div>
        <div>
          <span>Day W/L</span>
          <strong>
            {winDays}/{lossDays}
          </strong>
        </div>
        <div>
          <span>Pos W/L</span>
          <strong>
            {formatNumber(summary.totalWins)}/{formatNumber(summary.totalLosses)}
          </strong>
        </div>
        <div>
          <span>Deals</span>
          <strong>{formatNumber(summary.totalEntries)}</strong>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label="Trading calendar">
        <div className="calendar-head" role="row">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="calendar-head-cell"
              role="columnheader"
            >
              {d}
            </div>
          ))}
          <div className="calendar-head-cell week-col" role="columnheader">
            Total
          </div>
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-row" role="row">
            {week.days
              .filter((day) => !day.isWeekend)
              .map((day) => {
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
                        <span className="day-trades">
                          {entry!.totalEntries}x
                        </span>
                      </>
                    ) : !future && hasCashflow ? (
                      <span className="day-pnl">
                        {cashflowNet > 0 ? '+' : ''}
                        {formatPnL(cashflowNet)}
                      </span>
                    ) : (
                      <span className="day-empty-label">—</span>
                    )}
                  </button>
                )
              })}

            <div className="week-total" role="gridcell">
              <span className="week-label">W{wi + 1}</span>
              <span
                className={`week-pnl ${week.totalProfit >= 0 ? 'up' : 'down'}`}
              >
                {formatPnL(week.totalProfit)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
