'use client'

import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { VALUE_PROPS, YEAR_EST } from '@/lib/constants'
import { LeadForm } from '@/components/LeadForm'

function FormCard({ compactHeader = false, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-elevated ring-1 ring-executive-border/30 sm:rounded-2xl ${className}`}>
      <div className="bg-executive-dark px-4 py-2.5 sm:px-5 sm:py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-executive-border">
          Complimentary Blueprint
        </p>
        <p className="text-sm font-semibold text-white">Request Your Precision Budget</p>
      </div>
      <div className="p-4 sm:p-5 lg:p-6">
        <LeadForm compactHeader={compactHeader} />
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section id="contact" className="relative overflow-hidden bg-executive-dark lg:min-h-[100svh]">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-40" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl lg:min-h-[100svh] lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-center px-4 pb-6 pt-24 sm:px-5 sm:pb-8 sm:pt-28 lg:col-span-6 lg:px-8 lg:pb-16 lg:pt-32">
          <div className="hero-line hero-line-d0 mb-4 flex items-center gap-3 sm:mb-6">
            <span className="h-px w-8 bg-executive-border" aria-hidden />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-executive-border">
              {YEAR_EST} · Deerfield Beach, FL
            </span>
          </div>

          <h1 className="hero-line hero-line-d1 text-balance text-[1.75rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[3.25rem] xl:text-6xl">
            Commercial Interior{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Construction</span>
              <span
                className="absolute -bottom-1 left-0 h-2.5 w-full bg-executive-accent/40 sm:h-3 lg:h-4"
                aria-hidden
              />
            </span>{' '}
            Built to Executive Standards.
          </h1>

          <p className="hero-line hero-line-d2 mt-4 max-w-lg text-sm leading-relaxed text-executive-border sm:mt-6 sm:text-base lg:text-lg">
            Precision tenant build-outs and commercial interiors across South Florida — Miami, Fort
            Lauderdale, and Palm Beach. Selective projects. Meticulous execution.
          </p>

          <ul className="hero-line hero-line-d3 mt-6 space-y-3 sm:mt-8 sm:space-y-3.5">
            {VALUE_PROPS.map((prop) => (
              <li key={prop} className="flex items-start gap-2.5 text-white/90 sm:gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-executive-accent sm:h-5 sm:w-5" aria-hidden />
                <span className="text-sm font-medium sm:text-base">{prop}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-8 lg:hidden">
            <FormCard />
          </div>
        </div>

        <div className="relative hidden lg:col-span-6 lg:block">
          <div className="absolute inset-0 clip-diagonal overflow-hidden">
            <Image
              src="/hero-bg.jpg"
              alt=""
              fill
              className="object-cover object-center"
              sizes="50vw"
              priority
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-r from-executive-dark via-executive-dark/40 to-transparent" aria-hidden />
            <div className="absolute inset-0 bg-executive-dark/20 mix-blend-multiply" aria-hidden />
          </div>

          <div className="animate-hero-aside absolute bottom-8 left-4 z-20 w-full max-w-[420px] xl:bottom-12 xl:left-0 xl:max-w-md xl:-translate-x-6">
            <FormCard compactHeader />
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 bg-executive-deeper/80 px-4 py-2.5 backdrop-blur-sm sm:py-3">
        <p className="mx-auto max-w-7xl text-center text-[11px] font-semibold leading-snug text-executive-border sm:text-xs md:text-sm">
          <span className="mr-1.5 inline-flex h-2 w-2 animate-pulse rounded-full bg-executive-accent sm:mr-2" aria-hidden />
          <span className="hidden sm:inline">Commercial Interiors Blueprinting Line Open — South Florida Tenants · Call </span>
          <span className="sm:hidden">Blueprint Line Open · Call </span>
          <a href="tel:+19545711894" className="font-bold text-white underline-offset-2 hover:underline">
            954-571-1894
          </a>
        </p>
      </div>
    </section>
  )
}
