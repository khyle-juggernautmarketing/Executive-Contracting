'use client'

import { PROCESS_STEPS } from '@/lib/constants'

export function Process() {
  return (
    <section className="overflow-hidden bg-executive-border/15 px-4 py-20 sm:py-24">
      <div
        id="process"
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-executive-dark px-6 py-12 shadow-elevated sm:px-10 lg:px-14 lg:py-16"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-[0.07]" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" aria-hidden />

        <div className="relative text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-executive-border">Core Process</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Mastering Your Property Project Lifecycle
          </h2>
        </div>

        {/* Desktop timeline */}
        <div className="relative mt-14 hidden md:block">
          <div className="absolute left-0 right-0 top-8 h-px bg-executive-border/30" aria-hidden />
          <div className="grid grid-cols-4 gap-6">
            {PROCESS_STEPS.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-executive-accent bg-executive-dark text-lg font-black text-executive-accent shadow-lg">
                  {item.step}
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-executive-border">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile stack */}
        <div className="relative mt-10 space-y-6 md:hidden">
          {PROCESS_STEPS.map((item, i) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-executive-border bg-executive-dark font-bold text-white">
                  {item.step}
                </div>
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="mt-2 w-px flex-1 bg-executive-border/30" aria-hidden />
                )}
              </div>
              <div className="pb-4">
                <h3 className="font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-executive-border">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
