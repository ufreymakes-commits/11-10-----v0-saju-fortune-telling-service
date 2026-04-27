'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ADMIN_PASSWORD = typeof window !== 'undefined'
  ? localStorage.getItem('_sajume_admin_pw') || ''
  : ''

interface Stats {
  counts: Record<string, number>
  daily: Record<string, Record<string, number>>
  totalSubmissions: number
  paidSubmissions: number
  totalPayments: number
  recentSubmissions: {
    id: string
    name: string
    country: string
    created_at: string
    paid_report_url: string | null
  }[]
  dailySubmissionCounts: Record<string, number>
  noticeMeByProduct: Record<string, number>
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async (password: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-password': password },
      })
      if (res.status === 401) {
        setError('Wrong password')
        setAuthed(false)
        localStorage.removeItem('_sajume_admin_pw')
        return
      }
      const data = await res.json()
      setStats(data)
      setAuthed(true)
      localStorage.setItem('_sajume_admin_pw', password)
    } catch {
      setError('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-login if password saved
  useEffect(() => {
    const saved = localStorage.getItem('_sajume_admin_pw')
    if (saved) {
      setPw(saved)
      fetchStats(saved)
    }
  }, [fetchStats])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStats(pw)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sajume Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Enter your admin password to continue.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Password"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const c = stats.counts || {}

  // Build 14-day chart data
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
  const chartData = last14Days.map(day => ({
    date: day.slice(5), // MM-DD
    submissions: stats.dailySubmissionCounts?.[day] || 0,
    views: stats.daily?.[day]?.['form_submit'] || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sajume Admin</h1>
          <p className="text-xs text-gray-400">Real-time dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(pw)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-600"
          >
            Refresh
          </button>
          <button
            onClick={() => { setAuthed(false); localStorage.removeItem('_sajume_admin_pw') }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Submissions" value={stats.totalSubmissions ?? 0} sub="Form submits" />
          <StatCard label="Paid Reports" value={stats.paidSubmissions ?? 0} sub="Report generated" />
          <StatCard label="Payments" value={stats.totalPayments ?? 0} sub="Completed" />
          <StatCard label="Paid Report Views" value={c['view_paid_report'] ?? 0} sub="Total opens" />
          <StatCard label="Paid Link Shares" value={c['share_paid_report'] ?? 0} sub="Copy link clicks" />
          <StatCard label="Notice Me Clicks" value={c['notice_me_click'] ?? 0} sub="Shopify interest" />
        </div>

        {/* Notice Me breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Notice Me — Product Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'forecasting', label: 'Forecasting Reading' },
              { key: 'compatibility', label: 'Saju Compatibility' },
              { key: 'subscription', label: '12-Month Subscription' },
            ].map(({ key, label }) => (
              <div key={key} className="text-center border border-gray-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.noticeMeByProduct?.[key] ?? 0}</p>
                <p className="text-[10px] text-gray-300 mt-1">clicks</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily Submissions — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="submissions" fill="#111827" radius={[4, 4, 0, 0]} name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent Submissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Country</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Date</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentSubmissions || []).map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-5 py-3 text-gray-500">{s.country || '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(s.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3">
                      {s.paid_report_url ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Paid</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Free</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event counts table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">All Events (Total)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(c).length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">No events tracked yet. Events appear as users interact with the site.</p>
            )}
            {Object.entries(c)
              .sort((a, b) => b[1] - a[1])
              .map(([event, count]) => (
                <div key={event} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-mono">{event}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  )
}
