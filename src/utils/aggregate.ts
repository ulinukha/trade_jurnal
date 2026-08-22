import type { DailyEntry, Trade, Withdrawal } from '../types/journal'
import { calcStartingEquity } from './calc'

export function tradesToDailyEntries(
  trades: Trade[],
  initialEquity: number | null,
  withdrawals: Withdrawal[],
): DailyEntry[] {
  const byDate = new Map<string, Trade[]>()
  for (const trade of trades) {
    const list = byDate.get(trade.date) ?? []
    list.push(trade)
    byDate.set(trade.date, list)
  }

  const dates = [...byDate.keys()].sort()
  const entries: DailyEntry[] = []

  for (const date of dates) {
    const dayTrades = byDate.get(date) ?? []
    const dailyProfit = dayTrades.reduce((sum, t) => sum + t.profit, 0)
    const startingEquity =
      initialEquity === null
        ? 0
        : calcStartingEquity(initialEquity, entries, withdrawals, date)

    entries.push({
      id: date,
      date,
      startingEquity,
      totalEntries: dayTrades.length,
      lostEntries: dayTrades.filter((t) => t.result === 'SL').length,
      profitEntries: dayTrades.filter((t) => t.result === 'TP').length,
      dailyProfit,
    })
  }

  return entries
}

export function tradesForDate(trades: Trade[], date: string): Trade[] {
  return trades.filter((t) => t.date === date)
}
