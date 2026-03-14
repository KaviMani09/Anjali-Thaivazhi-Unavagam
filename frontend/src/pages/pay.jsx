// frontend/src/pages/Pay.jsx
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'
import { api } from '../utils/api.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Anjali Thaivazhi Unavagam'
const upiId = import.meta.env.VITE_UPI_ID || 'anjali.restaurant@upi'

export default function Pay() {
  usePageMeta({
    title: 'Pay Your Bill Online | Anjali Thaivazhi Unavagam',
    description:
      'Secure online payment page to pay your restaurant bill at Anjali Thaivazhi Unavagam using UPI or Razorpay.',
    robots: 'noindex,nofollow',
    canonical: '/pay',
  })
  const [params] = useSearchParams()

  const initialOrderId = Number(params.get('order') || 0)
  const initialAmount = Number(params.get('amount') || 0)

  const [orderId, setOrderId] = useState(initialOrderId)
  const [amount, setAmount] = useState(initialAmount)
  const [status, setStatus] = useState('Pending') // 'Pending' | 'Paid' | 'Failed'
  const [loading, setLoading] = useState(false)
  const [razorpayLoading, setRazorpayLoading] = useState(false)

  const hasValidBill = orderId > 0 && amount > 0

  const upiUrl = useMemo(() => {
    if (!hasValidBill) return ''
    const note = `Bill%20${encodeURIComponent(restaurantName)}%20#${orderId || ''}`
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      restaurantName,
    )}&am=${encodeURIComponent(amount)}&cu=INR&tn=${note}`
  }, [amount, orderId, hasValidBill])

  // Poll payments API for real-time confirmation
  useEffect(() => {
    if (!hasValidBill) return
    let timerId

    const poll = async () => {
      try {
        const res = await api.get('/payments.php', { params: { order_id: orderId } })
        const payment = res.data?.payment
        if (payment) {
          setStatus(payment.payment_status || 'Pending')
          if (payment.payment_status === 'Paid' || payment.payment_status === 'Failed') {
            return // stop polling
          }
        }
      } catch (e) {
        // ignore transient errors
      }
      timerId = setTimeout(poll, 4000)
    }

    poll()
    return () => timerId && clearTimeout(timerId)
  }, [orderId, hasValidBill])
  async function loadRazorpayScript() {
    if (window.Razorpay) return true
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function payWithRazorpay() {
    if (!hasValidBill) return
    setRazorpayLoading(true)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Unable to load Razorpay. Check your internet connection.')
        setRazorpayLoading(false)
        return
      }

      // Create a Razorpay order from the server for this bill
      const orderRes = await api.post('/razorpay.php', {
        action: 'order',
        order_id: orderId,
        amount,
      })

      const { razorpay_key, order } = orderRes.data || {}
      if (!razorpay_key || !order?.id) {
        toast.error('Unable to initiate online payment.')
        setRazorpayLoading(false)
        return
      }

      const options = {
        key: razorpay_key,
        amount: order.amount, // in paise
        currency: order.currency || 'INR',
        name: restaurantName,
        description: `Bill #${orderId}`,
        order_id: order.id,
        notes: {
          internal_order_id: String(orderId),
        },
        handler: async function (response) {
          try {
            setLoading(true)
            await api.post('/razorpay.php', {
              action: 'verify',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
              amount,
            })
            toast.success('Payment successful. Thank you!')
            setStatus('Paid')
          } catch (e) {
            toast.error('Payment verification failed. Please contact the restaurant.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            toast('Payment popup closed. You can try again.', { icon: 'ℹ️' })
          },
        },
        theme: {
          color: '#7f1d1d',
        },
      }

      // eslint-disable-next-line no-undef
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      toast.error('Unable to start online payment. Please try again.')
    } finally {
      setRazorpayLoading(false)
    }
  }

  async function markPaidManually() {
    // Optional: allow customer to tap "I have paid" which logs a payment row.
    if (!hasValidBill) return
    setLoading(true)
    try {
      await api.post('/payments.php', {
        order_id: orderId,
        amount,
        payment_status: 'Paid',
        transaction_id: null, // or collect reference from user
      })
      toast.success('Payment marked as paid.')
      setStatus('Paid')
    } catch {
      toast.error('Could not confirm payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isPaid = status === 'Paid'

  return (
    <div className="min-h-dvh flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-amber-100 p-5 space-y-4">
        <div className="text-center">
          <div className="text-lg font-extrabold text-gray-900">{restaurantName}</div>
          {hasValidBill ? (
            <>
              <div className="text-xs text-gray-500 mt-1">Bill #{orderId}</div>
              <div className="mt-1 text-sm text-gray-700">
                Amount to pay: <span className="font-bold">₹{amount}</span>
              </div>
            </>
          ) : (
            <div className="mt-1 text-sm text-gray-700">
              Enter your bill details from the receipt.
            </div>
          )}
        </div>

        {!hasValidBill && (
          <div className="space-y-3 text-sm">
            <label className="grid gap-1 text-left">
              <span className="font-semibold text-gray-700">Bill / Order Number</span>
              <input
                value={orderId || ''}
                onChange={(e) => setOrderId(Number(e.target.value.replace(/\D/g, '')) || 0)}
                inputMode="numeric"
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="e.g. 102"
              />
            </label>
            <label className="grid gap-1 text-left">
              <span className="font-semibold text-gray-700">Amount (₹)</span>
              <input
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                inputMode="numeric"
                className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="e.g. 750"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                if (!orderId || !amount) {
                  toast.error('Please enter a valid bill number and amount.')
                  return
                }
                setStatus('Pending')
              }}
              className="w-full rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 text-sm font-semibold"
            >
              Continue to Pay with UPI
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              Tip: This page can be opened from a static QR card placed on the table or at the
              counter. Just enter the bill details printed on your receipt.
            </p>
          </div>
        )}

        {hasValidBill && !isPaid && (
          <>
            <div className="grid place-items-center">
              <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 shadow-inner">
                {upiUrl ? (
                  <QRCodeCanvas
                    value={upiUrl}
                    size={196}
                    bgColor="#fef3c7"
                    fgColor="#111827"
                    includeMargin
                  />
                ) : (
                  <div className="h-48 w-48 grid place-items-center text-xs text-gray-500">
                    Unable to generate payment QR.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs text-gray-600 text-center">
                Open any UPI app (GPay, PhonePe, Paytm, etc.) and scan the QR,
                or pay securely online using Razorpay (UPI, cards, net banking).
              </div>

              {/* Razorpay online payment button */}
              <button
                type="button"
                disabled={razorpayLoading || loading}
                onClick={payWithRazorpay}
                className="w-full rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {razorpayLoading ? 'Opening secure payment...' : 'Pay Online (Razorpay)'}
              </button>

              {/* Optional manual confirmation button (without gateway) */}
              <button
                type="button"
                disabled={loading}
                onClick={markPaidManually}
                className="w-full rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-gray-900 px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                I have already paid via UPI
              </button>
            </div>
          </>
        )}

        {hasValidBill && isPaid && (
          <div className="mt-2 text-center text-sm font-semibold text-green-700">
            Payment received. Thank you!
          </div>
        )}

        {hasValidBill && !isPaid && (
          <div className="mt-1 text-center text-[11px] text-gray-500">
            Status: {status || 'Pending'} (auto-refreshing…)
          </div>
        )}
      </div>
    </div>
  )
}