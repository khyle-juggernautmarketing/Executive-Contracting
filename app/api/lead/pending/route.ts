import { NextResponse } from 'next/server'
import { flushExpiredPendingLeads, registerPendingLead } from '@/lib/pendingLeads'
import { isRateLimited, rateLimitKey, validateLeadBody } from '@/lib/leadSecurity'
import type { LeadPayload } from '@/types/booking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 8_192

export async function POST(request: Request) {
  await flushExpiredPendingLeads().catch(() => {})

  const limiterKey = rateLimitKey(request)
  if (isRateLimited(limiterKey)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes or call 954-571-1894.' },
      { status: 429 },
    )
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
  }

  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validated = validateLeadBody(body)
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const {
      service,
      propertyAge,
      timeline,
      firstName,
      lastName,
      email,
      phone,
      address,
      tcpaConsent,
    } = validated.data

    const lead: LeadPayload = {
      service,
      propertyAge,
      timeline,
      firstName,
      lastName,
      email,
      phone,
      address,
      tcpaConsent,
    }

    const { pendingId, expiresAt } = await registerPendingLead(lead)

    return NextResponse.json(
      { ok: true, pendingId, expiresAt },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('Lead pending API: unexpected error', e)
    return NextResponse.json({ error: 'Server error. Please call 954-571-1894.' }, { status: 500 })
  }
}
