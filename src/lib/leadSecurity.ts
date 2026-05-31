import type { LeadFormData } from '@/types/lead'
import { PROPERTY_AGES, SERVICES, TIMELINES } from '@/types/lead'

const MAX = {
  firstName: 60,
  lastName: 60,
  email: 254,
  phone: 32,
  address: 200,
} as const

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g
const HTML_TAG = /<[^>]*>/g

export function sanitizeText(value: unknown, maxLen: number): string {
  return String(value ?? '')
    .replace(CONTROL_CHARS, '')
    .replace(HTML_TAG, '')
    .trim()
    .slice(0, maxLen)
}

export function isAllowedEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value)
}

export function validateLeadBody(body: unknown):
  | { ok: true; data: LeadFormData }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' }
  }

  const raw = body as Record<string, unknown>

  const honeypot = sanitizeText(raw._hp ?? raw.website, 200)
  if (honeypot) {
    return { ok: false, error: 'Invalid submission' }
  }

  const service = sanitizeText(raw.service, 64)
  const propertyAge = sanitizeText(raw.propertyAge, 64)
  const timeline = sanitizeText(raw.timeline, 64)
  const firstName = sanitizeText(raw.firstName, MAX.firstName)
  const lastName = sanitizeText(raw.lastName, MAX.lastName)
  const email = sanitizeText(raw.email, MAX.email).toLowerCase()
  const phone = sanitizeText(raw.phone, MAX.phone)
  const address = sanitizeText(raw.address ?? raw.zip, MAX.address)
  const tcpaConsent = raw.tcpaConsent === true || raw.consent === true

  if (!service || !propertyAge || !timeline || !firstName || !lastName || !email || !phone || !address) {
    return { ok: false, error: 'Missing required fields' }
  }

  if (!isAllowedEnum(service, SERVICES)) {
    return { ok: false, error: 'Invalid service selection' }
  }

  if (!isAllowedEnum(propertyAge, PROPERTY_AGES)) {
    return { ok: false, error: 'Invalid property age selection' }
  }

  if (!isAllowedEnum(timeline, TIMELINES)) {
    return { ok: false, error: 'Invalid timeline selection' }
  }

  if (!tcpaConsent) {
    return { ok: false, error: 'Consent is required to submit' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Invalid email' }
  }

  const phoneDigits = phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return { ok: false, error: 'Invalid phone number' }
  }

  if (address.length < 5) {
    return { ok: false, error: 'Please enter a valid address' }
  }

  return {
    ok: true,
    data: { service, propertyAge, timeline, firstName, lastName, email, phone, address, tcpaConsent },
  }
}

const hits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 8
const RATE_WINDOW_MS = 15 * 60 * 1000

export function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}
