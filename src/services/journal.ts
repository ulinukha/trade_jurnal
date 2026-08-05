import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
  AppSettings,
  DailyEntry,
  DailyEntryInput,
} from '../types/journal'

const COLLECTION = 'daily_entries'
/** Disimpan di collection yang sama agar rules lama tetap jalan. */
const SETTINGS_ID = '_settings'

function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firebase belum dikonfigurasi.')
  }
  return db
}

function toEntry(id: string, data: Record<string, unknown>): DailyEntry {
  return {
    id,
    date: String(data.date ?? id),
    startingEquity: Number(data.startingEquity ?? 0),
    totalEntries: Number(data.totalEntries ?? 0),
    lostEntries: Number(data.lostEntries ?? 0),
    profitEntries: Number(data.profitEntries ?? 0),
    dailyProfit: Number(data.dailyProfit ?? 0),
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  }
}

export async function getSettings(): Promise<AppSettings | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, SETTINGS_ID))
  if (!snap.exists()) return null
  const data = snap.data()
  const initialEquity = Number(data.initialEquity ?? 0)
  if (!initialEquity) return null
  return {
    initialEquity,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  }
}

export async function saveInitialEquity(initialEquity: number): Promise<AppSettings> {
  const payload: AppSettings = {
    initialEquity,
    updatedAt: new Date().toISOString(),
  }
  await setDoc(doc(requireDb(), COLLECTION, SETTINGS_ID), payload, {
    merge: true,
  })
  return payload
}

/**
 * Jika settings belum ada tapi sudah ada entry lama,
 * ambil startingEquity entry paling awal sebagai modal awal.
 */
export async function ensureInitialEquityFromLegacy(): Promise<AppSettings | null> {
  const existing = await getSettings()
  if (existing) return existing

  const all = await getAllEntries()
  if (all.length === 0) return null

  const first = all[0]
  return saveInitialEquity(first.startingEquity)
}

export async function getEntryByDate(date: string): Promise<DailyEntry | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, date))
  if (!snap.exists()) return null
  return toEntry(snap.id, snap.data())
}

export async function getEntriesByMonth(
  year: number,
  month: number,
): Promise<DailyEntry[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  const q = query(
    collection(requireDb(), COLLECTION),
    where('date', '>=', start),
    where('date', '<', end),
    orderBy('date', 'asc'),
  )

  const snap = await getDocs(q)
  return snap.docs.map((d) => toEntry(d.id, d.data()))
}

export async function getAllEntries(): Promise<DailyEntry[]> {
  const q = query(collection(requireDb(), COLLECTION), orderBy('date', 'asc'))
  const snap = await getDocs(q)
  // Docs tanpa field `date` (mis. _settings) tidak ikut hasil orderBy.
  return snap.docs
    .filter((d) => d.id !== SETTINGS_ID && Boolean(d.data().date))
    .map((d) => toEntry(d.id, d.data()))
}

/** Equity di tanggal tertentu = modal awal + total profit sebelum tanggal itu. */
export async function resolveStartingEquity(
  date: string,
  excludeDate?: string,
): Promise<number | null> {
  const settings = await getSettings()
  if (!settings) return null

  const all = await getAllEntries()
  const priorProfit = all
    .filter((e) => e.date < date && e.date !== excludeDate)
    .reduce((sum, e) => sum + e.dailyProfit, 0)

  return settings.initialEquity + priorProfit
}

export async function upsertEntry(input: DailyEntryInput): Promise<DailyEntry> {
  const startingEquity = await resolveStartingEquity(input.date)
  if (startingEquity === null) {
    throw new Error('Modal awal belum diisi.')
  }

  const now = new Date().toISOString()
  const existing = await getEntryByDate(input.date)
  const payload = {
    ...input,
    startingEquity,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await setDoc(doc(requireDb(), COLLECTION, input.date), payload)
  return { id: input.date, ...payload }
}

export async function deleteEntry(date: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, date))
}

/** Pindah entry ke tanggal lain (mis. 6 → 5). */
export async function moveEntry(
  fromDate: string,
  toDate: string,
): Promise<DailyEntry> {
  if (fromDate === toDate) {
    throw new Error('Tanggal tujuan sama dengan tanggal asal.')
  }

  const source = await getEntryByDate(fromDate)
  if (!source) {
    throw new Error(`Tidak ada data di ${fromDate}.`)
  }

  const target = await getEntryByDate(toDate)
  if (target) {
    throw new Error(
      `Tanggal ${toDate} sudah ada data. Hapus dulu atau pilih tanggal lain.`,
    )
  }

  const startingEquity = await resolveStartingEquity(toDate, fromDate)
  if (startingEquity === null) {
    throw new Error('Modal awal belum diisi.')
  }

  const now = new Date().toISOString()
  const payload = {
    date: toDate,
    startingEquity,
    totalEntries: source.totalEntries,
    lostEntries: source.lostEntries,
    profitEntries: source.profitEntries,
    dailyProfit: source.dailyProfit,
    createdAt: source.createdAt ?? now,
    updatedAt: now,
  }

  await setDoc(doc(requireDb(), COLLECTION, toDate), payload)
  await deleteEntry(fromDate)
  return { id: toDate, ...payload }
}

/** Recompute startingEquity semua entry (setelah ubah modal awal). */
export async function recomputeAllStartingEquity(): Promise<void> {
  const settings = await getSettings()
  if (!settings) return

  const all = await getAllEntries()
  let equity = settings.initialEquity

  for (const entry of all) {
    const payload = {
      date: entry.date,
      startingEquity: equity,
      totalEntries: entry.totalEntries,
      lostEntries: entry.lostEntries,
      profitEntries: entry.profitEntries,
      dailyProfit: entry.dailyProfit,
      createdAt: entry.createdAt,
      updatedAt: new Date().toISOString(),
    }
    await setDoc(doc(requireDb(), COLLECTION, entry.date), payload)
    equity += entry.dailyProfit
  }
}
