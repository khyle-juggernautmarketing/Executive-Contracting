import type { LeadFormData } from '@/types/lead'

export interface LeadPayload {
  service: string
  propertyAge: string
  timeline: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  tcpaConsent: boolean
}

export interface AppointmentPayload {
  date: string
  time: string
  timezone: 'America/New_York'
  startUtc: string
  endUtc: string
  displayLabel: string
}

export interface StoredBooking {
  id: string
  startUtc: string
  blockEndUtc: string
  email: string
  createdAt: string
}

export interface StoredPendingLead {
  id: string
  expiresAt: string
  webhookSent: boolean
  lead: LeadPayload
  createdAt: string
}

export interface BookingStoreData {
  bookings: StoredBooking[]
  pending: StoredPendingLead[]
}

export type ValidatedLead = LeadFormData & {
  service: NonNullable<LeadFormData['service']>
  propertyAge: NonNullable<LeadFormData['propertyAge']>
  timeline: NonNullable<LeadFormData['timeline']>
}
