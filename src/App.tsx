import { useCallback, useEffect, useMemo, useState } from 'react'
import { DayDetailModal } from './components/DayDetailModal'
import { InitialEquitySetup } from './components/InitialEquitySetup'
import { MonthCalendar } from './components/MonthCalendar'
import { PairBar } from './components/PairBar'
import { SummaryCards } from './components/SummaryCards'
import { TradeDetailModal } from './components/TradeDetailModal'
import { TradeDialog } from './components/TradeDialog'
import { TradeHistory } from './components/TradeHistory'
import { firestoreLoadHint } from './lib/firebaseError'
import { isFirebaseConfigured } from './lib/firebase'
import { getSettings, saveInitialEquity } from './services/journal'
import { deleteTrade, getAllTrades, saveTrade } from './services/trades'
import {
  addWithdrawal,
  deleteWithdrawal,
  getAllWithdrawals,
} from './services/withdrawals'
import { PRESET_PAIRS } from './types/journal'
import type { Trade, TradeInput, Withdrawal, WithdrawalInput } from './types/journal'
import { tradesForDate, tradesToDailyEntries } from './utils/aggregate'
import { todayStr } from './utils/date'
import './App.css'

function monthFromDate(date: string) {
  return date.slice(0, 7)
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [monthValue, setMonthValue] = useState(monthFromDate(todayStr()))
  const [trades, setTrades] = useState<Trade[]>([])
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([])
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [prefillPair, setPrefillPair] = useState('')
  const [pairFilter, setPairFilter] = useState('all')
  const [initialEquity, setInitialEquity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredTrades = useMemo(
    () =>
      pairFilter === 'all'
        ? trades
        : trades.filter((t) => t.pair === pairFilter),
    [trades, pairFilter],
  )

  const allEntries = useMemo(
    () => tradesToDailyEntries(trades, initialEquity, allWithdrawals),
    [trades, initialEquity, allWithdrawals],
  )
  const calendarEntries = useMemo(
    () => tradesToDailyEntries(filteredTrades, initialEquity, allWithdrawals),
    [filteredTrades, initialEquity, allWithdrawals],
  )
  const monthEntries = useMemo(
    () => allEntries.filter((e) => e.date.startsWith(monthValue)),
    [allEntries, monthValue],
  )
  const calendarMonthEntries = useMemo(
    () => calendarEntries.filter((e) => e.date.startsWith(monthValue)),
    [calendarEntries, monthValue],
  )
  const monthWithdrawals = useMemo(
    () => allWithdrawals.filter((w) => w.date.startsWith(monthValue)),
    [allWithdrawals, monthValue],
  )
  const selectedEntry = allEntries.find((e) => e.date === selectedDate) ?? null
  const todayEntry = allEntries.find((e) => e.date === todayStr()) ?? null
  const dayTrades = useMemo(
    () => tradesForDate(trades, selectedDate),
    [trades, selectedDate],
  )
  const pairs = useMemo(() => {
    const presets = new Set<string>(PRESET_PAIRS)
    return [
      ...PRESET_PAIRS,
      ...new Set(trades.map((t) => t.pair).filter((p) => !presets.has(p))),
    ]
  }, [trades])

  const loadData = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      setError(
        'Firebase is not configured. Copy .env.example to .env and add your project credentials.',
      )
      return
    }

    setError('')
    try {
      const [settingsRes, tradesRes, withdrawalsRes] = await Promise.allSettled([
        getSettings(),
        getAllTrades(),
        getAllWithdrawals(),
      ])

      if (settingsRes.status === 'fulfilled') {
        setInitialEquity(settingsRes.value?.initialEquity ?? null)
      }
      if (tradesRes.status === 'fulfilled') {
        setTrades(tradesRes.value)
        setEditingTrade((current) =>
          current
            ? (tradesRes.value.find((t) => t.id === current.id) ?? null)
            : null,
        )
      }
      if (withdrawalsRes.status === 'fulfilled') {
        setAllWithdrawals(withdrawalsRes.value)
      }

      const failed = [settingsRes, tradesRes, withdrawalsRes].find(
        (r) => r.status === 'rejected',
      )
      if (failed && failed.status === 'rejected') {
        setError(firestoreLoadHint(failed.reason))
      }
    } catch (err) {
      console.error(err)
      setError(firestoreLoadHint(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setMonthValue(monthFromDate(date))
  }

  function handleCalendarSelect(date: string) {
    handleDateChange(date)
    setDetailOpen(true)
  }

  function handleMonthChange(month: string) {
    setMonthValue(month)
    setDetailOpen(false)
    if (!selectedDate.startsWith(month)) {
      setSelectedDate(`${month}-01`)
    }
  }

  function handleToday() {
    const t = todayStr()
    setSelectedDate(t)
    setMonthValue(monthFromDate(t))
    setDetailOpen(true)
  }

  function openNewTrade(pair?: string) {
    setEditingTrade(null)
    setPrefillPair(pair ?? '')
    setFormOpen(true)
    setDetailOpen(false)
  }

  function handleViewTrade(trade: Trade) {
    setSelectedDate(trade.date)
    setMonthValue(monthFromDate(trade.date))
    setViewingTrade(trade)
    setDetailOpen(false)
  }

  function handleEditTrade(trade: Trade) {
    setSelectedDate(trade.date)
    setMonthValue(monthFromDate(trade.date))
    setEditingTrade(trade)
    setPrefillPair('')
    setViewingTrade(null)
    setFormOpen(true)
    setDetailOpen(false)
  }

  async function handleSaveInitialEquity(value: number) {
    setSaving(true)
    setError('')
    try {
      await saveInitialEquity(value)
      setInitialEquity(value)
    } catch (err) {
      console.error(err)
      setError(firestoreLoadHint(err) || 'Failed to save starting capital.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddWithdraw(input: WithdrawalInput) {
    setSaving(true)
    setError('')
    try {
      await addWithdrawal(input)
      await loadData()
    } catch (err) {
      console.error(err)
      setError(firestoreLoadHint(err))
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteWithdraw(id: string) {
    setSaving(true)
    setError('')
    try {
      await deleteWithdrawal(id)
      await loadData()
    } catch (err) {
      console.error(err)
      setError(firestoreLoadHint(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(input: TradeInput, imageFile: File | null) {
    setSaving(true)
    setError('')
    try {
      await saveTrade(input, imageFile, editingTrade)
      setSelectedDate(input.date)
      setMonthValue(monthFromDate(input.date))
      setEditingTrade(null)
      setFormOpen(false)
      await loadData()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save trade.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(trade: Trade) {
    setSaving(true)
    setError('')
    try {
      await deleteTrade(trade)
      setEditingTrade(null)
      setFormOpen(false)
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Failed to delete trade.')
    } finally {
      setSaving(false)
    }
  }

  const detailWithdrawals = allWithdrawals.filter((w) => w.date === selectedDate)

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="brand">Trade Journal</p>
          <h1>Account & portfolio overview</h1>
        </div>
      </header>

      {error && <p className="banner error">{error}</p>}
      {loading && <p className="banner">Loading data…</p>}

      {!loading && (
        <>
          <InitialEquitySetup
            initialEquity={initialEquity}
            withdrawals={allWithdrawals}
            saving={saving}
            onSave={handleSaveInitialEquity}
            onAddWithdraw={handleAddWithdraw}
            onDeleteWithdraw={handleDeleteWithdraw}
          />

          <SummaryCards
            monthEntries={monthEntries}
            allEntries={allEntries}
            selectedEntry={selectedEntry}
            todayEntry={todayEntry}
            initialEquity={initialEquity}
            withdrawals={allWithdrawals}
          />

          <PairBar trades={trades} onAddTrade={openNewTrade} />

          <div className="dashboard">
            <TradeHistory
              trades={filteredTrades}
              selectedDate={selectedDate}
              selectedTradeId={viewingTrade?.id ?? editingTrade?.id}
              onSelect={handleViewTrade}
              onAdd={() => openNewTrade()}
            />
            <MonthCalendar
              monthValue={monthValue}
              entries={calendarMonthEntries}
              withdrawals={monthWithdrawals}
              selectedDate={selectedDate}
              pairs={pairs}
              pairFilter={pairFilter}
              onPairFilter={setPairFilter}
              onSelectDate={handleCalendarSelect}
              onMonthChange={handleMonthChange}
              onToday={handleToday}
            />
          </div>

          {viewingTrade && (
            <TradeDetailModal
              trade={viewingTrade}
              onClose={() => setViewingTrade(null)}
              onEdit={handleEditTrade}
            />
          )}

          <TradeDialog
            open={formOpen}
            selectedDate={selectedDate}
            existing={editingTrade}
            prefillPair={prefillPair}
            hasInitialEquity={initialEquity !== null}
            saving={saving}
            onSave={handleSave}
            onDelete={handleDelete}
            onSelectDate={handleDateChange}
            onClose={() => {
              setFormOpen(false)
              setEditingTrade(null)
            }}
          />

          {detailOpen && (
            <DayDetailModal
              date={selectedDate}
              entry={selectedEntry}
              trades={dayTrades}
              dayWithdrawals={detailWithdrawals}
              dayEquity={
                selectedEntry?.startingEquity ?? initialEquity
              }
              onClose={() => setDetailOpen(false)}
              onAdd={() => openNewTrade()}
              onEditTrade={handleViewTrade}
            />
          )}
        </>
      )}
    </div>
  )
}
