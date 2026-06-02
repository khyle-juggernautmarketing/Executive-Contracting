'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BookingCalendar } from '@/components/BookingCalendar'
import { PHONE_PRIMARY } from '@/lib/constants'
import { PROPERTY_AGE_OPTIONS, SERVICE_OPTIONS, TIMELINE_OPTIONS } from '@/lib/formOptions'
import { PENDING_STORAGE_PREFIX } from '@/lib/pendingStorage'
import { initialLeadForm } from '@/types/lead'

const FORM_STEPS = [
  { id: 1, title: 'What service do you need?' },
  { id: 2, title: 'How old is your property?' },
  { id: 3, title: 'When do you need your inspection or repair?' },
  { id: 4, title: 'Your contact details' },
]

const CALENDAR_STEP = 5

const HTML_TAG = /<[^>]*>/g
const inputClass =
  'min-h-11 w-full rounded-lg border border-executive-border bg-white px-3.5 text-base text-executive-dark placeholder:text-executive-muted/60 focus:border-executive-accent focus:outline-none focus:ring-2 focus:ring-executive-accent/20 sm:min-h-12 sm:px-4 sm:text-sm'

function sanitizeInput(value) {
  return value.replace(HTML_TAG, '').replace(/[\u0000-\u001F\u007F]/g, '')
}

function parseApiError(body, status) {
  if (body) {
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }
  if (status === 429) {
    return `Too many requests. Please wait a few minutes or call ${PHONE_PRIMARY}.`
  }
  if (status >= 500) {
    return `Our booking system is temporarily unavailable. Please call ${PHONE_PRIMARY}.`
  }
  return `Unable to submit right now. Please call ${PHONE_PRIMARY}.`
}

function useStepAdvanceDelay() {
  const [ms, setMs] = useState(180)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setMs(0)
    })
    return () => cancelAnimationFrame(id)
  }, [])
  return ms
}

function StepIndicator({ step, total }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div className="mb-4 flex items-center justify-center sm:mb-5" aria-label={`Step ${step} of ${total}`}>
      {steps.map((id, i) => (
        <div key={id} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors sm:h-8 sm:w-8 sm:text-xs ${
              step >= id
                ? 'bg-executive-dark text-white ring-2 ring-executive-accent/30'
                : 'border-2 border-executive-border bg-white text-executive-muted'
            }`}
          >
            {step > id ? <CheckCircle2 className="h-3.5 w-3.5 text-executive-accent sm:h-4 sm:w-4" aria-hidden /> : id}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-3 transition-colors sm:w-6 ${step > id ? 'bg-executive-accent' : 'bg-executive-border'}`}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  )
}

function IconOption({ opt, selected, onSelect, index, spanFull = false }) {
  const Icon = opt.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(opt.value)}
      style={{ animationDelay: `${index * 40}ms` }}
      className={`animate-form-option group flex min-h-[48px] items-center gap-2.5 rounded-lg border-2 p-3 text-left transition-all active:scale-[0.99] sm:min-h-[52px] sm:gap-3 sm:p-3.5 ${
        spanFull ? 'sm:col-span-2' : ''
      } ${
        selected
          ? 'border-executive-accent bg-executive-accent/10 ring-2 ring-executive-accent/25 shadow-sm'
          : 'border-executive-border bg-white hover:border-executive-muted hover:bg-executive-border/10'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors sm:h-10 sm:w-10 ${
          selected
            ? 'bg-executive-dark text-white'
            : 'bg-executive-border/30 text-executive-dark group-hover:bg-executive-dark group-hover:text-white'
        }`}
        aria-hidden
      >
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
      </span>
      <span className={`flex-1 text-xs font-semibold leading-snug sm:text-sm ${selected ? 'text-executive-dark' : 'text-executive-muted'}`}>
        {opt.label}
      </span>
      {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-executive-accent sm:h-5 sm:w-5" aria-hidden />}
    </button>
  )
}

export function LeadForm({ compactHeader = false }) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(initialLeadForm)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [pendingId, setPendingId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [leadSnapshot, setLeadSnapshot] = useState(null)
  const flushedRef = useRef(false)
  const stepAdvanceDelayMs = useStepAdvanceDelay()

  const goThankYou = useCallback(
    (appointmentLabel) => {
      flushedRef.current = true
      const q = appointmentLabel ? `?appointment=${encodeURIComponent(appointmentLabel)}` : ''
      router.push(`/thank-you${q}`)
    },
    [router],
  )

  useEffect(() => {
    if (step !== CALENDAR_STEP || !pendingId || !expiresAt || flushedRef.current) return

    const delay = Math.max(0, new Date(expiresAt).getTime() - Date.now())
    const timer = setTimeout(async () => {
      if (flushedRef.current) return
      try {
        const stored = sessionStorage.getItem(`${PENDING_STORAGE_PREFIX}${pendingId}`)
        const lead = stored ? JSON.parse(stored) : leadSnapshot
        await fetch('/api/lead/flush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingId, lead }),
          cache: 'no-store',
        })
      } catch {
        /* cron will retry */
      }
      goThankYou('')
    }, delay)

    return () => clearTimeout(timer)
  }, [step, pendingId, expiresAt, goThankYou, leadSnapshot])

  const selectService = useCallback(
    (service) => {
      setData((d) => ({ ...d, service }))
      setErrorMsg('')
      setTimeout(() => setStep(2), stepAdvanceDelayMs)
    },
    [stepAdvanceDelayMs],
  )

  const selectPropertyAge = useCallback(
    (propertyAge) => {
      setData((d) => ({ ...d, propertyAge }))
      setErrorMsg('')
      setTimeout(() => setStep(3), stepAdvanceDelayMs)
    },
    [stepAdvanceDelayMs],
  )

  const selectTimeline = useCallback(
    (timeline) => {
      setData((d) => ({ ...d, timeline }))
      setErrorMsg('')
      setTimeout(() => setStep(4), stepAdvanceDelayMs)
    },
    [stepAdvanceDelayMs],
  )

  const submitContact = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!data.service) {
      setErrorMsg('Please select a service.')
      setStep(1)
      return
    }
    if (!data.propertyAge) {
      setErrorMsg('Please select your property age.')
      setStep(2)
      return
    }
    if (!data.timeline) {
      setErrorMsg('Please select a timeline.')
      setStep(3)
      return
    }

    const firstName = sanitizeInput(data.firstName.trim())
    const lastName = sanitizeInput(data.lastName.trim())
    const email = sanitizeInput(data.email.trim())
    const phone = sanitizeInput(data.phone.trim())
    const address = sanitizeInput(data.address.trim())

    if (!firstName || !lastName || !email || !phone || !address) {
      setErrorMsg('Please fill in all fields.')
      return
    }
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setErrorMsg('Please enter a valid phone number.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email.')
      return
    }
    if (address.length < 5) {
      setErrorMsg('Please enter a valid property address.')
      return
    }
    if (!data.tcpaConsent) {
      setErrorMsg('Please authorize contact to submit your request.')
      return
    }

    const payload = {
      service: data.service,
      propertyAge: data.propertyAge,
      timeline: data.timeline,
      firstName,
      lastName,
      email,
      phone,
      address,
      tcpaConsent: data.tcpaConsent,
      _hp: honeypot,
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/lead/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        credentials: 'same-origin',
      })

      let body = null
      const raw = await res.text()
      if (raw) {
        try {
          body = JSON.parse(raw)
        } catch {
          body = null
        }
      }

      if (!res.ok) {
        setStatus('idle')
        setErrorMsg(parseApiError(body, res.status))
        return
      }

      setPendingId(body.pendingId)
      setExpiresAt(body.expiresAt)
      flushedRef.current = false
      setStatus('idle')
      setStep(CALENDAR_STEP)
    } catch {
      setStatus('idle')
      setErrorMsg(`Network error. Please try again or call ${PHONE_PRIMARY}.`)
    }
  }

  const handleBooked = (appointment) => {
    const label = appointment?.displayLabel || ''
    goThankYou(label)
  }

  const motionDur = prefersReducedMotion ? 0 : 0.35
  const stepTitle =
    step === CALENDAR_STEP ? 'Pick your appointment date & time' : FORM_STEPS[step - 1]?.title

  return (
    <div className="relative w-full min-w-0">
      {!compactHeader && (
        <div className="mb-4 text-center sm:mb-5">
          <h3 className="text-base font-bold text-executive-dark sm:text-lg lg:text-xl">Get Your Free Precision Budget</h3>
          <p className="mt-1 text-xs text-executive-muted sm:text-sm">
            {step === CALENDAR_STEP ? 'Choose a time — Eastern (EST/EDT).' : 'Four quick steps, then schedule your visit.'}
          </p>
        </div>
      )}

      <StepIndicator step={step} total={CALENDAR_STEP} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
          transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-sm font-semibold leading-snug text-executive-dark sm:mb-3.5">{stepTitle}</p>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {SERVICE_OPTIONS.map((opt, i) => (
                <IconOption
                  key={opt.value}
                  opt={opt}
                  selected={data.service === opt.value}
                  onSelect={selectService}
                  index={i}
                  spanFull={i === SERVICE_OPTIONS.length - 1 && SERVICE_OPTIONS.length % 2 === 1}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {PROPERTY_AGE_OPTIONS.map((opt, i) => (
                <IconOption
                  key={opt.value}
                  opt={opt}
                  selected={data.propertyAge === opt.value}
                  onSelect={selectPropertyAge}
                  index={i}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {TIMELINE_OPTIONS.map((opt, i) => (
                <IconOption
                  key={opt.value}
                  opt={opt}
                  selected={data.timeline === opt.value}
                  onSelect={selectTimeline}
                  index={i}
                />
              ))}
            </div>
          )}

          {step === 4 && (
            <form onSubmit={submitContact} className="space-y-3">
              <label className="sr-only" aria-hidden>
                Website
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-executive-muted">First Name</span>
                  <input
                    required
                    autoComplete="given-name"
                    value={data.firstName}
                    onChange={(e) => setData({ ...data, firstName: sanitizeInput(e.target.value) })}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-executive-muted">Last Name</span>
                  <input
                    required
                    autoComplete="family-name"
                    value={data.lastName}
                    onChange={(e) => setData({ ...data, lastName: sanitizeInput(e.target.value) })}
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-executive-muted">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: sanitizeInput(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-executive-muted">Phone</span>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: sanitizeInput(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-executive-muted">Property Address</span>
                <input
                  required
                  autoComplete="street-address"
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: sanitizeInput(e.target.value) })}
                  placeholder="Street address, city, state"
                  className={inputClass}
                />
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border border-executive-border bg-executive-border/15 p-3 sm:min-h-12 sm:gap-3">
                <input
                  type="checkbox"
                  checked={data.tcpaConsent}
                  onChange={(e) => setData({ ...data, tcpaConsent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-executive-border text-executive-accent focus:ring-executive-accent sm:mt-1 sm:h-5 sm:w-5"
                />
                <span className="text-[11px] leading-relaxed text-executive-muted sm:text-xs">
                  By clicking continue, you authorize Executive Construction to text or call regarding this free quote
                  under CCPA &amp; TCPA privacy compliance standards.
                </span>
              </label>
              {errorMsg && (
                <p className="text-sm text-red-600" role="alert">
                  {errorMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-executive-accent text-sm font-bold uppercase tracking-wide text-executive-dark shadow-md transition-all duration-300 hover:bg-executive-accent-dark disabled:opacity-70 sm:min-h-12"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Saving...
                  </>
                ) : (
                  'Continue to Schedule'
                )}
              </button>
            </form>
          )}

          {step === CALENDAR_STEP && pendingId && (
            <>
              {errorMsg && (
                <p className="mb-3 text-sm text-red-600" role="alert">
                  {errorMsg}
                </p>
              )}
              <BookingCalendar
                pendingId={pendingId}
                leadSnapshot={leadSnapshot}
                onBooked={handleBooked}
                onError={setErrorMsg}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {errorMsg && step !== 4 && step !== CALENDAR_STEP && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {errorMsg}
        </p>
      )}

      {step > 1 && (
        <div className="mt-3 border-t border-executive-border/40 pt-3 sm:mt-4">
          <button
            type="button"
            onClick={() => {
              setErrorMsg('')
              setStep((s) => Math.max(1, s - 1))
            }}
            className="flex min-h-10 items-center text-sm font-semibold text-executive-muted transition-colors hover:text-executive-dark"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}
