'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Phone, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BRAND_NAME, NAV_LINKS, PHONE_PRIMARY, PHONE_PRIMARY_HREF } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? 'border-b border-executive-border/40 bg-white/95 shadow-glow backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 lg:py-4">
          <Link href="#" className="flex shrink-0 items-center gap-3" aria-label={`${BRAND_NAME} home`}>
            <Image
              src="/logo.svg"
              alt={BRAND_NAME}
              width={48}
              height={48}
              className="h-11 w-11 rounded-full ring-2 ring-executive-border/50 sm:h-12 sm:w-12"
              priority
            />
            <div className="hidden sm:block">
              <p className={`text-sm font-bold leading-none tracking-tight ${scrolled ? 'text-executive-dark' : 'text-white'}`}>
                Executive
              </p>
              <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${scrolled ? 'text-executive-muted' : 'text-executive-border'}`}>
                Construction
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative text-xs font-bold uppercase tracking-widest transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-executive-accent after:transition-all hover:after:w-full ${
                  scrolled ? 'text-executive-muted hover:text-executive-dark' : 'text-executive-border hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={PHONE_PRIMARY_HREF}
              className={`inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold transition-all duration-300 ${
                scrolled
                  ? 'bg-executive-dark text-white hover:bg-executive-deeper'
                  : 'bg-white/10 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20'
              }`}
              aria-label={`Call now ${PHONE_PRIMARY}`}
            >
              <Phone className="h-4 w-4" aria-hidden />
              {PHONE_PRIMARY}
            </a>
          </div>

          <button
            type="button"
            className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg lg:hidden ${
              scrolled ? 'bg-executive-border/30 text-executive-dark' : 'bg-white/10 text-white ring-1 ring-white/20'
            }`}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-executive-dark/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden bg-executive-dark p-6 text-white shadow-2xl lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              aria-label="Mobile navigation"
            >
              <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <Image src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10 rounded-full" aria-hidden />
                  <span className="font-bold">{BRAND_NAME}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-12 min-w-12 rounded-lg text-executive-border hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="mx-auto h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="nav-mobile-link block min-h-12 rounded-lg px-4 py-3 text-lg font-semibold text-executive-border hover:bg-white/5 hover:text-white"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="mt-auto space-y-3 border-t border-white/10 pt-8">
                <a
                  href={PHONE_PRIMARY_HREF}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white/10 font-bold text-white ring-1 ring-white/20"
                >
                  <Phone className="h-5 w-5" /> {PHONE_PRIMARY}
                </a>
                <Button href="#contact" variant="accent" className="w-full !normal-case" onClick={() => setOpen(false)}>
                  Get Free Quote
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
