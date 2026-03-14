import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminPanel from '../components/AdminPanel.jsx'
import { api } from '../utils/api.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

export default function Admin({ mode }) {
  usePageMeta({
    title: 'Admin Login | Anjali Thaivazhi Unavagam',
    description: 'Admin login panel for managing menu, orders, bookings and reports.',
    robots: 'noindex,nofollow',
    canonical: '/admin',
  })
  const token = localStorage.getItem('admin_token')
  const navigate = useNavigate()
  const location = useLocation()

  if (mode === 'panel') {
    return <AdminPanel />
  }

  if (token) return <Navigate to="/admin/panel" replace />

  return <AdminLogin onSuccess={() => navigate(location.state?.from || '/admin/panel')} />
}

function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('admin123')
  const [busy, setBusy] = useState(false)

  const canSubmit = useMemo(() => username.trim() && password.trim() && !busy, [username, password, busy])

  useEffect(() => {
    // safety: clear previous invalid tokens
    localStorage.removeItem('admin_token')
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    try {
      const res = await api.post('/auth.php', { username: username.trim(), password })
      const t = res.data?.token
      if (!t) throw new Error('no token')
      localStorage.setItem('admin_token', t)
      toast.success('Login successful.')
      onSuccess?.()
    } catch {
      toast.error('Login failed. Check credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-md mx-auto rounded-3xl border border-amber-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-amber-50 to-white border-b border-amber-100">
          <div className="text-2xl font-extrabold text-gray-900">Admin Login</div>
        </div>
        <form onSubmit={submit} className="p-6 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-700">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-amber-200 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-3 font-semibold disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </section>
  )
}

