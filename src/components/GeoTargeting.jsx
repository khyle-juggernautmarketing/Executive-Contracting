'use client'

import { GEO_CITIES } from '@/lib/constants'

export function GeoTargeting() {
  return (
    <section id="service-areas" className="overflow-hidden bg-white px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-executive-muted">Coverage</span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-executive-dark sm:text-4xl">
          Proudly Serving South Florida
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-executive-muted">
          Local crews across Miami-Dade, Broward, and Palm Beach counties — mobilized for commercial interior
          projects of every scale.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {GEO_CITIES.map((city) => (
            <span
              key={city.name}
              className={`inline-flex cursor-default items-center rounded-full border py-2.5 px-5 text-xs font-semibold transition-all duration-300 ${
                city.featured
                  ? 'scale-105 border-executive-dark bg-executive-dark text-sm font-bold text-white shadow-lg shadow-executive-dark/20'
                  : 'border-executive-border bg-executive-border/20 text-executive-dark hover:scale-105 hover:border-executive-accent hover:bg-executive-border/40'
              }`}
            >
              {city.featured && <span aria-hidden>📍 </span>}
              {city.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
