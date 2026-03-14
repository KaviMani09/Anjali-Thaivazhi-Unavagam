import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'
import { sendCateringToWhatsApp } from '../utils/whatsapp.js'

export default function CateringBooking() {
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const [busy, setBusy] = useState(false)
  const [submittedId, setSubmittedId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventType: 'Wedding',
    eventDate: today,
    eventTime: '7:00 PM',
    venue: '',
    guests: 100,
    menuPreference: 'Both',
    budget: '',
    message: '',
  })

  const errors = useMemo(() => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number.'
    if (!form.eventDate) e.eventDate = 'Select event date.'
    if (!form.venue.trim()) e.venue = 'Venue is required.'
    const g = Number(form.guests)
    if (!Number.isFinite(g) || g < 10 || g > 5000) e.guests = 'Guests must be between 10 and 5000.'
    return e
  }, [form])

  const canSubmit = Object.keys(errors).length === 0 && !busy

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return toast.error('Please fix the form errors.')
    setBusy(true)
    setSubmittedId(null)
    try {
      const payload = {
        customer_name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim() || null,
        event_type: form.eventType,
        event_date: form.eventDate,
        event_time: form.eventTime,
        venue: form.venue.trim(),
        guests_count: Number(form.guests),
        menu_preference: form.menuPreference,
        budget: form.budget ? Number(form.budget) : null,
        message: form.message.trim() || null,
      }
      const res = await api.post('/catering.php', payload)
      const id = res.data?.id || res.data?.booking_id
      setSubmittedId(id || '—')
      toast.success('Catering request submitted.')
      sendCateringToWhatsApp({
        name: payload.customer_name,
        phone: payload.phone,
        eventDate: `${format(new Date(payload.event_date), 'dd/MM/yyyy')} ${payload.event_time}`,
        eventType: payload.event_type,
        venue: payload.venue,
        guests: payload.guests_count,
        menuPreference: payload.menu_preference,
        budget: payload.budget ?? '-',
        message: payload.message,
      })
    } catch (err) {
      setSubmittedId(null)
      const status = err?.response?.status
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : null)

      if (err?.code === 'ERR_NETWORK' || !status) {
        const extra = [err?.code, err?.message].filter(Boolean).join(' - ')
        toast.error(
          `API not reachable. Make sure PHP backend is running. ${
            extra ? `(${extra})` : ''
          } If testing on mobile, open the site using your PC IP (not localhost).`,
        )
      } else {
        toast.error(serverMsg ? `Submission failed (${status}): ${serverMsg}` : `Submission failed (${status}).`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Catering & Events</h2>
          <p className="mt-2 text-gray-600">
            Weddings, birthdays, corporate events — we handle food and arrangements with authentic
            Tamil flavors.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="tamil text-lg font-bold text-red-900">சிறப்பு நிகழ்வுகள்</div>
            <div className="text-sm text-gray-700 mt-2">
              Share your event details and we&apos;ll contact you with a quote.
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
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Event Type *</span>
              <select
                value={form.eventType}
                onChange={(e) => setForm((s) => ({ ...s, eventType: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                {['Wedding', 'Birthday', 'Corporate', 'Engagement', 'Other'].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Menu Preference *</span>
              <select
                value={form.menuPreference}
                onChange={(e) => setForm((s) => ({ ...s, menuPreference: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                {['Veg Only', 'Non-Veg', 'Both'].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Event Date *</span>
              <input
                type="date"
                min={today}
                value={form.eventDate}
                onChange={(e) => setForm((s) => ({ ...s, eventDate: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              />
              {errors.eventDate && <span className="text-xs text-red-700">{errors.eventDate}</span>}
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-semibold text-gray-700">Event Time</span>
              <input
                value={form.eventTime}
                onChange={(e) => setForm((s) => ({ ...s, eventTime: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="7:00 PM"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-700">Venue / Location *</span>
            <textarea
              rows={2}
              value={form.venue}
              onChange={(e) => setForm((s) => ({ ...s, venue: e.target.value }))}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Full address / landmark"
            />
            {errors.venue && <span className="text-xs text-red-700">{errors.venue}</span>}
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Expected Guests *</span>
              <input
                type="number"
                min={10}
                max={5000}
                value={form.guests}
                onChange={(e) => setForm((s) => ({ ...s, guests: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              />
              {errors.guests && <span className="text-xs text-red-700">{errors.guests}</span>}
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-700">Budget (₹)</span>
              <input
                value={form.budget}
                onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value.replace(/\D/g, '') }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="50000"
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-700">Additional Requirements</span>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Decoration, live dosa counter, etc."
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit Catering Request'}
          </button>

          {submittedId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
              Request submitted. Reference ID: #{submittedId}.
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

