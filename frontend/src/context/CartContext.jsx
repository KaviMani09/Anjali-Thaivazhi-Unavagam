import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'anjali_cart_v1'
const GST_RATE = 0.05

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json)
    return v ?? fallback
  } catch {
    return fallback
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? safeParse(raw, []) : []
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addItem = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((x) => x.id === item.id)
      if (existing) {
        return prev.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeItem = (id) => setCartItems((prev) => prev.filter((x) => x.id !== id))

  const updateQuantity = (id, qty) => {
    const q = Number(qty)
    if (!Number.isFinite(q)) return
    setCartItems((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(99, q)) } : x))
        .filter((x) => x.qty > 0),
    )
  }

  const clearCart = () => setCartItems([])
  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  const toggleCart = () => setIsCartOpen((v) => !v)

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * item.qty, 0),
    [cartItems],
  )

  const gst = useMemo(() => Number((cartSubtotal * GST_RATE).toFixed(2)), [cartSubtotal])
  const cartTotal = useMemo(
    () => Number((cartSubtotal + gst).toFixed(2)),
    [cartSubtotal, gst],
  )

  const value = useMemo(
    () => ({
      cartItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      cartSubtotal,
      gst,
      cartTotal,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
    }),
    [cartItems, cartSubtotal, gst, cartTotal, isCartOpen],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

