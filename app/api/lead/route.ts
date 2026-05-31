import { NextResponse } from 'next/server'
import { isAllowedWebhookHost, isValidJwtSecret, isValidWebhookUrl, signJwtHS256 } from '@/lib/jwt'
import { isRateLimited, rateLimitKey, validateLeadBody } from '@/lib/leadSecurity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_TIMEOUT_MS = 20_000
const WEBHOOK_MAX_ATTEMPTS = 3
const MAX_BODY_BYTES = 8_192

function getWebhookConfig() {
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
      // Do not retry permanent client errors (bad auth, not found, etc.)
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

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST(request: Request) {
  const config = getWebhookConfig()
  if (!config) {
    console.error('Lead API: invalid or missing webhook configuration')
    return NextResponse.json(
      { error: 'Form is not configured on the server. Please call 954-571-1894.' },
      { status: 500 },
    )
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 })
  }

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

    const fullName = `${firstName} ${lastName}`.trim()

    const payload = {
      service,
      propertyAge,
      timeline,
      firstName,
      lastName,
      fullName,
      email,
      phone,
      address,
      tcpaConsent,
      consent: tcpaConsent,
      source: 'executive-construction-landing',
      submittedAt: new Date().toISOString(),
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Lead Trace]', { ...payload, email: '[redacted]', phone: '[redacted]' })
    }

    let res: Response
    try {
      res = await postToWebhookWithRetry(config.url, config.jwtSecret, payload)
    } catch (e) {
      const aborted = e instanceof Error && e.name === 'AbortError'
      const code = e instanceof Error && 'cause' in e && e.cause instanceof Error ? e.cause.message : ''
      console.error('Lead API: webhook unreachable', aborted ? 'timeout' : 'network', code)
      return NextResponse.json(
        {
          error: aborted
            ? 'Request timed out. Please try again or call 954-571-1894.'
            : 'Could not reach our booking system. Please try again or call 954-571-1894.',
        },
        { status: 503 },
      )
    }

    if (res.status >= 200 && res.status < 300) {
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const errBody = await res.text().catch(() => '')
    console.error('Lead API: webhook rejected request', res.status, errBody.slice(0, 200))

    return NextResponse.json(
      {
        error:
          res.status === 401 || res.status === 403
            ? 'Form authentication failed on the server. Please call 954-571-1894.'
            : 'Our booking system could not process your request. Please call 954-571-1894.',
      },
      { status: 502 },
    )
  } catch {
    console.error('Lead API: unexpected error')
    return NextResponse.json({ error: 'Server error. Please call 954-571-1894.' }, { status: 500 })
  }
}
