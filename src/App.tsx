import { useCallback, useEffect, useState } from 'react'
import { DailyForm } from './components/DailyForm'
import { DayDetailModal } from './components/DayDetailModal'
import { DayGuideCard } from './components/DayGuideCard'
import { InitialEquitySetup } from './components/InitialEquitySetup'
import { MonthCalendar } from './components/MonthCalendar'
import { SummaryCards } from './components/SummaryCards'
import { isFirebaseConfigured } from './lib/firebase'
import {
  deleteEntry,
  ensureInitialEquityFromLegacy,
  getAllEntries,
  getEntriesByMonth,
  getEntryByDate,
  moveEntry,
  recomputeAllStartingEquity,
  resolveStartingEquity,
  saveInitialEquity,
  upsertEntry,
} from './services/journal'
import {
  addWithdrawal,
  deleteWithdrawal,
  getAllWithdrawals,
  getWithdrawalsByMonth,
} from './services/withdrawals'
import type { DailyEntry, DailyEntryInput, Withdrawal, WithdrawalInput } from './types/journal'
import { isFutureDate, todayStr } from './utils/date'
import './App.css'

function monthFromDate(date: string) {
  return date.slice(0, 7)
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [monthValue, setMonthValue] = useState(monthFromDate(todayStr()))
  const [monthEntries, setMonthEntries] = useState<DailyEntry[]>([])
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([])
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([])
  const [monthWithdrawals, setMonthWithdrawals] = useState<Withdrawal[]>([])
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null)
  const [dayEquity, setDayEquity] = useState<number | null>(null)
  const [initialEquity, setInitialEquity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draftProfit, setDraftProfit] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadData = useCallback(async (date: string, month: string) => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      setError(
        'Firebase belum dikonfigurasi. Salin .env.example ke .env dan isi kredensial project-mu.',
      )
      return
    }

    setLoading(true)
    setError('')
    try {
      const settings = await ensureInitialEquityFromLegacy()
      setInitialEquity(settings?.initialEquity ?? null)

      const [y, m] = month.split('-').map(Number)
      const [monthData, allData, allWithdrawData, monthWithdrawData, dayData, equity] =
        await Promise.all([
          getEntriesByMonth(y, m),
          getAllEntries(),
          getAllWithdrawals(),
          getWithdrawalsByMonth(y, m),
          getEntryByDate(date),
          resolveStartingEquity(date),
        ])
      setMonthEntries(monthData)
      setAllEntries(allData)
      setAllWithdrawals(allWithdrawData)
      setMonthWithdrawals(monthWithdrawData)
      setSelectedEntry(dayData)
      setDayEquity(equity)
    } catch (err) {
      console.error(err)
      const detail =
        err instanceof Error
          ? err.message
          : 'Cek rules & pastikan Firestore sudah dibuat.'
      setError(`Gagal memuat data dari Firestore. ${detail}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData(selectedDate, monthValue)
  }, [selectedDate, monthValue, loadData])

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setMonthValue(monthFromDate(date))
  }

  function handleCalendarSelect(date: string) {
    if (isFutureDate(date)) return
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

  function handleEditFromModal() {
    setDetailOpen(false)
    document
      .querySelector('.form-panel')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSaveInitialEquity(value: number) {
    setSaving(true)
    setError('')
    try {
      await saveInitialEquity(value)
      await recomputeAllStartingEquity()
      setInitialEquity(value)
      await loadData(selectedDate, monthValue)
    } catch (err) {
      console.error(err)
      setError('Gagal menyimpan modal awal.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddWithdraw(input: WithdrawalInput) {
    setSaving(true)
    setError('')
    try {
      await addWithdrawal(input)
      await loadData(selectedDate, monthValue)
    } catch (err) {
      console.error(err)
      const detail =
        err instanceof Error
          ? err.message
          : 'Cek rules Firestore untuk collection withdrawals.'
      setError(`Gagal menyimpan pergerakan saldo. ${detail}`)
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
      await loadData(selectedDate, monthValue)
    } catch (err) {
      console.error(err)
      setError('Gagal menghapus catatan saldo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave(input: DailyEntryInput) {
    setSaving(true)
    setError('')
    try {
      await upsertEntry(input)
      await loadData(selectedDate, monthValue)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan data.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(date: string) {
    setSaving(true)
    setError('')
    try {
      await deleteEntry(date)
      await loadData(selectedDate, monthValue)
    } catch (err) {
      console.error(err)
      setError('Gagal menghapus data.')
    } finally {
      setSaving(false)
    }
  }

  async function handleMove(fromDate: string, toDate: string) {
    setSaving(true)
    setError('')
    try {
      await moveEntry(fromDate, toDate)
      setSelectedDate(toDate)
      setMonthValue(monthFromDate(toDate))
      await loadData(toDate, monthFromDate(toDate))
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      setSaving(false)
    }
  }

  const dailyProfit = draftProfit ?? selectedEntry?.dailyProfit ?? null

  const detailEntry =
    monthEntries.find((e) => e.date === selectedDate) ??
    allEntries.find((e) => e.date === selectedDate) ??
    selectedEntry

  const detailWithdrawals = allWithdrawals.filter((w) => w.date === selectedDate)

  const detailEquity =
    initialEquity === null
      ? null
      : initialEquity +
        allEntries
          .filter((e) => e.date < selectedDate)
          .reduce((sum, e) => sum + e.dailyProfit, 0)

  return (
    <div className="app">
      <div className="bg-glow" aria-hidden />
      <header className="hero">
        <p className="brand">Trade Jurnal</p>
        <h1>Daily trading report</h1>
        <p className="lede">
          Modal awal diisi sekali. Equity harian otomatis. Target 10%, stop di
          7,5%.
        </p>
      </header>

      {error && <p className="banner error">{error}</p>}
      {loading && <p className="banner">Memuat data…</p>}

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
            initialEquity={initialEquity}
            withdrawals={allWithdrawals}
          />

          <MonthCalendar
            monthValue={monthValue}
            entries={monthEntries}
            withdrawals={monthWithdrawals}
            selectedDate={selectedDate}
            onSelectDate={handleCalendarSelect}
            onMonthChange={handleMonthChange}
            onToday={handleToday}
          />

          <div className="layout">
            <DailyForm
              selectedDate={selectedDate}
              existing={selectedEntry}
              dayEquity={dayEquity}
              hasInitialEquity={initialEquity !== null}
              saving={saving}
              onSave={handleSave}
              onDelete={handleDelete}
              onMove={handleMove}
              onSelectDate={handleDateChange}
              onDraftProfitChange={setDraftProfit}
            />
            <DayGuideCard
              selectedDate={selectedDate}
              baseEquity={dayEquity}
              dailyProfit={dailyProfit}
            />
          </div>

          {detailOpen && (
            <DayDetailModal
              date={selectedDate}
              entry={detailEntry}
              dayWithdrawals={detailWithdrawals}
              dayEquity={detailEquity}
              onClose={() => setDetailOpen(false)}
              onEdit={handleEditFromModal}
            />
          )}
        </>
      )}
    </div>
  )
}
