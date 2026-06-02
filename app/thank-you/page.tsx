import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Phone } from 'lucide-react'
import { PHONE_PRIMARY, PHONE_PRIMARY_HREF, YEAR_EST } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Your Executive Construction request and appointment have been received.',
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<{ appointment?: string }>
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams
  const appointmentLabel = params.appointment?.trim() || ''

  return (
    <div className="min-h-[100svh] bg-executive-surface">
      <header className="border-b border-executive-border/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Executive Construction" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="text-sm font-bold text-executive-dark sm:text-base">Executive Construction</span>
          </Link>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-executive-muted sm:block">
            {YEAR_EST}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-2xl bg-white shadow-elevated ring-1 ring-executive-border/40">
          <div className="bg-executive-dark px-6 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-executive-accent/20">
              <CheckCircle2 className="h-9 w-9 text-executive-accent" strokeWidth={2.5} aria-hidden />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">Thank You!</h1>
            <p className="mt-2 text-sm text-executive-border sm:text-base">
              Your request has been received by our team.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 sm:px-10 sm:py-10">
            {appointmentLabel ? (
              <div className="rounded-xl border border-executive-accent/30 bg-executive-accent/10 px-4 py-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-executive-muted">Scheduled appointment</p>
                <p className="mt-1 text-base font-bold text-executive-dark sm:text-lg">{appointmentLabel}</p>
                <p className="mt-1 text-xs text-executive-muted">Eastern Time (EST/EDT)</p>
              </div>
            ) : (
              <p className="text-center text-sm leading-relaxed text-executive-muted">
                We received your project details. A specialist will follow up shortly to confirm next steps.
              </p>
            )}

            <ul className="space-y-3 text-sm text-executive-dark">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-executive-accent" aria-hidden />
                <span>Your information was sent securely to our scheduling team.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-executive-accent" aria-hidden />
                <span>Expect a confirmation call or text before your appointment window.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-executive-accent" aria-hidden />
                <span>For urgent mobilization, call our direct line anytime.</span>
              </li>
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={PHONE_PRIMARY_HREF}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-executive-accent px-6 text-sm font-bold text-executive-dark shadow-md transition-all hover:bg-executive-accent-dark"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Call {PHONE_PRIMARY}
              </a>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-executive-border px-6 text-sm font-bold text-executive-dark transition-all hover:border-executive-accent hover:bg-executive-accent/10"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
