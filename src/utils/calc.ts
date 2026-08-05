import type { DailyEntry, DailyMetrics, PeriodSummary } from '../types/journal'

export function calcDailyMetrics(entry: DailyEntry): DailyMetrics {
  const endingEquity = entry.startingEquity + entry.dailyProfit
  const dailyReturnPct =
    entry.startingEquity !== 0
      ? (entry.dailyProfit / entry.startingEquity) * 100
      : 0
  const winRate =
    entry.totalEntries > 0
      ? (entry.profitEntries / entry.totalEntries) * 100
      : 0
  const lossRate =
    entry.totalEntries > 0
      ? (entry.lostEntries / entry.totalEntries) * 100
      : 0

  return { endingEquity, dailyReturnPct, winRate, lossRate }
}

export function calcPeriodSummary(entries: DailyEntry[]): PeriodSummary {
  if (entries.length === 0) {
    return {
      totalProfit: 0,
      totalEntries: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      tradingDays: 0,
      avgDailyProfit: 0,
      bestDay: 0,
      worstDay: 0,
    }
  }

  const totalProfit = entries.reduce((sum, e) => sum + e.dailyProfit, 0)
  const totalEntries = entries.reduce((sum, e) => sum + e.totalEntries, 0)
  const totalWins = entries.reduce((sum, e) => sum + e.profitEntries, 0)
  const totalLosses = entries.reduce((sum, e) => sum + e.lostEntries, 0)
  const profits = entries.map((e) => e.dailyProfit)

  return {
    totalProfit,
    totalEntries,
    totalWins,
    totalLosses,
    winRate: totalEntries > 0 ? (totalWins / totalEntries) * 100 : 0,
    tradingDays: entries.length,
    avgDailyProfit: totalProfit / entries.length,
    bestDay: Math.max(...profits),
    worstDay: Math.min(...profits),
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

/** Compact P/L for calendar cells: Rp157.000 / -Rp120.000 */
export function formatPnL(value: number): string {
  const abs = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  if (value < 0) return `-${abs}`
  return abs
}

export const TARGET_PCT = 0.1
export const STOP_LOSS_PCT = 0.075

export interface DayGuide {
  baseEquity: number
  targetProfit: number
  stopLossAmount: number
  /** true when daily P/L already hit/exceeded -7.5% */
  shouldStop: boolean
  lossPctOfBase: number
  progressToTargetPct: number | null
}

/** Target 10% & stop 7.5% based on previous day's ending equity. */
export function calcDayGuide(
  baseEquity: number | null,
  dailyProfit: number | null,
): DayGuide | null {
  if (baseEquity === null || baseEquity <= 0) return null

  const targetProfit = baseEquity * TARGET_PCT
  const stopLossAmount = baseEquity * STOP_LOSS_PCT
  const profit = dailyProfit ?? 0
  const lossPctOfBase = profit < 0 ? (Math.abs(profit) / baseEquity) * 100 : 0
  const shouldStop = profit <= -stopLossAmount
  const progressToTargetPct =
    dailyProfit !== null ? (dailyProfit / targetProfit) * 100 : null

  return {
    baseEquity,
    targetProfit,
    stopLossAmount,
    shouldStop,
    lossPctOfBase,
    progressToTargetPct,
  }
}
