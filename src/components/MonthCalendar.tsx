import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { buildMonthWeeks, shiftMonth } from '../utils/calendar'
import {
  calcDailyMetrics,
  calcPeriodSummary,
  formatPercent,
  formatPnL,
} from '../utils/calc'
import type { DailyEntry, Withdrawal } from '../types/journal'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface MonthCalendarProps {
  monthValue: string
  entries: DailyEntry[]
  withdrawals: Withdrawal[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onMonthChange: (month: string) => void
  onToday: () => void
}

function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  const start = new Date(2026, 0, 1) // Januari 2026
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: localeId }),
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
  onSelectDate,
  onMonthChange,
  onToday,
}: MonthCalendarProps) {
  const [year, month] = monthValue.split('-').map(Number)
  const weeks = buildMonthWeeks(year, month, entries, withdrawals)
  const monthProfit = calcPeriodSummary(entries).totalProfit

  const hasCurrent = MONTH_OPTIONS.some((o) => o.value === monthValue)
  const selectOptions = hasCurrent
    ? MONTH_OPTIONS
    : [
        {
          value: monthValue,
          label: format(new Date(year, month - 1, 1), 'MMMM yyyy', {
            locale: localeId,
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
        <div className="calendar-nav">
          <button type="button" className="cal-btn" onClick={onToday}>
            Today
          </button>
          <button
            type="button"
            className="cal-btn icon"
            aria-label="Bulan sebelumnya"
            disabled={!canPrev}
            onClick={() => onMonthChange(prevMonth)}
          >
            ‹
          </button>
          <button
            type="button"
            className="cal-btn icon"
            aria-label="Bulan berikutnya"
            disabled={!canNext}
            onClick={() => onMonthChange(nextMonth)}
          >
            ›
          </button>
          <label className="cal-month-select">
            <span className="sr-only">Pilih bulan</span>
            <select
              value={monthValue}
              onChange={(e) => onMonthChange(e.target.value)}
              aria-label="Pilih bulan"
            >
              {selectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <span
            className={`calendar-month-pnl ${monthProfit >= 0 ? 'up' : 'down'}`}
          >
            {formatPnL(monthProfit)}
          </span>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label="Kalender trading">
        <div className="calendar-head" role="row">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={`calendar-head-cell ${d === 'SUN' || d === 'SAT' ? 'weekend' : ''}`}
              role="columnheader"
            >
              {d}
            </div>
          ))}
          <div className="calendar-head-cell week-col" role="columnheader">
            Weekly Total
          </div>
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-row" role="row">
            {week.days.map((day) => {
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
              const hasWithdraw = day.withdrawTotal > 0
              const pct = entry ? calcDailyMetrics(entry).dailyReturnPct : null
              const tone = day.isWeekend
                ? hasWithdraw
                  ? 'withdraw'
                  : 'weekend'
                : hasEntry
                  ? profit! > 0
                    ? 'profit'
                    : profit! < 0
                      ? 'loss'
                      : 'flat'
                  : hasWithdraw
                    ? 'withdraw'
                    : 'empty'
              const selected = day.date === selectedDate

              return (
                <button
                  key={day.date}
                  type="button"
                  role="gridcell"
                  className={`day-cell ${tone} ${selected ? 'selected' : ''}`}
                  onClick={() => onSelectDate(day.date)}
                  title={day.isWeekend ? 'Weekend — stop trade' : undefined}
                >
                  <span className="day-num">{day.dayNumber}</span>
                  {hasEntry && pct !== null ? (
                    <>
                      <span className="day-pnl">{formatPnL(profit!)}</span>
                      <span className="day-pct">{formatPercent(pct)}</span>
                    </>
                  ) : hasWithdraw ? (
                    <span className="day-pnl">{formatPnL(-day.withdrawTotal)}</span>
                  ) : (
                    <span className="day-empty-label">—</span>
                  )}
                </button>
              )
            })}

            <div className="week-total" role="gridcell">
              <span
                className={`week-pnl ${week.totalProfit >= 0 ? 'up' : 'down'}`}
              >
                {formatPnL(week.totalProfit)}
              </span>
              {week.returnPct !== null && (
                <span
                  className={`week-pct ${week.returnPct >= 0 ? 'up' : 'down'}`}
                >
                  {formatPercent(week.returnPct)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
