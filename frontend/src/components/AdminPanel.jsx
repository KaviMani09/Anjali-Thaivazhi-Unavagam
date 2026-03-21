import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../utils/api.js'

const TABS = [
  { key: 'menu', label: '📋 Menu' },
  { key: 'upi', label: '💳 UPI IDs' },
  { key: 'orders', label: '📦 Orders' },
  { key: 'bookings', label: '📅 Bookings' },
  { key: 'sales', label: '📊 Sales' },
]

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl px-4 py-2 text-sm font-semibold border transition',
        active ? 'bg-red-900 text-amber-100 border-red-900' : 'bg-white border-amber-200 hover:bg-amber-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function AdminPanel() {
  const [tab, setTab] = useState('menu')

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">Manage menu, orders, bookings, and sales.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </TabBtn>
          ))}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('admin_token')
              toast.success('Logged out.')
              window.location.href = '/admin'
            }}
            className="rounded-xl px-4 py-2 text-sm font-semibold border border-amber-200 bg-white hover:bg-amber-50"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6">
        {tab === 'menu' && <MenuManagement />}
        {tab === 'upi' && <UpiManagement />}
        {tab === 'orders' && <OrdersView />}
        {tab === 'bookings' && <BookingsView />}
        {tab === 'sales' && <SalesReport />}
      </div>
    </section>
  )
}

function MenuManagement() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'morning',
    price: '',
    description: '',
    image_url: '',
    is_available: 1,
  })

  async function refresh() {
    setBusy(true)
    try {
      const res = await api.get('/menu.php')
      setItems(Array.isArray(res.data?.items) ? res.data.items : res.data)
    } catch {
      toast.error('Failed to load menu.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/upload.php', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.image_url || ''
      if (url) {
        setForm((s) => ({ ...s, image_url: url }))
        toast.success('Image uploaded.')
      } else {
        toast.error('Upload failed. No URL returned.')
      }
    } catch {
      toast.error('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function addItem() {
    if (!form.name.trim()) return toast.error('Name required.')
    if (!form.price) return toast.error('Price required.')
    if (!form.image_url) return toast.error('Please upload an image.')
    setBusy(true)
    try {
      await api.post('/menu.php', {
        ...form,
        price: Number(form.price),
        is_available: Number(form.is_available),
      })
      toast.success('Item added.')
      setForm((s) => ({ ...s, name: '', price: '', description: '', image_url: '' }))
      await refresh()
    } catch {
      toast.error('Add failed. Are you logged in?')
    } finally {
      setBusy(false)
    }
  }

  async function saveRow(row) {
    setBusy(true)
    try {
      await api.put('/menu.php', row)
      toast.success('Saved.')
      await refresh()
    } catch {
      toast.error('Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function del(id) {
    if (!confirm('Delete this item?')) return
    setBusy(true)
    try {
      await api.delete('/menu.php', { data: { id } })
      toast.success('Deleted.')
      await refresh()
    } catch {
      toast.error('Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-5 items-start">
      <div className="lg:col-span-2 rounded-2xl border border-amber-100 bg-white p-5">
        <div className="font-extrabold text-gray-900">Add New Item</div>
        <div className="mt-4 grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="font-semibold text-gray-700">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="font-semibold text-gray-700">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                {['morning', 'afternoon', 'night', 'snacks', 'juices'].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-gray-700">Price (₹)</span>
              <input
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: e.target.value.replace(/\D/g, '') }))}
                inputMode="numeric"
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="font-semibold text-gray-700">Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm"
              disabled={uploading || busy}
            />
            {form.image_url && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={form.image_url}
                  alt={form.name || 'Preview'}
                  className="h-14 w-14 rounded-xl object-cover border border-amber-200"
                />
                <span className="text-xs text-gray-500 break-all">{form.image_url}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">
              {uploading ? 'Uploading image…' : 'Choose an image to upload. URL will be filled automatically.'}
            </span>
          </label>
          <label className="grid gap-1">
            <span className="font-semibold text-gray-700">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.is_available}
              onChange={(e) => setForm((s) => ({ ...s, is_available: e.target.checked ? 1 : 0 }))}
            />
            <span className="font-semibold text-gray-700">Available</span>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={addItem}
            className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
          >
            Add Item
          </button>
          <div className="text-xs text-gray-500">
            Choose an image above; the URL will be filled when uploaded.
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 rounded-2xl border border-amber-100 bg-white p-5 overflow-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="font-extrabold text-gray-900">Menu Items</div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 min-w-[860px]">
          <div className="grid grid-cols-[70px_160px_140px_90px_1fr_120px_90px] text-xs font-bold text-gray-600 pb-2 border-b border-amber-100">
            <div>Img</div>
            <div>Name</div>
            <div>Category</div>
            <div>Price</div>
            <div>Description</div>
            <div>Available</div>
            <div />
          </div>
          <div className="grid gap-2 mt-3">
            {items.map((it) => (
              <MenuRow key={it.id} item={it} onSave={saveRow} onDelete={del} />
            ))}
            {items.length === 0 && !busy && (
              <div className="text-sm text-gray-600">No items.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuRow({ item, onSave, onDelete }) {
  const [row, setRow] = useState(() => ({ ...item }))
  useEffect(() => setRow({ ...item }), [item])
  return (
    <div className="grid grid-cols-[70px_160px_140px_90px_1fr_120px_90px] gap-2 items-start">
      <img
        src={row.image_url}
        alt={row.name}
        loading="lazy"
        className="h-12 w-12 rounded-xl object-cover border border-amber-100"
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = '/images/menu/fallback.png'
        }}
      />
      <input
        value={row.name || ''}
        onChange={(e) => setRow((s) => ({ ...s, name: e.target.value }))}
        className="rounded-xl border border-amber-200 px-3 py-2 text-sm"
      />
      <select
        value={row.category || 'morning'}
        onChange={(e) => setRow((s) => ({ ...s, category: e.target.value }))}
        className="rounded-xl border border-amber-200 px-3 py-2 text-sm bg-white"
      >
        {['morning', 'afternoon', 'night', 'snacks', 'juices'].map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <input
        value={String(row.price ?? '')}
        onChange={(e) => setRow((s) => ({ ...s, price: e.target.value.replace(/\D/g, '') }))}
        className="rounded-xl border border-amber-200 px-3 py-2 text-sm"
        inputMode="numeric"
      />
      <input
        value={row.description || ''}
        onChange={(e) => setRow((s) => ({ ...s, description: e.target.value }))}
        className="rounded-xl border border-amber-200 px-3 py-2 text-sm"
      />
      <label className="inline-flex items-center gap-2 text-sm mt-2">
        <input
          type="checkbox"
          checked={!!Number(row.is_available)}
          onChange={(e) => setRow((s) => ({ ...s, is_available: e.target.checked ? 1 : 0 }))}
        />
        <span className="text-gray-700">Active</span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave({ ...row, id: item.id, price: Number(row.price) })}
          className="rounded-xl bg-amber-100 hover:bg-amber-200 px-3 py-2 text-sm font-semibold text-red-900"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-3 py-2 text-sm font-semibold"
        >
          Del
        </button>
      </div>
    </div>
  )
}

function UpiManagement() {
  const [list, setList] = useState([])
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ upi_id: '', label: '', is_default: 0 })

  async function refresh() {
    setBusy(true)
    try {
      const res = await api.get('/upi.php?list=all')
      setList(Array.isArray(res.data?.upi_ids) ? res.data.upi_ids : [])
    } catch (e) {
      const status = e.response?.status
      const msg = e.response?.data?.error
      if (status === 401) {
        toast.error('Session expired or not logged in. Please log in again.')
      } else if (msg) {
        toast.error(msg)
      } else {
        toast.error('Failed to load UPI IDs. Check that the API is running and the upi_ids table exists.')
      }
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function addUpi() {
    const upi_id = form.upi_id.trim()
    if (!upi_id) return toast.error('UPI ID is required.')
    setBusy(true)
    try {
      await api.post('/upi.php', {
        upi_id,
        label: form.label.trim() || '',
        is_default: form.is_default ? 1 : 0,
      })
      toast.success('UPI ID added.')
      setForm({ upi_id: '', label: '', is_default: 0 })
      await refresh()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Add failed.')
    } finally {
      setBusy(false)
    }
  }

  async function saveRow(row) {
    setBusy(true)
    try {
      await api.put('/upi.php', {
        id: row.id,
        upi_id: row.upi_id.trim(),
        label: (row.label || '').trim(),
        is_default: row.is_default ? 1 : 0,
      })
      toast.success('Saved.')
      await refresh()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function del(id) {
    if (!confirm('Delete this UPI ID?')) return
    setBusy(true)
    try {
      await api.delete('/upi.php', { data: { id } })
      toast.success('Deleted.')
      await refresh()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-5 items-start">
      <div className="lg:col-span-2 rounded-2xl border border-amber-100 bg-white p-5">
        <div className="font-extrabold text-gray-900">Add UPI ID</div>
        <p className="mt-1 text-sm text-gray-600">Only admins can add, edit, or delete UPI IDs. The default ID is used on the payment QR.</p>
        <div className="mt-4 grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="font-semibold text-gray-700">UPI ID</span>
            <input
              value={form.upi_id}
              onChange={(e) => setForm((s) => ({ ...s, upi_id: e.target.value }))}
              placeholder="merchant@upi"
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="grid gap-1">
            <span className="font-semibold text-gray-700">Label (optional)</span>
            <input
              value={form.label}
              onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
              placeholder="e.g. Primary"
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.is_default}
              onChange={(e) => setForm((s) => ({ ...s, is_default: e.target.checked ? 1 : 0 }))}
            />
            <span className="font-semibold text-gray-700">Set as default (for payment QR)</span>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={addUpi}
            className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
          >
            Add UPI ID
          </button>
        </div>
      </div>
      <div className="lg:col-span-3 rounded-2xl border border-amber-100 bg-white p-5 overflow-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="font-extrabold text-gray-900">UPI IDs</div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {list.map((u) => (
            <UpiRow key={u.id} item={u} onSave={saveRow} onDelete={del} />
          ))}
          {list.length === 0 && !busy && (
            <div className="text-sm text-gray-600">No UPI IDs. Add one above.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function UpiRow({ item, onSave, onDelete }) {
  const [row, setRow] = useState(() => ({ ...item }))
  useEffect(() => setRow({ ...item }), [item])
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-100 p-3">
      <input
        value={row.upi_id || ''}
        onChange={(e) => setRow((s) => ({ ...s, upi_id: e.target.value }))}
        placeholder="id@upi"
        className="rounded-lg border border-amber-200 px-3 py-2 text-sm min-w-[180px]"
      />
      <input
        value={row.label || ''}
        onChange={(e) => setRow((s) => ({ ...s, label: e.target.value }))}
        placeholder="Label"
        className="rounded-lg border border-amber-200 px-3 py-2 text-sm w-24"
      />
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!Number(row.is_default)}
          onChange={(e) => setRow((s) => ({ ...s, is_default: e.target.checked ? 1 : 0 }))}
        />
        <span className="text-gray-700">Default</span>
      </label>
      <button
        type="button"
        onClick={() => onSave({ ...row, id: item.id })}
        className="rounded-xl bg-amber-100 hover:bg-amber-200 px-3 py-2 text-sm font-semibold text-red-900"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-3 py-2 text-sm font-semibold"
      >
        Delete
      </button>
    </div>
  )
}

function OrdersView() {
  const [orders, setOrders] = useState([])
  const [busy, setBusy] = useState(false)
  const [paymentsMap, setPaymentsMap] = useState({})

  const summary = useMemo(() => {
    const totalOrders = orders.length
    let paid = 0
    let pending = 0
    for (const o of orders) {
      const p = paymentsMap[o.id]
      const status = p?.payment_status || 'Pending'
      if (status === 'Paid') paid += 1
      else pending += 1
    }
    return { totalOrders, paid, pending }
  }, [orders, paymentsMap])

  async function refresh() {
    setBusy(true)
    try {
      const [ordersRes, paymentsRes] = await Promise.all([
        api.get('/orders.php'),
        api.get('/payments.php'),
      ])

      const nextOrders = ordersRes.data?.orders || ordersRes.data || []
      setOrders(nextOrders)

      const payments = paymentsRes.data?.payments || paymentsRes.data || []
      const map = {}
      if (Array.isArray(payments)) {
        for (const p of payments) {
          const oid = Number(p.order_id)
          if (!oid) continue
          // Keep the latest payment per order (by payment_time or id)
          if (!map[oid] || Number(p.id) > Number(map[oid].id || 0)) {
            map[oid] = p
          }
        }
      }
      setPaymentsMap(map)
    } catch {
      toast.error('Failed to load orders.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
    // Lightweight polling so that new payments (including QR/UPI payments)
    // automatically reflect in the dashboard without manual refresh.
    const id = setInterval(() => {
      refresh()
    }, 7000)
    return () => clearInterval(id)
  }, [])

  async function setStatus(id, status) {
    setBusy(true)
    try {
      await api.put('/orders.php', { id, status })
      toast.success('Status updated.')
      await refresh()
    } catch {
      toast.error('Update failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-5 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-extrabold text-gray-900">Orders</div>
          <div className="mt-1 text-xs text-gray-600">
            Total:{' '}
            <span className="font-semibold text-gray-900">{summary.totalOrders}</span> • Paid:{' '}
            <span className="font-semibold text-emerald-700">{summary.paid}</span> • Pending:{' '}
            <span className="font-semibold text-amber-700">{summary.pending}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-4 py-2 text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 min-w-[980px]">
        <div className="grid grid-cols-[140px_160px_160px_90px_120px_120px_1fr] text-xs font-bold text-gray-600 pb-2 border-b border-amber-100">
          <div>Date</div>
          <div>Customer</div>
          <div>Phone</div>
          <div>Total</div>
          <div>Order Status</div>
          <div>Payment</div>
          <div>Items</div>
        </div>
        <div className="grid gap-2 mt-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-[140px_160px_160px_90px_120px_120px_1fr] gap-2 text-sm items-start"
            >
              <div className="text-gray-700">{o.created_at || '-'}</div>
              <div className="font-semibold text-gray-900">{o.customer_name}</div>
              <div className="text-gray-700">{o.customer_phone}</div>
              <div className="font-bold text-red-900">₹{o.total_amount}</div>
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value)}
                className="rounded-xl border border-amber-200 px-3 py-2 text-sm bg-white"
                disabled={busy}
              >
                {['Pending', 'Preparing', 'Ready', 'Delivered'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="flex items-center">
                {(() => {
                  const p = paymentsMap[o.id]
                  const status = p?.payment_status || 'Pending'
                  const isPaid = status === 'Paid'
                  const colorClasses = isPaid
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                  return (
                    <span
                      className={[
                        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border',
                        colorClasses,
                      ].join(' ')}
                    >
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  )
                })()}
              </div>
              <div className="text-gray-700">
                {(Array.isArray(o.items) ? o.items : (() => { try { return JSON.parse(o.items || '[]') } catch { return [] } })())
                  .map((i) => `${i.name}×${i.qty}`)
                  .join(', ')}
              </div>
            </div>
          ))}
          {orders.length === 0 && !busy && <div className="text-sm text-gray-600">No orders.</div>}
        </div>
      </div>
    </div>
  )
}

function BookingsView() {
  const [table, setTable] = useState([])
  const [catering, setCatering] = useState([])
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setBusy(true)
    try {
      const [t, c] = await Promise.all([api.get('/booking.php'), api.get('/catering.php')])
      setTable(t.data?.bookings || t.data || [])
      setCatering(c.data?.bookings || c.data || [])
    } catch {
      toast.error('Failed to load bookings.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function setStatus(kind, id, status) {
    setBusy(true)
    try {
      await api.put(kind === 'table' ? '/booking.php' : '/catering.php', { id, status })
      toast.success('Status updated.')
      await refresh()
    } catch {
      toast.error('Update failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl border border-amber-100 bg-white p-5 overflow-auto">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-gray-900">Table Bookings</div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {table.map((b) => (
            <div key={b.id} className="rounded-2xl border border-amber-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-gray-900">{b.customer_name}</div>
                  <div className="text-sm text-gray-700">{b.phone}</div>
                  <div className="text-sm text-gray-700">
                    {b.date} • {b.time} • {b.guests} guests
                  </div>
                </div>
                <select
                  value={b.status}
                  onChange={(e) => setStatus('table', b.id, e.target.value)}
                  className="rounded-xl border border-amber-200 px-3 py-2 text-sm bg-white"
                  disabled={busy}
                >
                  {['Pending', 'Confirmed', 'Cancelled'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {b.special_requests && <div className="mt-2 text-sm text-gray-600">{b.special_requests}</div>}
            </div>
          ))}
          {table.length === 0 && !busy && <div className="text-sm text-gray-600">No table bookings.</div>}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-5 overflow-auto">
        <div className="font-extrabold text-gray-900">Catering Bookings</div>
        <div className="mt-4 grid gap-2">
          {catering.map((b) => (
            <div key={b.id} className="rounded-2xl border border-amber-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-gray-900">{b.customer_name}</div>
                  <div className="text-sm text-gray-700">{b.phone}</div>
                  <div className="text-sm text-gray-700">
                    {b.event_type} • {b.event_date} • {b.guests_count} guests
                  </div>
                </div>
                <select
                  value={b.status}
                  onChange={(e) => setStatus('catering', b.id, e.target.value)}
                  className="rounded-xl border border-amber-200 px-3 py-2 text-sm bg-white"
                  disabled={busy}
                >
                  {['Pending', 'Confirmed', 'Cancelled'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 text-sm text-gray-600">{b.venue}</div>
              {b.message && <div className="mt-2 text-sm text-gray-600">{b.message}</div>}
            </div>
          ))}
          {catering.length === 0 && !busy && <div className="text-sm text-gray-600">No catering bookings.</div>}
        </div>
      </div>
    </div>
  )
}

function SalesReport() {
  const [data, setData] = useState([])
  const [busy, setBusy] = useState(false)

  const totals = useMemo(() => {
    const revenue = data.reduce((s, d) => s + Number(d.total || 0), 0)
    const orders = data.reduce((s, d) => s + Number(d.orders || 0), 0)
    const avg = orders > 0 ? revenue / orders : 0
    return { revenue, orders, avg }
  }, [data])

  async function refresh() {
    setBusy(true)
    try {
      const res = await api.get('/sales.php')
      setData(res.data?.data || res.data || [])
    } catch {
      toast.error('Failed to load sales.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-extrabold text-gray-900">Monthly Sales</div>
          <div className="mt-1 text-sm text-gray-600">
            Revenue:{' '}
            <span className="font-bold text-red-900">
              ₹{totals.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>{' '}
            • Orders:{' '}
            <span className="font-bold text-gray-900">{totals.orders}</span>{' '}
            • Avg/order:{' '}
            <span className="font-bold text-gray-900">
              ₹{totals.avg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 w-full">
        <ResponsiveContainer width="100%" height={320} minWidth={280} minHeight={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#991b1b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Export-to-PDF can be added using a PDF library (kept minimal here).
      </div>
    </div>
  )
}

