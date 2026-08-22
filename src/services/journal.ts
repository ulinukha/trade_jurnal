import { doc, getDoc, setDoc } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { AppSettings } from '../types/journal'

/** Settings tetap di collection lama agar rules Firestore tidak perlu diubah. */
export const COLLECTION = 'daily_entries'
export const SETTINGS_ID = '_settings'

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

export async function saveInitialEquity(
  initialEquity: number,
): Promise<AppSettings> {
  const payload: AppSettings = {
    initialEquity,
    updatedAt: new Date().toISOString(),
  }
  await setDoc(doc(requireDb(), COLLECTION, SETTINGS_ID), payload, {
    merge: true,
  })
  return payload
}
