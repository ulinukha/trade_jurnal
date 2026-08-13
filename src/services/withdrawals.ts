import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Withdrawal, WithdrawalInput } from '../types/journal'

const COLLECTION = 'withdrawals'

function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firebase belum dikonfigurasi.')
  }
  return db
}

function toWithdrawal(id: string, data: Record<string, unknown>): Withdrawal {
  return {
    id,
    date: String(data.date ?? ''),
    amount: Number(data.amount ?? 0),
    type: data.type === 'deposit' ? 'deposit' : 'withdraw',
    note: data.note ? String(data.note) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  }
}

export async function getAllWithdrawals(): Promise<Withdrawal[]> {
  const q = query(collection(requireDb(), COLLECTION), orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => toWithdrawal(d.id, d.data()))
}

export async function getWithdrawalsByMonth(
  year: number,
  month: number,
): Promise<Withdrawal[]> {
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
  return snap.docs.map((d) => toWithdrawal(d.id, d.data()))
}

export async function addWithdrawal(input: WithdrawalInput): Promise<Withdrawal> {
  const now = new Date().toISOString()
  const ref = doc(collection(requireDb(), COLLECTION))
  const payload: Record<string, string | number> = {
    date: input.date,
    amount: input.amount,
    type: input.type === 'deposit' ? 'deposit' : 'withdraw',
    createdAt: now,
  }
  if (input.note?.trim()) {
    payload.note = input.note.trim()
  }
  await setDoc(ref, payload)
  return {
    id: ref.id,
    date: input.date,
    amount: input.amount,
    type: input.type === 'deposit' ? 'deposit' : 'withdraw',
    note: input.note?.trim() || undefined,
    createdAt: now,
  }
}

export async function deleteWithdrawal(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}
