import { NextResponse } from 'next/server'
import { getBlockedRanges } from '@/lib/bookingStore'
import {
  BOOKING_TZ,
  filterAvailableSlots,
  generateSlotsForDate,
  getBookableDateKeys,
  isValidBookableDate,
} from '@/lib/bookingSchedule'
import { flushExpiredPendingLeads } from '@/lib/pendingLeads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await flushExpiredPendingLeads().catch(() => {})

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')?.trim() ?? ''

  if (!date) {
    const dates = getBookableDateKeys()
    return NextResponse.json(
      { timezone: BOOKING_TZ, dates },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (!isValidBookableDate(date)) {
    return NextResponse.json({ error: 'Invalid or unavailable date' }, { status: 400 })
  }

  const blocked = await getBlockedRanges()
  const slots = filterAvailableSlots(generateSlotsForDate(date), blocked)

  return NextResponse.json(
    {
      timezone: BOOKING_TZ,
      date,
      slots: slots.map((s) => ({
        time: s.time,
        label: s.label,
        startUtc: s.startUtc,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
