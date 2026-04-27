'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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

// 운영비 (월 고정)
const MONTHLY_OPS_USD = 45 // Vercel Pro $20 + Supabase Pro $25
// AI Gateway: 결제 1건당 약 $0.024 (유료 레포트 생성 비용)
const AI_COST_PER_PAID = 0.024
// PayPal 수수료 제외 순수액
const NET_PER_SALE = 9.25

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
  const [krwRate, setKrwRate] = useState<number | null>(null)
  const [rateLoading, setRateLoading] = useState(false)

  const fetchStats = useCallback(async (password: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-password': password },
      })
      if (res.status === 401) {
        setError('비밀번호가 틀렸습니다')
        setAuthed(false)
        localStorage.removeItem('_sajume_admin_pw')
        return
      }
      const data = await res.json()
      setStats(data)
      setAuthed(true)
      localStorage.setItem('_sajume_admin_pw', password)
    } catch {
      setError('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchExchangeRate = useCallback(async () => {
    setRateLoading(true)
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      const data = await res.json()
      setKrwRate(data.rates?.KRW ?? null)
    } catch {
      setKrwRate(null)
    } finally {
      setRateLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('_sajume_admin_pw')
    if (saved) {
      setPw(saved)
      fetchStats(saved)
    }
  }, [fetchStats])

  useEffect(() => {
    if (authed) fetchExchangeRate()
  }, [authed, fetchExchangeRate])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchStats(pw)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sajume 관리자</h1>
          <p className="text-sm text-gray-400 mb-6">관리자 비밀번호를 입력하세요.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="비밀번호"
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? '로딩 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const c = stats.counts || {}
  const totalPayments = stats.totalPayments ?? 0

  // 매출 계산 (런칭 후 실제 결제 기준 = payments 테이블 completed 건수)
  const grossRevenue = totalPayments * 9.99
  const netRevenue = totalPayments * NET_PER_SALE
  const aiCost = totalPayments * AI_COST_PER_PAID
  const netAfterOps = netRevenue - aiCost - MONTHLY_OPS_USD
  const krwGross = krwRate ? grossRevenue * krwRate : null
  const krwNet = krwRate ? netAfterOps * krwRate : null

  const formatKRW = (v: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(v)
  const formatUSD = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  // Build 14-day chart data
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
  const chartData = last14Days.map(day => ({
    date: day.slice(5),
    제출: stats.dailySubmissionCounts?.[day] || 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sajume 관리자</h1>
          <p className="text-xs text-gray-400">실시간 대시보드</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchStats(pw); fetchExchangeRate() }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-600"
          >
            새로고침
          </button>
          <button
            onClick={() => { setAuthed(false); localStorage.removeItem('_sajume_admin_pw') }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="총 제출 수" value={stats.totalSubmissions ?? 0} sub="무료 레포트 생성" />
          <StatCard label="유료 레포트" value={stats.paidSubmissions ?? 0} sub="레포트 발급 완료" />
          <StatCard label="결제 완료" value={totalPayments} sub="PayPal 결제" />
          <StatCard label="유료 레포트 열람" value={c['view_paid_report'] ?? 0} sub="페이지 접속" />
          <StatCard label="링크 공유" value={c['share_paid_report'] ?? 0} sub="링크 복사 클릭" />
          <StatCard label="관심 클릭 (Notice Me)" value={c['notice_me_click'] ?? 0} sub="전체 관심 표시" />
        </div>

        {/* 매출 현황 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">매출 현황 <span className="text-xs font-normal text-gray-400">(런칭 후 실제 결제 기준)</span></h2>
            {rateLoading ? (
              <span className="text-xs text-gray-400">환율 조회 중...</span>
            ) : krwRate ? (
              <span className="text-xs text-gray-400">실시간 환율: 1 USD = {krwRate.toLocaleString('ko-KR')}원</span>
            ) : (
              <button onClick={fetchExchangeRate} className="text-xs text-blue-500 hover:underline">환율 불러오기</button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">총 매출액</p>
              <p className="text-xl font-bold text-gray-900">{formatUSD(grossRevenue)}</p>
              {krwGross !== null && <p className="text-xs text-blue-500 mt-1">{formatKRW(krwGross)}</p>}
              <p className="text-[10px] text-gray-300 mt-1">{totalPayments}건 × $9.99</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">PayPal 수수료 제외</p>
              <p className="text-xl font-bold text-gray-900">{formatUSD(netRevenue)}</p>
              <p className="text-[10px] text-gray-300 mt-1">{totalPayments}건 × $9.25</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">운영비</p>
              <p className="text-xl font-bold text-red-500">
                -{formatUSD(aiCost + MONTHLY_OPS_USD)}
              </p>
              <p className="text-[10px] text-gray-300 mt-1">Vercel+Supabase ${MONTHLY_OPS_USD} + AI ${aiCost.toFixed(2)}</p>
            </div>
            <div className="border border-green-100 rounded-lg p-4 bg-green-50/50">
              <p className="text-xs text-gray-400 mb-1">순수익</p>
              <p className={`text-xl font-bold ${netAfterOps >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatUSD(netAfterOps)}
              </p>
              {krwNet !== null && (
                <p className={`text-xs mt-1 ${netAfterOps >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {formatKRW(krwNet)}
                </p>
              )}
              <p className="text-[10px] text-gray-300 mt-1">수수료·AI·인프라 제외</p>
            </div>
          </div>
        </div>

        {/* Notice Me 제품별 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">관심 표시 (Notice Me) — 제품별</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'bracelet', label: '사주 에너지 팔찌' },
              { key: 'forecasting', label: '운세 리딩' },
              { key: 'compatibility', label: '사주 궁합' },
              { key: 'subscription', label: '12개월 구독' },
            ].map(({ key, label }) => (
              <div key={key} className="text-center border border-gray-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.noticeMeByProduct?.[key] ?? 0}</p>
                <p className="text-[10px] text-gray-300 mt-1">클릭</p>
              </div>
            ))}
          </div>
        </div>

        {/* 일별 제출 차트 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">일별 제출 수 — 최근 14일</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="제출" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 제출 목록 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">최근 제출 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">이름</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">국가</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">제출일시</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">구분</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentSubmissions || []).map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-5 py-3 text-gray-500">{s.country || '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(s.created_at).toLocaleString('ko-KR', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3">
                      {s.paid_report_url ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">유료</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">무료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 전체 이벤트 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">전체 이벤트 (누적)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(c).length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">아직 기록된 이벤트가 없습니다. 사용자가 사이트를 이용하면 자동으로 쌓입니다.</p>
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
