import { doc, getDoc, setDoc } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { AppCurrency, AppSettings } from '../types/journal'
import { parseAppCurrency } from '../utils/currency'

/** Settings tetap di collection lama agar rules Firestore tidak perlu diubah. */
export const COLLECTION = 'daily_entries'
export const SETTINGS_ID = '_settings'

export async function getSettings(): Promise<AppSettings | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, SETTINGS_ID))
  if (!snap.exists()) return null
  const data = snap.data()
  const initialEquity = Number(data.initialEquity ?? 0)
  return {
    initialEquity: initialEquity || null,
    currency: parseAppCurrency(data.currency),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  }
}

export async function saveInitialEquity(
  initialEquity: number,
): Promise<void> {
  await setDoc(
    doc(requireDb(), COLLECTION, SETTINGS_ID),
    {
      initialEquity,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

export async function saveCurrency(currency: AppCurrency): Promise<void> {
  await setDoc(
    doc(requireDb(), COLLECTION, SETTINGS_ID),
    {
      currency,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}
