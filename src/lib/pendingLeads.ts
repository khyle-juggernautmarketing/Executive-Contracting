import { randomUUID } from 'crypto'
import {
  addPendingLead,
  getExpiredPendingLeads,
  getPendingLead,
  removePendingLead,
  withBookingStore,
} from '@/lib/bookingStore'
import { sendLeadToWebhook, type WebhookLeadInput } from '@/lib/leadWebhook'
import type { LeadPayload } from '@/types/booking'

export const PENDING_LEAD_TTL_MS = 10 * 60 * 1000

export async function registerPendingLead(lead: LeadPayload): Promise<{ pendingId: string; expiresAt: string }> {
  const pendingId = randomUUID()
  const expiresAt = new Date(Date.now() + PENDING_LEAD_TTL_MS).toISOString()

  await addPendingLead({
    id: pendingId,
    expiresAt,
    webhookSent: false,
    lead,
    createdAt: new Date().toISOString(),
  })

  return { pendingId, expiresAt }
}

export async function resolvePendingLead(
  pendingId: string,
  leadFallback?: LeadPayload | null,
): Promise<{ lead: LeadPayload; expiresAt: string; webhookSent: boolean } | null> {
  const stored = await getPendingLead(pendingId)
  if (stored) {
    return { lead: stored.lead, expiresAt: stored.expiresAt, webhookSent: stored.webhookSent }
  }

  if (!leadFallback) return null

  const expiresAt = new Date(Date.now() + PENDING_LEAD_TTL_MS).toISOString()
  await addPendingLead({
    id: pendingId,
    expiresAt,
    webhookSent: false,
    lead: leadFallback,
    createdAt: new Date().toISOString(),
  })

  return { lead: leadFallback, expiresAt, webhookSent: false }
}

export async function flushPendingLead(
  pendingId: string,
  submissionType: WebhookLeadInput['submissionType'],
  appointment?: WebhookLeadInput['appointment'],
  leadFallback?: LeadPayload | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string; skipped?: boolean }> {
  const resolved = await resolvePendingLead(pendingId, leadFallback)
  if (!resolved) {
    return { ok: false, status: 404, error: 'Session expired. Please start the form again.', skipped: true }
  }

  if (resolved.webhookSent) {
    return { ok: false, status: 409, error: 'Lead already submitted.', skipped: true }
  }

  if (submissionType === 'form_only_timeout') {
    const expired = new Date(resolved.expiresAt).getTime() <= Date.now()
    if (!expired) {
      return { ok: false, status: 400, error: 'Not yet expired.', skipped: true }
    }
  }

  let locked = false
  await withBookingStore((store) => {
    const item = store.pending.find((p) => p.id === pendingId)
    if (!item || item.webhookSent) return
    item.webhookSent = true
    locked = true
  })

  if (!locked) {
    return { ok: false, status: 409, error: 'Lead already submitted.', skipped: true }
  }

  const result = await sendLeadToWebhook({
    ...resolved.lead,
    pendingId,
    submissionType,
    appointment: appointment ?? null,
  })

  if (!result.ok) {
    await withBookingStore((store) => {
      const item = store.pending.find((p) => p.id === pendingId)
      if (item) item.webhookSent = false
    })
    return result
  }

  await removePendingLead(pendingId)
  return { ok: true }
}

export async function flushExpiredPendingLeads(): Promise<number> {
  const expired = await getExpiredPendingLeads()
  let count = 0

  for (const item of expired) {
    const result = await flushPendingLead(item.id, 'form_only_timeout', null)
    if (result.ok) count += 1
  }

  return count
}
