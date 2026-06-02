'use client'

import { Calendar, Clock, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

function formatDateChip(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(utc)
}

export function BookingCalendar({ pendingId, leadSnapshot, onBooked, onError }) {
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedTime, setSelectedTime] = useState('')
  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingDates(true)
      try {
        const res = await fetch('/api/appointments/availability', { cache: 'no-store' })
        const text = await res.text()
        let data = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error('Calendar unavailable. Please refresh or call us.')
        }
        if (!res.ok) throw new Error(data.error || 'Could not load dates')
        if (cancelled) return
        const list = data.dates ?? []
        setDates(list)
        if (list.length > 0) {
          let picked = list[0]
          for (const d of list) {
            const slotRes = await fetch(`/api/appointments/availability?date=${encodeURIComponent(d)}`, {
              cache: 'no-store',
            })
            const slotText = await slotRes.text()
            let slotData = {}
            try {
              slotData = slotText ? JSON.parse(slotText) : {}
            } catch {
              continue
            }
            if (slotRes.ok && (slotData.slots?.length ?? 0) > 0) {
              picked = d
              break
            }
          }
          setSelectedDate(picked)
        }
      } catch (e) {
        if (!cancelled) onError(e instanceof Error ? e.message : 'Could not load calendar')
      } finally {
        if (!cancelled) setLoadingDates(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [onError])

  const loadSlots = useCallback(
    async (dateKey) => {
      if (!dateKey) return
      setLoadingSlots(true)
      setSelectedTime('')
      try {
        const res = await fetch(`/api/appointments/availability?date=${encodeURIComponent(dateKey)}`, {
          cache: 'no-store',
        })
        const text = await res.text()
        let data = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error('Could not load times. Please refresh.')
        }
        if (!res.ok) throw new Error(data.error || 'Could not load times')
        setSlots(data.slots ?? [])
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Could not load times')
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    },
    [onError],
  )

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate)
  }, [selectedDate, loadSlots])

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime || !pendingId) return
    setSubmitting(true)
    onError('')
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ pendingId, date: selectedDate, time: selectedTime, lead: leadSnapshot }),
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      onBooked(data.appointment)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Booking failed')
      if (selectedDate) loadSlots(selectedDate)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingDates) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-executive-muted">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span className="sr-only">Loading calendar</span>
      </div>
    )
  }

  if (dates.length === 0) {
    return (
      <p className="text-sm text-executive-muted">
        No appointment dates are available in the next 3 days. Please call us directly.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-xs text-executive-muted">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        All times shown in Eastern Time (EST/EDT) · Mon–Sat · 9:00 AM – 5:00 PM
      </p>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-executive-muted">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          Select a date
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={`shrink-0 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                selectedDate === d
                  ? 'border-executive-accent bg-executive-accent/10 text-executive-dark ring-2 ring-executive-accent/20'
                  : 'border-executive-border bg-white text-executive-muted hover:border-executive-muted'
              }`}
            >
              {formatDateChip(d)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-executive-muted">Select a time (15 min)</p>
        {loadingSlots ? (
          <div className="flex min-h-[100px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-executive-muted" aria-hidden />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-executive-muted">No open times on this date. Try another day.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSelectedTime(slot.time)}
                className={`min-h-10 rounded-lg border-2 px-1 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  selectedTime === slot.time
                    ? 'border-executive-accent bg-executive-accent/10 text-executive-dark ring-2 ring-executive-accent/20'
                    : 'border-executive-border bg-white text-executive-dark hover:border-executive-muted'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!selectedTime || submitting}
        onClick={confirmBooking}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-executive-accent text-sm font-bold uppercase tracking-wide text-executive-dark shadow-md transition-all hover:bg-executive-accent-dark disabled:opacity-60 sm:min-h-12"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Confirming...
          </>
        ) : (
          'Confirm Appointment'
        )}
      </button>
    </div>
  )
}
