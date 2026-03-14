import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Cart from './components/Cart.jsx'

const Menu = lazy(() => import('./pages/Menu.jsx'))
const Booking = lazy(() => import('./pages/Booking.jsx'))
const Catering = lazy(() => import('./pages/Catering.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
// Linux (Vercel) build is case-sensitive; file is `pay.jsx`
const Pay = lazy(() => import('./pages/pay.jsx'))

function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/admin" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col bg-white text-gray-900 dark:bg-slate-950 dark:text-amber-50">
      <Navbar />
      <Cart />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-gray-600">
              Loading page…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/catering" element={<Catering />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/pay" element={<Pay />} />
            <Route
              path="/admin/panel"
              element={
                <ProtectedRoute>
                  <Admin mode="panel" />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
