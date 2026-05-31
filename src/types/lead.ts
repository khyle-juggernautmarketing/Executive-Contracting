export const PROJECT_DOMAINS = [
  'office-buildout',
  'renovation',
  'acoustic-partition',
  'minor-modifications',
] as const

export const TIMELINES = ['immediate', '30-60-days', 'planning'] as const

export type ProjectDomain = (typeof PROJECT_DOMAINS)[number]
export type Timeline = (typeof TIMELINES)[number]

export interface LeadFormData {
  projectDomain: ProjectDomain | ''
  timeline: Timeline | ''
  fullName: string
  email: string
  phone: string
  address: string
  tcpaConsent: boolean
}

export const initialLeadForm: LeadFormData = {
  projectDomain: '',
  timeline: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  tcpaConsent: false,
}
