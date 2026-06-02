import { NextResponse } from 'next/server'
import { flushExpiredPendingLeads, flushPendingLead } from '@/lib/pendingLeads'
import { getPendingLead } from '@/lib/bookingStore'
import { validateLeadBody } from '@/lib/leadSecurity'
import type { LeadPayload } from '@/types/booking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  await flushExpiredPendingLeads().catch(() => {})

  try {
    const body = (await request.json()) as Record<string, unknown>
    const pendingId = typeof body.pendingId === 'string' ? body.pendingId.trim() : ''
    if (!pendingId) {
      return NextResponse.json({ error: 'Missing pendingId' }, { status: 400 })
    }

    const leadFallback = leadFromBody(body)
    const pending = await getPendingLead(pendingId)

    if (!pending && !leadFallback) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'not_found' })
    }

    if (pending?.webhookSent) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'already_sent' })
    }

    const expiresAt = pending?.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const expired = new Date(expiresAt).getTime() <= Date.now()
    if (!expired) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'not_expired' })
    }

    const result = await flushPendingLead(pendingId, 'form_only_timeout', null, leadFallback)
    if (!result.ok) {
      if (result.skipped) {
        return NextResponse.json({ ok: true, skipped: true })
      }
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ ok: true, flushed: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
