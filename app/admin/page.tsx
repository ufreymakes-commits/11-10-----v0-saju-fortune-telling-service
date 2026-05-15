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
    birth_country: string
    birth_date: string
    created_at: string
    paid_report_url: string | null
  }[]
  dailySubmissionCounts: Record<string, number>
  dailyPaidCounts: Record<string, number>
  noticeMeByProduct: Record<string, number>
  monthlyPaidCounts: Record<string, number>
  payerCountryCounts: Record<string, number>
}

// 운영비 (월 고정)
const MONTHLY_OPS_USD = 45 // Vercel Pro $20 + Supabase Pro $25
// AI Gateway: 결제 1건당 약 $0.024 (유료 레포트 생성 비용)
const AI_COST_PER_PAID = 0.024
// PayPal 수수료 제외 순수액
const NET_PER_SALE = 9.25

// ISO 국가 코드 → 국기 이모지
function countryFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
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

  // 매출 계산 = 유료 레포트 생성 수 기준 (paid_report_url 있는 submissions)
  const paidCount = stats.paidSubmissions ?? 0
  const grossRevenue = paidCount * 9.99
  const netRevenue = paidCount * NET_PER_SALE
  const aiCost = paidCount * AI_COST_PER_PAID
  const netAfterOps = netRevenue - aiCost - MONTHLY_OPS_USD
  const krwGross = krwRate ? grossRevenue * krwRate : null
  const krwNet = krwRate ? netAfterOps * krwRate : null

  const formatKRW = (v: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(v)
  const formatUSD = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  // Build 30-day chart data — free and paid separately
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
  const chartData = last30Days.map(day => {
    const total = stats.dailySubmissionCounts?.[day] || 0
    const paid = stats.dailyPaidCounts?.[day] || 0
    return {
      date: day.slice(5),
      무료: total - paid,
      유료: paid,
    }
  })

  // 전환율 계산
  const conversionRate = stats.totalSubmissions && stats.totalSubmissions > 0
    ? ((stats.paidSubmissions ?? 0) / stats.totalSubmissions * 100).toFixed(1)
    : '0.0'

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
          <StatCard label="링크 공유 - 무료" value={c['share_free_report'] ?? 0} sub="무료 레포트 공유" />
          <StatCard label="링크 공유 - 유료" value={c['share_paid_report'] ?? 0} sub="유료 레포트 공유" />
          <StatCard label="관심 표시" value={c['notice_me_click'] ?? 0} sub="Notice Me 전체" />
        </div>

        {/* 매출 현황 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">매출 현황 <span className="text-xs font-normal text-gray-400">(유료 레포트 생성 수 기준)</span></h2>
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
              <p className="text-[10px] text-gray-300 mt-1">{paidCount}건 × $9.99</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">PayPal 수수료 제외</p>
              <p className="text-xl font-bold text-gray-900">{formatUSD(netRevenue)}</p>
              <p className="text-[10px] text-gray-300 mt-1">{paidCount}건 × $9.25</p>
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

        {/* 월별 매출 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">월별 유료 레포트 발급 현황</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">월</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">발급 수</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">총 매출</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">순수익 (수수료+AI 제외)</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-400 font-medium">한화 순수익</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(stats.monthlyPaidCounts || {}).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">아직 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  Object.entries(stats.monthlyPaidCounts || {})
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([month, count], i) => {
                      const gross = count * 9.99
                      const net = count * NET_PER_SALE - count * AI_COST_PER_PAID - MONTHLY_OPS_USD
                      const krw = krwRate ? net * krwRate : null
                      const [y, m] = month.split('-')
                      const label = `${y}년 ${parseInt(m)}월`
                      return (
                        <tr key={month} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                          <td className="px-5 py-3 font-medium text-gray-800">{label}</td>
                          <td className="px-5 py-3 text-right text-gray-700">{count}건</td>
                          <td className="px-5 py-3 text-right text-gray-700">{formatUSD(gross)}</td>
                          <td className={`px-5 py-3 text-right font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatUSD(net)}
                          </td>
                          <td className={`px-5 py-3 text-right text-xs ${net >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {krw !== null ? formatKRW(krw) : '—'}
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">순수익 = (건수 × $9.25) - AI 비용 (건당 $0.024) - 인프라 고정비 ($45/월). 월 첫 건부터 인프라 비용 차감.</p>
          </div>
        </div>

        {/* Notice Me 제품별 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">관심 표시 (Notice Me) — 제품별</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'bracelet', label: '사주 에너지 팔찌' },
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

        {/* 결제자 국가별 현황 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">결제자 국가별 현황</h2>
            <p className="text-xs text-gray-400 mt-0.5">출생 국가가 아닌, PayPal 계정 기준 실제 결제 국가</p>
          </div>
          {Object.keys(stats.payerCountryCounts || {}).length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">아직 결제 데이터가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(stats.payerCountryCounts || {})
                .sort((a, b) => b[1] - a[1])
                .map(([code, count], i) => {
                  const total = Object.values(stats.payerCountryCounts).reduce((s, v) => s + v, 0)
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={code} className="px-5 py-3 flex items-center gap-4">
                      <span className="text-base w-6 text-center">{countryFlag(code)}</span>
                      <span className="text-sm font-medium text-gray-800 w-12">{code}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-gray-800 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* 운영비 안내 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">운영비 연동 안내</h2>
          <p className="text-xs text-amber-700 leading-relaxed">
            Vercel · Supabase 실제 청구 금액은 각 대시보드에�� 확인하세요.
            현재 운영비($45/월)는 고정값으로 계산됩니다. 실제 연동은 각 서비스가 공개 API를 제공하지 않아 자동화가 불가합니다.
            <br />
            <span className="font-medium">Vercel:</span> vercel.com/dashboard → Usage &nbsp;|&nbsp;
            <span className="font-medium">Supabase:</span> supabase.com → Project → Settings → Billing
          </p>
        </div>

        {/* 일별 제출 차트 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-700">일별 제출 수 — 최근 30일</h2>
              <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-medium">
                전환율 {conversionRate}%
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-gray-200" />무료</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-gray-900" />유료</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="무료" stackId="a" fill="#e5e7eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="유료" stackId="a" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 제출 목록 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">최근 제출 목록</h2>
            <span className="text-xs text-gray-400">최근 20건</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">이름</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">출생국가</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">생년월일</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">제출일시</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">구분</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentSubmissions || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-gray-400">데이터가 없습니다.</td>
                  </tr>
                ) : (
                  (stats.recentSubmissions || []).map((s, i) => (
                    <tr key={s.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{s.birth_country || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{s.birth_date || '—'}</td>
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
                  ))
                )}
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
