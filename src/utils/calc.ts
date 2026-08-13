import type {
  CashflowType,
  DailyEntry,
  DailyMetrics,
  PeriodSummary,
  Withdrawal,
} from '../types/journal'

export function cashflowType(w: { type?: CashflowType }): CashflowType {
  return w.type === 'deposit' ? 'deposit' : 'withdraw'
}

/** Withdraw negatif, deposit positif. */
export function cashflowSigned(w: Withdrawal): number {
  return cashflowType(w) === 'deposit' ? w.amount : -w.amount
}

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
  }).format(Math.trunc(value))
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function calcTotalWithdraw(withdrawals: Withdrawal[]): number {
  return withdrawals
    .filter((w) => cashflowType(w) === 'withdraw')
    .reduce((sum, w) => sum + w.amount, 0)
}

export function calcTotalDeposit(withdrawals: Withdrawal[]): number {
  return withdrawals
    .filter((w) => cashflowType(w) === 'deposit')
    .reduce((sum, w) => sum + w.amount, 0)
}

export function calcNetCashflow(withdrawals: Withdrawal[]): number {
  return withdrawals.reduce((sum, w) => sum + cashflowSigned(w), 0)
}

/** Saldo acuan di tanggal tertentu: modal + profit sebelumnya + cashflow s.d. tanggal itu. */
export function calcStartingEquity(
  initialEquity: number,
  entries: { date: string; dailyProfit: number }[],
  withdrawals: Withdrawal[],
  date: string,
  excludeDate?: string,
): number {
  const priorProfit = entries
    .filter((e) => e.date < date && e.date !== excludeDate)
    .reduce((sum, e) => sum + e.dailyProfit, 0)
  const cashflow = calcNetCashflow(
    withdrawals.filter((w) => w.date <= date),
  )
  return initialEquity + priorProfit + cashflow
}

/** Equity di akun setelah profit trading, withdraw, dan deposit. */
export function calcAccountEquity(
  initialEquity: number,
  totalProfit: number,
  totalWithdraw: number,
  totalDeposit = 0,
): number {
  return initialEquity + totalProfit - totalWithdraw + totalDeposit
}

/** % kenaikan equity di akun vs modal awal (termasuk efek WD / deposit). */
export function calcEquityGrowthPct(
  initialEquity: number,
  totalProfit: number,
  totalWithdraw: number,
  totalDeposit = 0,
): number {
  if (initialEquity === 0) return 0
  const equity = calcAccountEquity(
    initialEquity,
    totalProfit,
    totalWithdraw,
    totalDeposit,
  )
  return ((equity - initialEquity) / initialEquity) * 100
}

/** Net cashflow per tanggal: deposit +, withdraw −. */
export function cashflowByDate(
  withdrawals: Withdrawal[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const w of withdrawals) {
    map.set(w.date, (map.get(w.date) ?? 0) + cashflowSigned(w))
  }
  return map
}

/** Compact P/L for calendar cells: Rp157.000 / -Rp120.000 */
export function formatPnL(value: number): string {
  const abs = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.trunc(Math.abs(value)))
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
