export const SERVICES = [
  'roof-replacement',
  'storm-repair',
  'commercial',
  'custom-design',
  'remodeling',
] as const

export const PROPERTY_AGES = ['under-10', '10-15', 'over-15', 'not-sure'] as const

export const TIMELINES = ['asap', '1-2-weeks', '1-month', 'researching'] as const

export type Service = (typeof SERVICES)[number]
export type PropertyAge = (typeof PROPERTY_AGES)[number]
export type Timeline = (typeof TIMELINES)[number]

export interface LeadFormData {
  service: Service | ''
  propertyAge: PropertyAge | ''
  timeline: Timeline | ''
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  tcpaConsent: boolean
}

export const initialLeadForm: LeadFormData = {
  service: '',
  propertyAge: '',
  timeline: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  tcpaConsent: false,
}
