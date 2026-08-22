import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import {
  collection,
  getDocs,
  getFirestore,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getStorage, listAll, ref } from 'firebase/storage'

function loadEnv(path) {
  const env = {}
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv(resolve(process.cwd(), '.env'))
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)
const storage = getStorage(app)

async function deleteCollection(name) {
  let snap
  try {
    snap = await getDocs(collection(db, name))
  } catch (err) {
    console.log(
      `${name}: dilewati (${err instanceof Error ? err.message : err})`,
    )
    return 0
  }
  if (snap.empty) {
    console.log(`${name}: kosong`)
    return 0
  }

  const docs = snap.docs
  const chunkSize = 400
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = writeBatch(db)
    for (const d of docs.slice(i, i + chunkSize)) {
      batch.delete(d.ref)
    }
    await batch.commit()
  }
  console.log(`${name}: ${docs.length} dokumen dihapus`)
  return docs.length
}

async function deleteStorageFolder(folder) {
  try {
    const listed = await listAll(ref(storage, folder))
    await Promise.all(listed.items.map((item) => deleteObject(item)))
    for (const prefix of listed.prefixes) {
      await deleteStorageFolder(prefix.fullPath)
    }
    console.log(`storage/${folder}: ${listed.items.length} file dihapus`)
  } catch (err) {
    console.log(
      `storage/${folder}: dilewati (${err instanceof Error ? err.message : err})`,
    )
  }
}

const entries = await deleteCollection('daily_entries')
const withdrawals = await deleteCollection('withdrawals')
const trades = await deleteCollection('trades')
await deleteStorageFolder('charts')

console.log(
  `Selesai. Total dokumen: ${entries + withdrawals + trades} dihapus.`,
)
process.exit(0)
