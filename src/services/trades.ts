import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { requireDb, storage } from '../lib/firebase'
import type {
  Trade,
  TradeInput,
  TradeResult,
  TradeSession,
  TradeSide,
} from '../types/journal'
import {
  TRADE_RESULTS,
  TRADE_SESSIONS,
  TRADE_SIDES,
} from '../types/journal'
import { blobToDataUrl, compressImageFile } from '../utils/image'
import { COLLECTION, SETTINGS_ID } from './journal'

const TRADE_KIND = 'trade'

function isResult(value: unknown): value is TradeResult {
  return TRADE_RESULTS.includes(value as TradeResult)
}

function isSession(value: unknown): value is TradeSession {
  return TRADE_SESSIONS.includes(value as TradeSession)
}

function isSide(value: unknown): value is TradeSide {
  return TRADE_SIDES.includes(value as TradeSide)
}

function toTrade(id: string, data: Record<string, unknown>): Trade | null {
  if (data.kind !== TRADE_KIND) return null
  if (!isResult(data.result) || !isSession(data.session) || !isSide(data.side)) {
    return null
  }

  const exitRaw = data.exitPrice
  const exitPrice =
    exitRaw === null || exitRaw === undefined || exitRaw === ''
      ? null
      : Number(exitRaw)

  return {
    id,
    date: String(data.date ?? ''),
    pair: String(data.pair ?? ''),
    side: data.side,
    session: data.session,
    result: data.result,
    entryPrice: Number(data.entryPrice ?? 0),
    exitPrice: exitPrice !== null && Number.isNaN(exitPrice) ? null : exitPrice,
    profit: Number(data.profit ?? 0),
    reason: String(data.reason ?? ''),
    chartImageUrl: String(data.chartImageUrl ?? ''),
    chartImagePath: data.chartImagePath
      ? String(data.chartImagePath)
      : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  }
}

export async function getAllTrades(): Promise<Trade[]> {
  const snap = await getDocs(collection(requireDb(), COLLECTION))
  return snap.docs
    .filter((d) => d.id !== SETTINGS_ID)
    .map((d) => toTrade(d.id, d.data()))
    .filter((t): t is Trade => t !== null)
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date)
      if (byDate !== 0) return byDate
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    })
}

async function uploadChart(
  tradeId: string,
  file: File,
): Promise<{ url: string; path?: string }> {
  const blob = await compressImageFile(file)
  const path = `charts/${tradeId}.jpg`

  if (storage) {
    try {
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
      const url = await getDownloadURL(storageRef)
      return { url, path }
    } catch (err) {
      console.warn('Storage upload failed, saving the image in the document.', err)
    }
  }

  const compact = await compressImageFile(file, 960, 0.62)
  if (compact.size > 850_000) {
    throw new Error(
      'Chart image is too large. Enable Firebase Storage or use a smaller screenshot.',
    )
  }
  return { url: await blobToDataUrl(compact) }
}

async function removeStoredChart(path?: string) {
  if (!path || !storage) return
  try {
    await deleteObject(ref(storage, path))
  } catch {
    // File mungkin sudah tidak ada.
  }
}

export async function saveTrade(
  input: TradeInput,
  imageFile: File | null,
  existing?: Trade | null,
): Promise<Trade> {
  const today = new Date()
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  if (input.date > todayStr) {
    throw new Error('Future dates cannot be logged.')
  }

  const db = requireDb()
  const id = existing?.id ?? doc(collection(db, COLLECTION)).id
  const now = new Date().toISOString()

  let chartImageUrl = existing?.chartImageUrl ?? ''
  let chartImagePath = existing?.chartImagePath

  if (imageFile) {
    const uploaded = await uploadChart(id, imageFile)
    if (existing?.chartImagePath && existing.chartImagePath !== uploaded.path) {
      await removeStoredChart(existing.chartImagePath)
    }
    chartImageUrl = uploaded.url
    chartImagePath = uploaded.path
  }

  if (!chartImageUrl) {
    throw new Error('Chart screenshot is required.')
  }

  const payload = {
    kind: TRADE_KIND,
    date: input.date,
    pair: input.pair,
    side: input.side,
    session: input.session,
    result: input.result,
    entryPrice: input.entryPrice,
    exitPrice: input.exitPrice,
    profit: input.profit,
    reason: input.reason,
    chartImageUrl,
    ...(chartImagePath ? { chartImagePath } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await setDoc(doc(db, COLLECTION, id), payload)
  return { id, ...payload, chartImagePath }
}

export async function deleteTrade(trade: Trade): Promise<void> {
  await removeStoredChart(trade.chartImagePath)
  await deleteDoc(doc(requireDb(), COLLECTION, trade.id))
}
