'use client'

import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { MISSION_STATEMENT, SERVICE_PHASES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div id="mission" className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-executive-muted">Our Mission</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-executive-dark sm:text-4xl lg:text-5xl">
            Built With Intent, Not Volume
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-executive-muted">{MISSION_STATEMENT}</p>
          <div className="mx-auto mt-6 h-1 w-16 bg-executive-dark" aria-hidden />
        </div>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {SERVICE_PHASES.map((row, index) => (
            <article
              key={row.title}
              className={`group relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 ${
                row.reverse ? '' : ''
              }`}
            >
              <span
                className={`pointer-events-none absolute -top-8 select-none font-display text-[8rem] font-black leading-none text-executive-border/40 lg:text-[10rem] ${
                  row.reverse ? 'right-0 lg:right-8' : 'left-0 lg:left-8'
                }`}
                aria-hidden
              >
                0{index + 1}
              </span>

              <div
                className={`relative z-10 lg:col-span-5 ${row.reverse ? 'lg:order-2 lg:col-start-8' : 'lg:col-start-1'}`}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-executive-muted">
                  Phase {index + 1}
                </span>
                <h3 className="mt-2 text-2xl font-bold text-executive-dark sm:text-3xl">{row.title}</h3>
                <p className="mt-4 leading-relaxed text-executive-muted">{row.description}</p>
                <div className="mt-8">
                  <Button href="#contact" variant="outline" className="group/btn gap-2 !normal-case">
                    {row.cta}
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
                      aria-hidden
                    />
                  </Button>
                </div>
              </div>

              <div
                className={`relative lg:col-span-7 ${row.reverse ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-6'}`}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-card-lg ring-1 ring-executive-border/50">
                  <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
                    <Image
                      src={row.image}
                      alt={row.alt}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-executive-dark/50 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-executive-dark/90 px-5 py-3 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-executive-border">{row.title}</p>
                  </div>
                </div>
                <div
                  className={`absolute -z-10 h-full w-full rounded-2xl bg-executive-border/40 ${
                    row.reverse ? '-right-4 -top-4' : '-left-4 -top-4'
                  }`}
                  aria-hidden
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
