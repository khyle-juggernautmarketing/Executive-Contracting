import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import type { BookingStoreData, StoredBooking, StoredPendingLead } from '@/types/booking'

const STORE_KEY = 'executive-booking-store'
const EMPTY: BookingStoreData = { bookings: [], pending: [] }

function storePath(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'executive-booking-store.json')
  }
  const dir = process.env.BOOKING_DATA_DIR?.trim() || path.join(process.cwd(), '.data')
  return path.join(dir, 'booking-store.json')
}

async function readStoreFile(): Promise<BookingStoreData> {
  try {
    const raw = await readFile(storePath(), 'utf8')
    const parsed = JSON.parse(raw) as BookingStoreData
    return {
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    }
  } catch {
    return { bookings: [], pending: [] }
  }
}

async function writeStoreFile(data: BookingStoreData): Promise<void> {
  const file = storePath()
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data), 'utf8')
}

/** Upstash Redis REST API */
async function readKvStore(): Promise<BookingStoreData | null> {
  const base = process.env.KV_REST_API_URL?.trim()
  const token = process.env.KV_REST_API_TOKEN?.trim()
  if (!base || !token) return null

  const url = `${base.replace(/\/$/, '')}/get/${encodeURIComponent(STORE_KEY)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    console.error('bookingStore KV read failed', res.status)
    return null
  }

  const json = (await res.json()) as { result?: string | null }
  if (json.result == null || json.result === '') {
    return { bookings: [], pending: [] }
  }
  const parsed = JSON.parse(json.result) as BookingStoreData
  return {
    bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
    pending: Array.isArray(parsed.pending) ? parsed.pending : [],
  }
}

async function writeKvStore(data: BookingStoreData): Promise<void> {
  const base = process.env.KV_REST_API_URL?.trim()
  const token = process.env.KV_REST_API_TOKEN?.trim()
  if (!base || !token) throw new Error('KV not configured')

  const url = `${base.replace(/\/$/, '')}/set/${encodeURIComponent(STORE_KEY)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSON.stringify(data)),
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`KV write failed: ${res.status}`)
  }
}

export async function readBookingStore(): Promise<BookingStoreData> {
  try {
    const kv = await readKvStore()
    if (kv) return pruneStore(kv)
  } catch (e) {
    console.error('bookingStore KV read error', e)
  }

  try {
    return pruneStore(await readStoreFile())
  } catch (e) {
    console.error('bookingStore file read error', e)
    return { bookings: [], pending: [] }
  }
}

export async function writeBookingStore(data: BookingStoreData): Promise<void> {
  const pruned = pruneStore(data)
  const hasKv = Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim())

  if (hasKv) {
    try {
      await writeKvStore(pruned)
      return
    } catch (e) {
      console.error('bookingStore KV write error, falling back to file', e)
    }
  }

  try {
    await writeStoreFile(pruned)
  } catch (e) {
    console.error('bookingStore file write error', e)
    throw e
  }
}

function pruneStore(data: BookingStoreData): BookingStoreData {
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const bookings = data.bookings.filter((b) => new Date(b.blockEndUtc).getTime() > weekAgo)
  const pending = data.pending.filter(
    (p) => !p.webhookSent && new Date(p.expiresAt).getTime() > now - 60 * 60 * 1000,
  )

  return { bookings, pending }
}

export async function withBookingStore<T>(
  mutate: (store: BookingStoreData) => T | Promise<T>,
): Promise<T> {
  const store = await readBookingStore()
  const result = await mutate(store)
  await writeBookingStore(store)
  return result
}

export async function addBooking(booking: StoredBooking): Promise<void> {
  await withBookingStore((store) => {
    store.bookings.push(booking)
  })
}

export async function addPendingLead(pending: StoredPendingLead): Promise<void> {
  await withBookingStore((store) => {
    store.pending = store.pending.filter((p) => p.id !== pending.id && !p.webhookSent)
    store.pending.push(pending)
  })
}

export async function getPendingLead(id: string): Promise<StoredPendingLead | null> {
  const store = await readBookingStore()
  return store.pending.find((p) => p.id === id) ?? null
}

export async function removePendingLead(id: string): Promise<void> {
  await withBookingStore((store) => {
    store.pending = store.pending.filter((p) => p.id !== id)
  })
}

export async function getBlockedRanges(): Promise<{ startUtc: string; blockEndUtc: string }[]> {
  const store = await readBookingStore()
  return store.bookings.map((b) => ({ startUtc: b.startUtc, blockEndUtc: b.blockEndUtc }))
}

export async function getExpiredPendingLeads(): Promise<StoredPendingLead[]> {
  const store = await readBookingStore()
  const now = Date.now()
  return store.pending.filter((p) => !p.webhookSent && new Date(p.expiresAt).getTime() <= now)
}
