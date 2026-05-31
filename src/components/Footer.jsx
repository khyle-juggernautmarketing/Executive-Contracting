'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ADDRESS,
  BRAND_NAME,
  EMAIL,
  FOOTER_LINKS,
  FOOTER_MISSION,
  LICENSE,
  PHONE_PRIMARY,
  PHONE_PRIMARY_HREF,
} from '@/lib/constants'

export function Footer() {
  return (
    <footer className="overflow-hidden bg-executive-deeper px-4 py-16 text-executive-border">
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-executive-accent/30 to-transparent" aria-hidden />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt={BRAND_NAME}
              width={52}
              height={52}
              className="h-12 w-12 rounded-full ring-2 ring-executive-border/30"
            />
            <div>
              <p className="text-lg font-bold text-white">Executive</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-executive-border">Construction</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-executive-border/90">{FOOTER_MISSION}</p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white">Quick Anchors</h3>
          <ul className="space-y-2.5 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href + link.label}>
                <a href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white">Physical Directory</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <p className="font-semibold text-white/80">Office</p>
              <p className="text-executive-border/90">{ADDRESS}</p>
            </li>
            <li>
              <p className="font-semibold text-white/80">Phone</p>
              <a href={PHONE_PRIMARY_HREF} className="font-bold text-white transition-colors hover:text-executive-border">
                {PHONE_PRIMARY}
              </a>
            </li>
            <li>
              <p className="font-semibold text-white/80">Email</p>
              <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-white">
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white">Compliance &amp; Hours</h3>
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed text-executive-border/90">
              🕒 Hours: 24/7 Emergency Outpost Dispatches
            </p>
            <p className="rounded-lg border border-executive-border/20 bg-white/5 px-4 py-3 font-semibold text-white">
              {LICENSE}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-7xl border-t border-white/10 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-executive-border/70 sm:flex-row">
          <p>© 2026 Executive Construction. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
