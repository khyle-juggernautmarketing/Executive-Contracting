'use client'

import { BadgeCheck, Calendar, MapPin, Shield } from 'lucide-react'
import { TRUST_BADGES } from '@/lib/constants'

const ICONS = { MapPin, Calendar, Shield, BadgeCheck }

export function TrustBadges() {
  return (
    <section className="relative overflow-hidden bg-executive-border/20 py-14">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {TRUST_BADGES.map((badge, i) => {
            const Icon = ICONS[badge.icon] ?? BadgeCheck
            return (
              <div
                key={badge.tag}
                className="group relative overflow-hidden rounded-xl border border-executive-border/60 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-executive-dark/20 hover:shadow-card-lg"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-executive-dark/5 transition-transform group-hover:scale-150" aria-hidden />
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-executive-accent text-executive-dark">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-executive-muted">
                  {badge.tag}
                </span>
                <p className="mt-1 text-base font-bold text-executive-dark">{badge.title}</p>
                <p className="mt-1 text-xs text-executive-muted">{badge.subtitle}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
