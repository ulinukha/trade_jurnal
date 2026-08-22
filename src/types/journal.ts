export const PRESET_PAIRS = ['XAUUSD', 'USA100'] as const

export const TRADE_RESULTS = ['SL', 'TP', 'BE', 'Pending'] as const
export type TradeResult = (typeof TRADE_RESULTS)[number]

export const TRADE_SESSIONS = ['Asia', 'London', 'New York', 'Overlap'] as const
export type TradeSession = (typeof TRADE_SESSIONS)[number]

export const TRADE_SIDES = ['buy', 'sell'] as const
export type TradeSide = (typeof TRADE_SIDES)[number]

export const SESSION_LABELS: Record<TradeSession, string> = {
  Asia: 'Asia',
  London: 'London',
  'New York': 'New York',
  Overlap: 'Overlap (London–NY)',
}

export interface Trade {
  id: string
  date: string
  pair: string
  side: TradeSide
  session: TradeSession
  result: TradeResult
  entryPrice: number
  exitPrice: number | null
  profit: number
  reason: string
  chartImageUrl: string
  chartImagePath?: string
  createdAt?: string
  updatedAt?: string
}

export type TradeInput = {
  date: string
  pair: string
  side: TradeSide
  session: TradeSession
  result: TradeResult
  entryPrice: number
  exitPrice: number | null
  profit: number
  reason: string
}

/** Rekap harian — dihitung dari daftar trade, tidak disimpan terpisah. */
export interface DailyEntry {
  id: string // YYYY-MM-DD
  date: string // YYYY-MM-DD
  startingEquity: number
  totalEntries: number
  lostEntries: number
  profitEntries: number
  dailyProfit: number
  createdAt?: string
  updatedAt?: string
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
