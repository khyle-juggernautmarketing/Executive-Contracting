import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getPendingLead, readBookingStore, withBookingStore } from '@/lib/bookingStore'
import {
  BOOKING_TZ,
  filterAvailableSlots,
  formatSlotLabel,
  generateSlotsForDate,
  isSlotBlocked,
} from '@/lib/bookingSchedule'
import { flushPendingLead, resolvePendingLead } from '@/lib/pendingLeads'
import { isRateLimited, rateLimitKey, sanitizeText, validateLeadBody } from '@/lib/leadSecurity'
import type { AppointmentPayload, LeadPayload } from '@/types/booking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 12_288

function leadFromBody(body: Record<string, unknown>): LeadPayload | null {
  const nested = body.lead
  const source = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : body
  const validated = validateLeadBody({ ...source, _hp: body._hp ?? body.website })
  if (!validated.ok) return null
  const { service, propertyAge, timeline, firstName, lastName, email, phone, address, tcpaConsent } =
    validated.data
  return { service, propertyAge, timeline, firstName, lastName, email, phone, address, tcpaConsent }
}

export async function POST(request: Request) {
  const limiterKey = rateLimitKey(request)
  if (isRateLimited(limiterKey)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes or call 954-571-1894.' },
      { status: 429 },
    )
  }

  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    const body = JSON.parse(raw) as Record<string, unknown>
    const honeypot = sanitizeText(body._hp ?? body.website, 200)
    if (honeypot) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }

    const pendingId = sanitizeText(body.pendingId, 64)
    const date = sanitizeText(body.date, 16)
    const time = sanitizeText(body.time, 8)

    if (!pendingId || !date || !time) {
      return NextResponse.json({ error: 'Missing booking fields' }, { status: 400 })
    }

    const leadFallback = leadFromBody(body)
    const resolved = await resolvePendingLead(pendingId, leadFallback)
    if (!resolved) {
      return NextResponse.json({ error: 'Session expired. Please start the form again.' }, { status: 410 })
    }
    if (resolved.webhookSent) {
      return NextResponse.json({ error: 'This request was already submitted.' }, { status: 409 })
    }

    const pending = await getPendingLead(pendingId)
    const lead = pending?.lead ?? resolved.lead

    const slots = generateSlotsForDate(date)
    const slot = slots.find((s) => s.time === time)
    if (!slot) {
      return NextResponse.json({ error: 'Selected time is not available' }, { status: 400 })
    }

    const store = await readBookingStore()
    const blocked = store.bookings.map((b) => ({ startUtc: b.startUtc, blockEndUtc: b.blockEndUtc }))
    if (isSlotBlocked(slot, blocked)) {
      return NextResponse.json({ error: 'That time was just booked. Please choose another.' }, { status: 409 })
    }

    const bookingId = randomUUID()
    let booked = false

    await withBookingStore((data) => {
      const ranges = data.bookings.map((b) => ({ startUtc: b.startUtc, blockEndUtc: b.blockEndUtc }))
      const available = filterAvailableSlots([slot], ranges)
      if (available.length === 0) return
      data.bookings.push({
        id: bookingId,
        startUtc: slot.startUtc,
        blockEndUtc: slot.blockEndUtc,
        email: lead.email,
        createdAt: new Date().toISOString(),
      })
      booked = true
    })

    if (!booked) {
      return NextResponse.json({ error: 'That time was just booked. Please choose another.' }, { status: 409 })
    }

    const appointment: AppointmentPayload = {
      date,
      time,
      timezone: BOOKING_TZ,
      startUtc: slot.startUtc,
      endUtc: slot.blockEndUtc,
      displayLabel: formatSlotLabel(date, slot.hour, slot.minute),
    }

    const webhook = await flushPendingLead(pendingId, 'appointment_booked', appointment, lead)
    if (!webhook.ok) {
      return NextResponse.json({ error: webhook.error }, { status: webhook.status })
    }

    return NextResponse.json(
      { ok: true, appointment },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('Appointments book API: unexpected error', e)
    return NextResponse.json({ error: 'Server error. Please call 954-571-1894.' }, { status: 500 })
  }
}
