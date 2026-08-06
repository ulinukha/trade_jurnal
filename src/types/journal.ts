export interface DailyEntry {
  id: string // YYYY-MM-DD
  date: string // YYYY-MM-DD
  startingEquity: number // dihitung otomatis dari modal awal + profit sebelumnya
  totalEntries: number
  lostEntries: number
  profitEntries: number
  dailyProfit: number
  createdAt?: string
  updatedAt?: string
}

/** Input harian tanpa equity — equity dihitung di service. */
export type DailyEntryInput = {
  date: string
  totalEntries: number
  lostEntries: number
  profitEntries: number
  dailyProfit: number
}

export interface AppSettings {
  initialEquity: number
  updatedAt?: string
}

export interface Withdrawal {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  note?: string
  createdAt?: string
}

export type WithdrawalInput = Omit<Withdrawal, 'id' | 'createdAt'>

export interface DailyMetrics {
  endingEquity: number
  dailyReturnPct: number
  winRate: number
  lossRate: number
}

export interface PeriodSummary {
  totalProfit: number
  totalEntries: number
  totalWins: number
  totalLosses: number
  winRate: number
  tradingDays: number
  avgDailyProfit: number
  bestDay: number
  worstDay: number
}
