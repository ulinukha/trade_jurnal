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

/** Input harian tanpa equity — equity & total trade dihitung di service. */
export type DailyEntryInput = {
  date: string
  lostEntries: number
  profitEntries: number
  dailyProfit: number
}

export interface AppSettings {
  initialEquity: number
  updatedAt?: string
}

/** Pergerakan dana di akun — terpisah dari P/L trading. */
export type CashflowType = 'withdraw' | 'deposit'

export interface Withdrawal {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  /** Record lama tanpa field ini dianggap withdraw. */
  type: CashflowType
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
