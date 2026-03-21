import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiX } from 'react-icons/fi'
import { QRCodeCanvas } from 'qrcode.react'
import QRScanner from './QRScanner.jsx'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../utils/api.js'
import { sendOrderToWhatsApp } from '../utils/whatsapp.js'

const envUpiId = import.meta.env.VITE_UPI_ID || 'anjali.restaurant@upi'
const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Anjali Thaivazhi Unavagam'

function Input({ label, value, onChange, placeholder, inputMode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
      />
    </label>
  )
}

export default function PaymentModal({ open, onClose }) {
  const { cartItems, cartTotal, gst, cartSubtotal, clearCart } = useCart()
  const [method, setMethod] = useState('qr')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [tableOrDelivery, setTableOrDelivery] = useState('Takeaway')
  const [upiRef, setUpiRef] = useState('')
  const [upiId, setUpiId] = useState(envUpiId)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    if (!open) return
    api.get('/upi.php').then((res) => {
      const id = res.data?.upi_id?.trim()
      if (id) setUpiId(id)
    }).catch(() => {})
  }, [open])

  const validPhone = /^\d{10}$/.test(phone.trim())

  const upiUrl = useMemo(() => {
    if (!cartTotal || cartTotal <= 0) return ''
    const note = `Bill%20${encodeURIComponent(restaurantName)}`
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      restaurantName,
    )}&am=${encodeURIComponent(cartTotal)}&cu=INR&tn=${note}`
  }, [cartTotal, upiId])

  if (!open) return null

  async function confirm(paymentMethodLabel) {
    if (cartItems.length === 0) return toast.error('Cart is empty.')
    if (phone && !validPhone) return toast.error('Please enter a valid 10-digit phone number.')

    if ((method === 'upi' || method === 'qr') && !upiRef.trim()) {
      toast('You can optionally add the UPI reference/UTR later in admin.', { icon: 'ℹ️' })
    }

    const orderDetails = {
      name: name.trim() || 'Customer',
      phone: phone.trim() || 'NA',
      tableOrDelivery: tableOrDelivery.trim() || 'Takeaway',
      paymentMethod: paymentMethodLabel,
    }

    const payload = {
      customer_name: orderDetails.name,
      customer_phone: orderDetails.phone,
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: Number(i.price),
      })),
      subtotal: cartSubtotal,
      gst,
      total_amount: cartTotal,
      payment_method: paymentMethodLabel,
      order_type: /table/i.test(orderDetails.tableOrDelivery) ? 'dine-in' : 'delivery',
      status: 'Pending',
      meta: { table_or_type: orderDetails.tableOrDelivery, upi_ref: upiRef.trim() || null },
    }

    setBusy(true)
    try {
      const res = await api.post('/orders.php', payload)
      const createdOrderId = res.data?.id || res.data?.order_id
      setOrderId(createdOrderId || null)

      if (createdOrderId) {
        const paymentStatus =
          paymentMethodLabel === 'Cash'
            ? 'Pending'
            : 'Paid'

        try {
          await api.post('/payments.php', {
            order_id: createdOrderId,
            amount: cartTotal,
            payment_status: paymentStatus,
            transaction_id: upiRef.trim() || null,
          })
        } catch {
          // keep order even if payment log fails
        }
      }

      toast.success(
        createdOrderId ? `Payment saved. Order #${createdOrderId}` : 'Payment saved successfully.',
      )
      setSuccess(true)
      sendOrderToWhatsApp(orderDetails, cartItems, cartTotal)
      clearCart()
      setTimeout(() => {
        setSuccess(false)
        setOrderId(null)
        setUpiRef('')
        onClose()
      }, 1200)
    } catch (e) {
      toast.error('Failed to save order. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="no-print fixed inset-0 z-[60] bg-black/50 p-4 overflow-y-auto">
      <div className="mx-auto my-2 md:my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-amber-100 overflow-hidden max-h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-3rem)] flex flex-col">
        <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-gray-900">Payment</div>
            <div className="text-xs text-gray-500">Grand Total: ₹{cartTotal}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-amber-50 text-gray-700"
            aria-label="Close payment"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-4 overflow-y-auto">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <div className="text-sm font-bold text-gray-900">Customer Details</div>
            <div className="mt-3 grid gap-3">
              <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />
              <Input
                label="Phone (10 digits)"
                value={phone}
                onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                inputMode="numeric"
              />
              {phone && !validPhone && (
                <span className="text-xs text-red-700">Enter a valid 10-digit number.</span>
              )}
              <Input
                label="Table / Type"
                value={tableOrDelivery}
                onChange={setTableOrDelivery}
                placeholder="Table 5 / Takeaway / Delivery"
              />
            </div>

            <div className="mt-5">
              <div className="text-sm font-bold text-gray-900">Payment Method</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { key: 'qr', label: 'UPI QR' },
                  { key: 'upi', label: 'UPI (manual)' },
                  { key: 'scan', label: 'Scan QR' },
                  { key: 'cash', label: 'Cash' },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={[
                      'rounded-xl px-3 py-2 text-sm font-semibold border transition',
                      method === m.key
                        ? 'bg-red-900 text-amber-100 border-red-900'
                        : 'bg-white text-gray-800 border-amber-200 hover:bg-amber-50',
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            {success ? (
              <div className="h-full grid place-items-center text-center p-8">
                <FiCheckCircle className="text-5xl text-green-600" />
                <div className="mt-3 text-lg font-extrabold text-gray-900">Payment Success</div>
                <div className="text-sm text-gray-600 mt-1">Sending order to WhatsApp…</div>
              </div>
            ) : method === 'qr' ? (
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-bold text-gray-900">Scan &amp; Pay with UPI</div>
                </div>
                <div className="grid place-items-center">
                  <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 shadow-inner">
                    {upiUrl ? (
                      <QRCodeCanvas
                        value={upiUrl}
                        size={192}
                        bgColor="#fef3c7"
                        fgColor="#111827"
                        includeMargin
                      />
                    ) : (
                      <div className="h-48 w-48 grid place-items-center text-xs text-gray-500">
                        Add items to cart to generate QR.
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-600 text-center">
                    UPI ID:{' '}
                    <span className="font-semibold text-gray-900">
                      {upiId}
                    </span>
                    <br />
                    Amount:{' '}
                    <span className="font-semibold text-gray-900">
                      ₹{cartTotal}
                    </span>
                    {orderId && (
                      <>
                        <br />
                        Order reference: <span className="font-mono text-[11px]">#{orderId}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Input
                    label="UPI Reference / UTR (optional)"
                    value={upiRef}
                    onChange={setUpiRef}
                    placeholder="Enter UPI reference after customer pays"
                  />
                  <button
                    type="button"
                    disabled={busy || !upiUrl}
                    onClick={() => confirm('UPI QR')}
                    className="w-full rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    Customer Paid in UPI App
                  </button>
                </div>
              </div>
            ) : method === 'upi' ? (
              <div>
                <div className="text-sm font-bold text-gray-900">UPI Payment</div>
                <div className="mt-2 text-sm text-gray-700">
                  UPI ID: <span className="font-semibold">{upiId}</span>
                </div>
                <div className="mt-4 grid gap-3">
                  <Input
                    label="UPI Reference Number"
                    value={upiRef}
                    onChange={setUpiRef}
                    placeholder="Enter UTR / reference number"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirm('UPI')}
                    className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            ) : method === 'scan' ? (
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-bold text-gray-900">Scan Payment QR</div>
                  <p className="mt-1 text-xs text-gray-600">
                    Use the camera to scan the customer&apos;s UPI payment QR. The decoded value will
                    be saved as the reference.
                  </p>
                </div>
                <QRScanner
                  onScan={(value) => {
                    // Try to extract transaction / reference id from common UPI format
                    try {
                      let ref = value
                      if (value.startsWith('upi://')) {
                        const url = new URL(value)
                        ref =
                          url.searchParams.get('tr') ||
                          url.searchParams.get('txnId') ||
                          url.searchParams.get('txn_id') ||
                          value
                      }
                      setUpiRef(ref)
                    } catch {
                      setUpiRef(value)
                    }
                  }}
                />
                <div className="grid gap-2">
                  <Input
                    label="UPI Reference Number (editable)"
                    value={upiRef}
                    onChange={setUpiRef}
                    placeholder="Filled automatically after scan, or enter manually"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirm('QR (scanned)')}
                    className="w-full rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-gray-900">Cash Payment</div>
                <div className="mt-2 text-sm text-gray-700">Pay at counter and collect bill.</div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => confirm('Cash')}
                  className="mt-4 w-full rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
                >
                  Confirm (Pay at Counter)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-amber-100 bg-white flex items-center justify-between">
          <div className="text-xs text-gray-500">UPI placeholder: change in `.env`</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-4 py-2 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

