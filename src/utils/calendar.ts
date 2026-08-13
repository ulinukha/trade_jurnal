import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { DailyEntry, Withdrawal } from '../types/journal'
import { cashflowByDate } from '../utils/calc'

export interface CalendarDay {
  date: string // YYYY-MM-DD
  dayNumber: number
  inMonth: boolean
  isWeekend: boolean
  entry: DailyEntry | null
  /** Net cashflow hari itu: deposit +, withdraw −. */
  cashflowNet: number
}

export interface CalendarWeek {
  days: CalendarDay[]
  totalProfit: number
  totalTrades: number
  /** % vs equity awal hari pertama yang ada data di minggu itu */
  returnPct: number | null
}

export function buildMonthWeeks(
  year: number,
  month: number,
  entries: DailyEntry[],
  withdrawals: Withdrawal[] = [],
): CalendarWeek[] {
  const byDate = new Map(entries.map((e) => [e.date, e]))
  const cashflowMap = cashflowByDate(withdrawals)
  const monthDate = new Date(year, month - 1, 1)
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start, end })

  const weeks: CalendarWeek[] = []
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7)
    const calendarDays: CalendarDay[] = slice.map((d) => {
      const date = format(d, 'yyyy-MM-dd')
      const inMonth = isSameMonth(d, monthDate)
      const dow = d.getDay()
      return {
        date,
        dayNumber: d.getDate(),
        inMonth,
        isWeekend: dow === 0 || dow === 6,
        entry: inMonth ? (byDate.get(date) ?? null) : null,
        cashflowNet: inMonth ? (cashflowMap.get(date) ?? 0) : 0,
      }
    })

    const withData = calendarDays.filter((d) => d.entry)
    const totalProfit = withData.reduce(
      (s, d) => s + (d.entry?.dailyProfit ?? 0),
      0,
    )
    const firstEquity = withData[0]?.entry?.startingEquity ?? 0
    weeks.push({
      days: calendarDays,
      totalProfit,
      totalTrades: withData.reduce(
        (s, d) => s + (d.entry?.totalEntries ?? 0),
        0,
      ),
      returnPct:
        withData.length > 0 && firstEquity !== 0
          ? (totalProfit / firstEquity) * 100
          : null,
    })
  }

  return weeks
}

export function shiftMonth(monthValue: string, delta: number): string {
  const [y, m] = monthValue.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return format(d, 'yyyy-MM')
}
