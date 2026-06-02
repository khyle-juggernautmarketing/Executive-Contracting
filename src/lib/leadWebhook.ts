import { NextResponse } from 'next/server'
import { isAllowedWebhookHost, isValidJwtSecret, isValidWebhookUrl, signJwtHS256 } from '@/lib/jwt'
import type { AppointmentPayload, LeadPayload } from '@/types/booking'

const WEBHOOK_TIMEOUT_MS = 20_000
const WEBHOOK_MAX_ATTEMPTS = 3

export function getWebhookConfig() {
  const url = process.env.N8N_WEBHOOK_URL?.trim()
  const jwtSecret = process.env.N8N_JWT_SECRET?.trim()
  if (!url || !jwtSecret) return null
  if (!isValidWebhookUrl(url) || !isValidJwtSecret(jwtSecret) || !isAllowedWebhookHost(url)) {
    return null
  }
  return { url, jwtSecret }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postToWebhook(url: string, jwtSecret: string, payload: Record<string, unknown>) {
  const token = signJwtHS256(jwtSecret, { sub: 'lead-form' })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function postToWebhookWithRetry(url: string, jwtSecret: string, payload: Record<string, unknown>) {
  let lastResponse: Response | null = null
  let lastError: unknown = null

  for (let attempt = 1; attempt <= WEBHOOK_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await postToWebhook(url, jwtSecret, payload)
      if (res.status >= 200 && res.status < 300) return res

      lastResponse = res
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
        return res
      }
    } catch (error) {
      lastError = error
    }

    if (attempt < WEBHOOK_MAX_ATTEMPTS) {
      await sleep(350 * attempt)
    }
  }

  if (lastResponse) return lastResponse
  throw lastError ?? new Error('Webhook unreachable')
}

export type WebhookLeadInput = LeadPayload & {
  appointment?: AppointmentPayload | null
  pendingId?: string
  submissionType: 'appointment_booked' | 'form_only_timeout'
}

export function buildWebhookPayload(input: WebhookLeadInput) {
  const fullName = `${input.firstName} ${input.lastName}`.trim()
  return {
    service: input.service,
    propertyAge: input.propertyAge,
    timeline: input.timeline,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    tcpaConsent: input.tcpaConsent,
    consent: input.tcpaConsent,
    appointment: input.appointment ?? null,
    appointmentBooked: Boolean(input.appointment),
    submissionType: input.submissionType,
    pendingId: input.pendingId,
    source: 'executive-construction-landing',
    submittedAt: new Date().toISOString(),
  }
}

export async function sendLeadToWebhook(input: WebhookLeadInput): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const config = getWebhookConfig()
  if (!config) {
    return { ok: false, status: 500, error: 'Form is not configured on the server. Please call 954-571-1894.' }
  }

  const payload = buildWebhookPayload(input)

  if (process.env.NODE_ENV === 'development') {
    console.log('[Lead Trace]', { ...payload, email: '[redacted]', phone: '[redacted]' })
  }

  try {
    const res = await postToWebhookWithRetry(config.url, config.jwtSecret, payload)
    if (res.status >= 200 && res.status < 300) {
      return { ok: true }
    }

    const errBody = await res.text().catch(() => '')
    console.error('Lead webhook rejected', res.status, errBody.slice(0, 200))

    return {
      ok: false,
      status: 502,
      error:
        res.status === 401 || res.status === 403
          ? 'Form authentication failed on the server. Please call 954-571-1894.'
          : 'Our booking system could not process your request. Please call 954-571-1894.',
    }
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    console.error('Lead webhook unreachable', aborted ? 'timeout' : 'network')
    return {
      ok: false,
      status: 503,
      error: aborted
        ? 'Request timed out. Please try again or call 954-571-1894.'
        : 'Could not reach our booking system. Please try again or call 954-571-1894.',
    }
  }
}

export function webhookErrorResponse(result: { ok: false; status: number; error: string }) {
  return NextResponse.json({ error: result.error }, { status: result.status })
}
