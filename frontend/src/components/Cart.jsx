import { useEffect, useMemo, useState } from 'react'
import { FiArrowUp, FiMinus, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext.jsx'
import BillingModal from './BillingModal.jsx'
import PaymentModal from './PaymentModal.jsx'

export default function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    cartSubtotal,
    gst,
    cartTotal,
    isCartOpen,
    toggleCart,
    closeCart,
  } = useCart()

  const [showBill, setShowBill] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [showTop, setShowTop] = useState(false)

  const count = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 450)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Floating scroll-to-top button (bottom-right) */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="no-print fixed bottom-5 right-5 z-50 rounded-full shadow-lg bg-red-900 text-amber-100 p-3 flex items-center justify-center hover:bg-red-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900/40 dark:bg-amber-300 dark:text-red-950 dark:hover:bg-amber-200 dark:focus-visible:ring-amber-300/30"
          aria-label="Scroll to top"
        >
          <FiArrowUp className="text-xl" />
        </button>
      )}

      {/* Overlay */}
      {isCartOpen && (
        <div
          className="no-print fixed inset-0 z-40 bg-black/40"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Slide-out panel */}
      <aside
        className={[
          'no-print fixed top-0 right-0 z-50 h-dvh w-full max-w-md bg-white shadow-2xl border-l border-amber-100 transform transition dark:bg-slate-950 dark:border-slate-800',
          isCartOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Cart panel"
      >
        <div className="h-16 px-4 border-b border-amber-100 flex items-center justify-between dark:border-slate-800">
          <div>
            <div className="font-extrabold text-gray-900 dark:text-amber-50">Your Cart</div>
            <div className="text-xs text-gray-500 dark:text-amber-100/70">{count} items</div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 rounded-lg hover:bg-amber-50 text-gray-700 dark:text-amber-100 dark:hover:bg-slate-900"
            aria-label="Close cart"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-4 overflow-auto h-[calc(100dvh-16rem)]">
          {cartItems.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-amber-100/80">
              Your cart is empty. Add tasty items from the menu.
            </div>
          ) : (
            <div className="grid gap-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-2xl border border-amber-100 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className="h-16 w-16 rounded-xl object-cover bg-amber-50 dark:bg-slate-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-amber-50">{item.name}</div>
                        <div className="text-sm text-gray-600 dark:text-amber-100/70">₹{Number(item.price)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg hover:bg-amber-50 text-gray-700 dark:text-amber-100 dark:hover:bg-slate-900"
                        aria-label="Remove item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          className="p-1 rounded-lg hover:bg-amber-100 text-red-900 dark:text-amber-200 dark:hover:bg-slate-800"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 dark:text-amber-50">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          className="p-1 rounded-lg hover:bg-amber-100 text-red-900 dark:text-amber-200 dark:hover:bg-slate-800"
                          aria-label="Increase quantity"
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className="font-bold text-red-900 dark:text-amber-200">
                        ₹{Number(item.price) * item.qty}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-amber-100 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-amber-100/70">Subtotal</span>
              <span className="font-semibold text-gray-900 dark:text-amber-50">₹{cartSubtotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-amber-100/70">GST (5%)</span>
              <span className="font-semibold text-gray-900 dark:text-amber-50">₹{gst}</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-extrabold text-gray-900 dark:text-amber-50">Grand Total</span>
              <span className="font-extrabold text-red-900 dark:text-amber-200">₹{cartTotal}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (cartItems.length === 0) return toast.error('Cart is empty.')
                clearCart()
                toast.success('Cart cleared.')
              }}
              className="rounded-xl border border-amber-200 bg-white hover:bg-amber-50 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                if (cartItems.length === 0) return toast.error('Cart is empty.')
                setShowBill(true)
              }}
              className="rounded-xl border border-amber-200 bg-amber-100 hover:bg-amber-200 px-3 py-2 text-sm font-semibold text-red-900 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-slate-800"
            >
              Print Bill
            </button>
            <button
              type="button"
              onClick={() => {
                if (cartItems.length === 0) return toast.error('Cart is empty.')
                setShowPay(true)
              }}
              className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-3 py-2 text-sm font-semibold dark:bg-amber-300 dark:hover:bg-amber-200 dark:text-red-950"
            >
              Pay Now
            </button>
          </div>
        </div>
      </aside>

      <BillingModal open={showBill} onClose={() => setShowBill(false)} />
      <PaymentModal open={showPay} onClose={() => setShowPay(false)} />
    </>
  )
}

