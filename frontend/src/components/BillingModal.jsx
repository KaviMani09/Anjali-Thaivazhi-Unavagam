import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { FiPrinter, FiSend, FiX } from 'react-icons/fi'
import { QRCodeCanvas } from 'qrcode.react'
import { useCart } from '../context/CartContext.jsx'
import { printBill } from '../utils/printBill.js'
import { sendOrderToWhatsApp } from '../utils/whatsapp.js'
import { api } from '../utils/api.js'

const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Anjali Thaivazhi Unavagam'
const envUpiId = import.meta.env.VITE_UPI_ID || 'anjali.restaurant@upi'

function formatDateTime(d = new Date()) {
  return `${format(d, 'dd/MM/yyyy')} • ${d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`
}

export default function BillingModal({ open, onClose, items, subtotal, total, gstOverride }) {
  const { cartItems, cartSubtotal, gst } = useCart()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [tableOrDelivery, setTableOrDelivery] = useState('Takeaway')
  const [upiId, setUpiId] = useState(envUpiId)

  useEffect(() => {
    api.get('/upi.php').then((res) => {
      const id = res.data?.upi_id?.trim()
      if (id) setUpiId(id)
    }).catch(() => {})
  }, [open])

  const effectiveItems = items && items.length ? items : cartItems
  const effectiveSubtotal = typeof subtotal === 'number' ? subtotal : cartSubtotal
  const effectiveGst = typeof gstOverride === 'number' ? gstOverride : gst
  const effectiveTotal =
    typeof total === 'number' ? total : (effectiveSubtotal || 0) + (effectiveGst || 0)

  const billTime = useMemo(() => formatDateTime(new Date()), [open])

  const upiUrl = useMemo(() => {
    if (!effectiveTotal || effectiveTotal <= 0) return ''
    const note = `Bill%20${encodeURIComponent(restaurantName)}`
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      restaurantName,
    )}&am=${encodeURIComponent(effectiveTotal)}&cu=INR&tn=${note}`
  }, [upiId, effectiveTotal])

  if (!open) return null

  const validPhone = /^\d{10}$/.test(phone.trim())

  const orderDetails = {
    name: name.trim() || 'Customer',
    phone: phone.trim() || 'NA',
    tableOrDelivery: tableOrDelivery.trim() || 'Takeaway',
    paymentMethod: 'Pending',
  }

  const orderTypeLabel = /table/i.test(orderDetails.tableOrDelivery) ? 'Dine-in' : 'Takeaway'

  async function handleSendToWhatsApp() {
    if (!effectiveItems.length) return toast.error('Cart is empty.')
    if (phone && !validPhone) return toast.error('Please enter a valid 10-digit phone number.')

    const payload = {
      customer_name: orderDetails.name,
      customer_phone: orderDetails.phone,
      items: effectiveItems.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: Number(i.price),
      })),
      subtotal: effectiveSubtotal,
      gst: effectiveGst,
      total_amount: effectiveTotal,
      payment_method: orderDetails.paymentMethod,
      order_type: /table/i.test(orderDetails.tableOrDelivery) ? 'dine-in' : 'delivery',
      status: 'Pending',
      meta: { table_or_type: orderDetails.tableOrDelivery },
    }

    try {
      await api.post('/orders.php', payload)
    } catch {
      // Even if saving fails, still allow WhatsApp send so the order can be handled manually
    }

    sendOrderToWhatsApp(orderDetails, effectiveItems, effectiveTotal)
    toast.success('Opening WhatsApp…')
  }

  const receiptContent = (
    <div className="p-4 text-xs text-gray-900 font-mono max-w-xs mx-auto">
      <div className="text-center mb-2">
        <div className="text-sm font-extrabold tracking-wide">{restaurantName}</div>
        <div className="tamil text-sm font-bold text-red-900">அஞ்சலி தாய்வழி உணவகம்</div>
      </div>

      <div className="border-t border-gray-400 my-2" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Date &amp; Time</span>
          <span>{billTime}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer Name</span>
          <span className="text-right truncate max-w-[8rem]">{orderDetails.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Phone</span>
          <span>{orderDetails.phone}</span>
        </div>
        <div className="flex justify-between">
          <span>Order Type</span>
          <span>{orderTypeLabel}</span>
        </div>
      </div>

      <div className="border-t border-gray-400 my-2" />

      <div>
        <div className="flex justify-between font-semibold">
          <span className="flex-1">Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-16 text-right">Price</span>
        </div>
        <div className="border-t border-gray-300 my-1" />
        {effectiveItems.map((i) => {
          const price = Number(i.price) || 0
          const lineTotal = price * i.qty
          return (
            <div
              key={i.id}
              className="flex justify-between"
            >
              <span className="flex-1 truncate">{i.name}</span>
              <span className="w-8 text-center">{i.qty}</span>
              <span className="w-16 text-right">₹{lineTotal}</span>
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-400 my-2" />

      <div className="flex justify-between font-semibold text-sm">
        <span>Total</span>
        <span>₹{effectiveTotal || 0}</span>
      </div>

      <div className="border-t border-gray-400 mt-3 pt-2 text-center text-[11px] font-semibold">
        Thank You! Visit Again
      </div>
    </div>
  )

  return (
    <div className="billing-modal-root">
      <div className="no-print fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
        <div className="w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-2xl bg-white shadow-2xl border border-amber-100 overflow-hidden flex flex-col">
         
          <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
            
            <div>
              <div className="font-extrabold text-gray-900">Billing</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-amber-50 text-gray-700"
              aria-label="Close billing"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="text-sm font-bold text-gray-900">Customer Details</div>
                <div className="mt-3 grid gap-3">
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-gray-700">Full Name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-gray-700">Phone (10 digits)</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="9876543210"
                      inputMode="numeric"
                    />
                    {phone && !validPhone && (
                      <span className="text-xs text-red-700">Enter a valid 10-digit number.</span>
                    )}
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-gray-700">Table / Type</span>
                    <input
                      value={tableOrDelivery}
                      onChange={(e) => setTableOrDelivery(e.target.value)}
                      className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Table 5 / Takeaway"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-white p-4">
                <div className="text-sm font-bold text-gray-900">Bill Preview</div>
                <div className="mt-3 rounded-xl border border-amber-200 overflow-hidden">
                  <div className="p-4 bg-amber-50/50">
                    <div className="text-center">
                      <div className="text-sm font-extrabold text-gray-900">{restaurantName}</div>
                      <div className="tamil text-sm font-bold text-red-900">அஞ்சலி தாய்வழி உணவகம்</div>
                      <div className="text-xs text-gray-600 mt-1">{billTime}</div>
                    </div>
                    <div className="mt-3 text-xs text-gray-700 flex justify-between">
                      <span>{orderDetails.tableOrDelivery}</span>
                      <span>₹{effectiveTotal}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white text-sm grid gap-2">
                    {effectiveItems.map((i) => (
                      <div key={i.id} className="flex justify-between">
                        <span className="text-gray-800">
                          {i.name} × {i.qty}
                        </span>
                        <span className="font-semibold text-gray-900">₹{Number(i.price) * i.qty}</span>
                      </div>
                    ))}
                    <div className="border-t border-amber-100 pt-2 grid gap-1">
                      <div className="flex justify-between font-extrabold text-red-900">
                        <span>Total</span>
                        <span>₹{effectiveTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => printBill()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-100 hover:bg-amber-200 px-4 py-2 font-semibold text-red-900 text-xs"
                >
                  <FiPrinter />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-2 font-semibold text-xs"
                >
                  <FiSend />
                  Send to WhatsApp
                </button>
              </div>
              </div>

            <div className="px-4 pb-4 md:col-span-2">
              <div className="mt-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 grid md:grid-cols-[1.4fr_1fr] gap-4 items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900">Instant UPI Payment (QR)</div>
                  <div className="mt-3 text-xs text-gray-700 space-y-1">
                    <div>
                      UPI ID:{' '}
                      <span className="font-semibold text-gray-900">
                        {upiId}
                      </span>
                    </div>
                    <div>
                      Bill amount:{' '}
                      <span className="font-semibold text-gray-900">
                        ₹{effectiveTotal}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Full payment tracking is stored when you confirm payment in the &quot;Pay
                      Now&quot; flow.
                    </div>
                  </div>
                </div>
                <div className="flex justify-center ">
                  <div className="rounded-3xl bg-amber-50 border border-amber-200 p-3 shadow-inner">
                    {upiUrl ? (
                      <QRCodeCanvas
                        value={upiUrl}
                        size={100}
                        bgColor="#fef3c7"
                        fgColor="#111827"
                        includeMargin
                      />
                    ) : (
                      <div className="h-36 w-36 grid place-items-center text-[11px] text-gray-500">
                        Add items to cart to generate QR.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt for print only - hidden on screen, shown when printing */}
      <div className="print-area hidden fixed inset-0 z-[100] bg-white p-6">
        {receiptContent}
      </div>
    </div>
    </div>
  )
}

