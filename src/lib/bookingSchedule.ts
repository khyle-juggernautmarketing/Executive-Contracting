/** Executive Contracting appointment rules — America/New_York (EST/EDT). */

export const BOOKING_TZ = 'America/New_York'
export const SLOT_INTERVAL_MINUTES = 15
export const BLOCK_DURATION_MINUTES = 90
export const BUSINESS_START_HOUR = 9
export const BUSINESS_END_HOUR = 17
export const MAX_DAYS_AHEAD = 3

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

type EstParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

function parseEstDate(isoDate: string): EstParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null
  const noonUtc = new Date(`${isoDate}T12:00:00.000Z`)
  if (Number.isNaN(noonUtc.getTime())) return null

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })

  const parts = formatter.formatToParts(noonUtc)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  const weekday = WEEKDAY_INDEX[get('weekday')] ?? -1
  if (weekday < 0) return null

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: 12,
    minute: 0,
    weekday,
  }
}

function estDateKey(parts: Pick<EstParts, 'year' | 'month' | 'day'>): string {
  const y = String(parts.year)
  const m = String(parts.month).padStart(2, '0')
  const d = String(parts.day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Current calendar date in Eastern time (YYYY-MM-DD). */
export function getTodayEstDateKey(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0'
  return estDateKey({
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
  })
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0))
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(utc)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0'
  return estDateKey({
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
  })
}

export function isBookableWeekday(weekday: number): boolean {
  return weekday >= 1 && weekday <= 6
}

export function isDateWithinBookingWindow(dateKey: string): boolean {
  const today = getTodayEstDateKey()
  const max = addDaysToDateKey(today, MAX_DAYS_AHEAD)
  return dateKey >= today && dateKey <= max
}

export function isValidBookableDate(dateKey: string): boolean {
  const est = parseEstDate(dateKey)
  if (!est) return false
  if (!isBookableWeekday(est.weekday)) return false
  return isDateWithinBookingWindow(dateKey)
}

/** UTC instant for a local Eastern wall-clock time on a given date. */
export function estSlotToUtc(dateKey: string, hour: number, minute: number): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d, hour + 5, minute, 0))

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  for (let i = 0; i < 6; i++) {
    const parts = formatter.formatToParts(guess)
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? '0')
    const ey = get('year')
    const em = get('month')
    const ed = get('day')
    const eh = get('hour')
    const emin = get('minute')

    const diffMinutes =
      (y - ey) * 525600 +
      (m - em) * 43200 +
      (d - ed) * 1440 +
      (hour - eh) * 60 +
      (minute - emin)

    if (diffMinutes === 0) return guess
    guess.setUTCMinutes(guess.getUTCMinutes() + diffMinutes)
  }

  return guess
}

export function formatSlotLabel(dateKey: string, hour: number, minute: number): string {
  const utc = estSlotToUtc(dateKey, hour, minute)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(utc)
}

export function formatTime12h(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  const mm = String(minute).padStart(2, '0')
  return `${h12}:${mm} ${period}`
}

export interface TimeSlot {
  date: string
  time: string
  hour: number
  minute: number
  startUtc: string
  blockEndUtc: string
  label: string
}

export function generateSlotsForDate(dateKey: string): TimeSlot[] {
  if (!isValidBookableDate(dateKey)) return []

  const slots: TimeSlot[] = []
  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      if (hour === BUSINESS_END_HOUR - 1 && minute + SLOT_INTERVAL_MINUTES > 60) break
      const start = estSlotToUtc(dateKey, hour, minute)
      const blockEnd = new Date(start.getTime() + BLOCK_DURATION_MINUTES * 60_000)

      slots.push({
        date: dateKey,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        hour,
        minute,
        startUtc: start.toISOString(),
        blockEndUtc: blockEnd.toISOString(),
        label: formatTime12h(hour, minute),
      })
    }
  }

  const now = Date.now()
  return slots.filter((s) => new Date(s.startUtc).getTime() > now)
}

export function getBookableDateKeys(): string[] {
  const today = getTodayEstDateKey()
  const keys: string[] = []
  for (let i = 0; i <= MAX_DAYS_AHEAD; i++) {
    const key = addDaysToDateKey(today, i)
    const est = parseEstDate(key)
    if (est && isBookableWeekday(est.weekday)) keys.push(key)
  }
  return keys
}

export interface BlockedRange {
  startUtc: string
  blockEndUtc: string
}

export function isSlotBlocked(slot: TimeSlot, blocked: BlockedRange[]): boolean {
  const slotStart = new Date(slot.startUtc).getTime()
  const slotEnd = slotStart + SLOT_INTERVAL_MINUTES * 60_000

  return blocked.some((b) => {
    const blockStart = new Date(b.startUtc).getTime()
    const blockEnd = new Date(b.blockEndUtc).getTime()
    return slotStart < blockEnd && slotEnd > blockStart
  })
}

export function filterAvailableSlots(slots: TimeSlot[], blocked: BlockedRange[]): TimeSlot[] {
  return slots.filter((s) => !isSlotBlocked(s, blocked))
}
