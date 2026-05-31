'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PHONE_PRIMARY, PHONE_PRIMARY_HREF } from '@/lib/constants'
import { DOMAIN_OPTIONS, TIMELINE_OPTIONS } from '@/lib/formOptions'
import { initialLeadForm } from '@/types/lead'

const STEPS = [
  { id: 1, title: 'Select Your Project Domain' },
  { id: 2, title: 'Project Launch Window' },
  { id: 3, title: 'Your Contact Details' },
]

const HTML_TAG = /<[^>]*>/g
const inputClass =
  'min-h-12 w-full rounded-lg border border-executive-border bg-white px-4 text-base text-executive-dark placeholder:text-executive-muted/60 focus:border-executive-accent focus:outline-none focus:ring-2 focus:ring-executive-accent/20 sm:text-sm'

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

function StepPills({ step }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2 sm:mb-5">
      {STEPS.map((s) => (
        <div
          key={s.id}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
            step >= s.id
              ? 'bg-executive-dark text-white shadow-md'
              : 'border border-executive-border bg-executive-border/20 text-executive-muted'
          }`}
        >
          {step > s.id ? <CheckCircle2 className="h-4 w-4 text-executive-accent" /> : s.id}
        </div>
      ))}
    </div>
  )
}

function SuccessMarks() {
  return (
    <svg className="h-28 w-28 text-executive-accent" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="rgba(196,169,98,0.15)" />
      <path
        className="animate-check-stroke"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 34l8 8 20-22"
      />
    </svg>
  )
}

export function LeadForm({ compactHeader = false }) {
  const prefersReducedMotion = useReducedMotion()
  const [step, setStep] = useState(1)
  const [data, setData] = useState(initialLeadForm)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const stepAdvanceDelayMs = useStepAdvanceDelay()

  const handleDomain = useCallback(
    (projectDomain) => {
      setData((d) => ({ ...d, projectDomain }))
      setErrorMsg('')
      setTimeout(() => setStep(2), stepAdvanceDelayMs)
    },
    [stepAdvanceDelayMs],
  )

  const handleTimeline = useCallback(
    (timeline) => {
      setData((d) => ({ ...d, timeline }))
      setErrorMsg('')
      setTimeout(() => setStep(3), stepAdvanceDelayMs)
    },
    [stepAdvanceDelayMs],
  )

  const submit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!data.projectDomain) {
      setErrorMsg('Please select a project type.')
      setStep(1)
      return
    }
    if (!data.timeline) {
      setErrorMsg('Please select a timeline.')
      setStep(2)
      return
    }

    const fullName = sanitizeInput(data.fullName.trim())
    const email = sanitizeInput(data.email.trim())
    const phone = sanitizeInput(data.phone.trim())
    const address = sanitizeInput(data.address.trim())

    if (!fullName || !email || !phone || !address) {
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
      setErrorMsg('Please enter a valid address.')
      return
    }
    if (!data.tcpaConsent) {
      setErrorMsg('Please authorize contact to submit your request.')
      return
    }

    const payload = {
      projectDomain: data.projectDomain,
      timeline: data.timeline,
      fullName,
      email,
      phone,
      address,
      tcpaConsent: data.tcpaConsent,
      _hp: honeypot,
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/lead', {
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

      setData(initialLeadForm)
      setStep(1)
      setStatus('success')
    } catch {
      setStatus('idle')
      setErrorMsg(`Network error. Please try again or call ${PHONE_PRIMARY}.`)
    }
  }

  const motionDur = prefersReducedMotion ? 0 : 0.35
  const selectedOption =
    'border-executive-accent bg-executive-accent/10 ring-2 ring-executive-accent/25 shadow-sm'
  const defaultOption =
    'border-executive-border hover:border-executive-muted hover:bg-executive-border/10'

  if (status === 'success') {
    return (
      <div className="animate-form-success flex min-h-[260px] flex-col items-center justify-center px-2 py-4 text-center sm:min-h-[300px]">
        <SuccessMarks />
        <h3 className="mt-6 text-xl font-bold text-executive-dark">Blueprint Request Received!</h3>
        <p className="mt-2 max-w-sm text-executive-muted">
          Our team will reach out shortly with your complimentary precision budget. For urgent mobilization, call{' '}
          <a
            href={PHONE_PRIMARY_HREF}
            className="font-semibold text-executive-dark underline decoration-executive-accent underline-offset-2 hover:decoration-executive-dark"
          >
            {PHONE_PRIMARY}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 min-h-12 rounded-lg border-2 border-executive-border px-6 text-sm font-bold text-executive-dark transition-all hover:border-executive-accent hover:bg-executive-accent/10"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      {!compactHeader && (
        <div className="mb-4 text-center sm:mb-5">
          <h3 className="text-base font-bold text-executive-dark sm:text-lg lg:text-xl">Get Your Free Precision Budget</h3>
          <p className="mt-1 text-xs text-executive-muted sm:text-sm">Three quick steps to your quote.</p>
        </div>
      )}

      <StepPills step={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
          transition={{ duration: motionDur, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-executive-muted sm:mb-4 sm:text-xs">
            {STEPS[step - 1].title}
          </p>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {DOMAIN_OPTIONS.map((opt, i) => {
                const selected = data.projectDomain === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDomain(opt.value)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`animate-form-option group min-h-11 cursor-pointer rounded-lg border-2 bg-white p-3 text-left text-xs font-semibold text-executive-dark transition-all active:scale-[0.98] sm:min-h-12 sm:p-4 sm:text-sm lg:min-h-14 ${
                      selected ? selectedOption : defaultOption
                    }`}
                  >
                    <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-md bg-executive-border/30 text-executive-dark transition-colors group-hover:bg-executive-dark group-hover:text-white sm:mb-2 sm:h-9 sm:w-9">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                    </span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5 sm:space-y-3">
              {TIMELINE_OPTIONS.map((opt, i) => {
                const selected = data.timeline === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTimeline(opt.value)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={`animate-form-option min-h-11 w-full rounded-lg border-2 bg-white px-3.5 py-3 text-left text-xs font-semibold text-executive-dark transition-all sm:min-h-12 sm:px-4 sm:py-3.5 sm:text-sm lg:min-h-14 ${
                      selected ? selectedOption : defaultOption
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('')
                  setStep(1)
                }}
                className="mt-2 flex min-h-12 items-center text-sm font-semibold text-executive-muted transition-colors hover:text-executive-dark"
              >
                ← Back to Step 1
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={submit} className="space-y-3 sm:space-y-4">
              <input
                type="text"
                name="_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-executive-muted">Full Name</span>
                <input
                  required
                  autoComplete="name"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: sanitizeInput(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-executive-muted">Corporate Email Address</span>
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
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-executive-muted">Direct Line / Office Phone</span>
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
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-executive-muted">Address</span>
                <input
                  required
                  autoComplete="street-address"
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: sanitizeInput(e.target.value) })}
                  placeholder="Street, city, state"
                  className={inputClass}
                />
              </label>
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-executive-border bg-executive-border/15 p-3">
                <input
                  type="checkbox"
                  checked={data.tcpaConsent}
                  onChange={(e) => setData({ ...data, tcpaConsent: e.target.checked })}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-executive-border text-executive-accent focus:ring-executive-accent"
                />
                <span className="text-xs leading-relaxed text-executive-muted">
                  By clicking submit, you authorize Executive Construction to text or call regarding this free quote
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
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-executive-accent text-sm font-bold uppercase tracking-wide text-executive-dark shadow-md transition-all duration-300 hover:bg-executive-accent-dark disabled:opacity-70"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Sending...
                  </>
                ) : (
                  'Submit Free Quote Request'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('')
                  setStep(2)
                }}
                className="flex min-h-12 w-full items-center justify-center text-sm font-semibold text-executive-muted transition-colors hover:text-executive-dark"
              >
                ← Back to Step 2
              </button>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {errorMsg && step !== 3 && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
