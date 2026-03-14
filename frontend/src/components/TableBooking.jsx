import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'
import { sendBookingToWhatsApp } from '../utils/whatsapp.js'

function makeSlots() {
  const slots = []
  const start = 7 * 60
  const end = 22 * 60
  for (let m = start; m <= end; m += 30) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    const d = new Date()
    d.setHours(h, mm, 0, 0)
    slots.push(
      d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
    )
  }
  return slots
}

export default function TableBooking() {
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const slots = useMemo(() => makeSlots(), [])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: today,
    time: slots[0],
    guests: 2,
    specialRequests: '',
  })
  const [busy, setBusy] = useState(false)
  const [bookingId, setBookingId] = useState(null)

  const errors = useMemo(() => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number.'
    if (!form.date) e.date = 'Select a date.'
    if (!form.time) e.time = 'Select a time.'
    const g = Number(form.guests)
    if (!Number.isFinite(g) || g < 1 || g > 50) e.guests = 'Guests must be between 1 and 50.'
    return e
  }, [form])

  const canSubmit = Object.keys(errors).length === 0 && !busy

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return toast.error('Please fix the form errors.')
    setBusy(true)
    try {
      const payload = {
        customer_name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim() || null,
        date: form.date,
        time: form.time,
        guests: Number(form.guests),
        special_requests: form.specialRequests.trim() || null,
      }
      const res = await api.post('/booking.php', payload)
      const id = res.data?.id || res.data?.booking_id
      setBookingId(id || '—')
      toast.success('Booking submitted successfully.')
      sendBookingToWhatsApp({
        name: payload.customer_name,
        phone: payload.phone,
        email: payload.email,
        date: format(new Date(payload.date), 'dd/MM/yyyy'),
        time: payload.time,
        guests: payload.guests,
        specialRequests: payload.special_requests,
      })
    } catch {
      toast.error('Booking failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Book a Table</h2>
          <p className="mt-2 text-gray-600">
            Reserve your table in advance. We&apos;ll confirm your booking quickly.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="tamil text-lg font-bold text-red-900">நன்றி! மீண்டும் உங்களை அன்போடு வரவேற்கிறோம்</div>
            <div className="text-sm text-gray-700 mt-2">
              Please enter correct details so we can reach you.
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white border border-amber-100 shadow-sm p-5 grid gap-4"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Full Name *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Your full name"
              />
              {errors.name && <span className="text-xs text-red-700">{errors.name}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Phone *</span>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                }
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="1234567890"
                inputMode="numeric"
              />
              {errors.phone && <span className="text-xs text-red-700">{errors.phone}</span>}
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-700">Email (optional)</span>
            <input
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="yourname@example.com"
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Date *</span>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              />
              {errors.date && <span className="text-xs text-red-700">{errors.date}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Time *</span>
              <select
                value={form.time}
                onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.time && <span className="text-xs text-red-700">{errors.time}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Guests *</span>
              <input
                type="number"
                min={1}
                max={50}
                value={form.guests}
                onChange={(e) => setForm((s) => ({ ...s, guests: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              />
              {errors.guests && <span className="text-xs text-red-700">{errors.guests}</span>}
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-700">Special Requests</span>
            <textarea
              rows={3}
              value={form.specialRequests}
              onChange={(e) => setForm((s) => ({ ...s, specialRequests: e.target.value }))}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Birthday, window seat, etc."
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit Booking'}
          </button>

          {bookingId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
              Booking confirmed. Your Booking ID is <span className="font-bold">#{bookingId}</span>.
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

