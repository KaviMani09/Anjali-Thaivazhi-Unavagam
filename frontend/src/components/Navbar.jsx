import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiShoppingCart, FiMoon, FiSun } from 'react-icons/fi'
import { useCart } from '../context/CartContext.jsx'

const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Anjali Thaivazhi Unavagam'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-2 rounded-lg text-sm font-medium transition',
          isActive
            ? 'bg-red-900 text-amber-100'
            : 'text-gray-800 hover:bg-amber-100/70 hover:text-red-900 dark:text-amber-100 dark:hover:bg-slate-800 dark:hover:text-amber-200',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const { cartItems, toggleCart } = useCart()
  const location = useLocation()

  const count = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Initialize theme from localStorage / system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored || (prefersDark ? 'dark' : 'light')
    setTheme(initial)
  }, [])

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <header className="sticky top-0 z-50 no-print backdrop-blur bg-white/80 border-b border-amber-200/60 dark:bg-slate-950/80 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-red-900 grid place-items-center text-white font-bold">
              A
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900 dark:text-amber-50">
                {restaurantName}
              </div>
              <div className="tamil hidden sm:block text-xs text-red-900 dark:text-amber-200">
                அஞ்சலி தாய்வழி உணவகம்
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/menu">Menu</NavItem>
            <NavItem to="/booking">Book Table</NavItem>
            <NavItem to="/catering">Catering</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCart}
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100/70 hover:bg-amber-200 text-red-900 border border-amber-200 dark:bg-slate-900 dark:text-amber-100 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Open cart"
            >
              <FiShoppingCart className="text-lg" />
              <span className="hidden sm:inline text-sm font-semibold">Cart</span>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-red-900 text-amber-100 text-xs grid place-items-center">
                  {count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="hidden md:inline-flex items-center justify-center p-2 rounded-lg border border-amber-200 text-gray-800 bg-white hover:bg-amber-50 dark:border-slate-700 dark:text-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg border border-amber-200 text-red-900 bg-white hover:bg-amber-50 dark:border-slate-700 dark:text-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {open ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4">
            <div className="kolam-divider rounded-xl p-2">
              <div className="bg-white/90 rounded-lg p-2 grid gap-1 dark:bg-slate-900/90">
                <NavItem to="/">Home</NavItem>
                <NavItem to="/menu">Menu</NavItem>
                <NavItem to="/booking">Book Table</NavItem>
                <NavItem to="/catering">Catering</NavItem>
                <NavItem to="/admin">Admin</NavItem>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-amber-200 text-gray-800 bg-white hover:bg-amber-50 dark:border-slate-700 dark:text-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  {theme === 'dark' ? (
                    <>
                      <FiSun className="text-lg" />
                      <span className="text-sm font-medium">Light mode</span>
                    </>
                  ) : (
                    <>
                      <FiMoon className="text-lg" />
                      <span className="text-sm font-medium">Dark mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

