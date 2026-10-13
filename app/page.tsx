'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Search, Package, TrendingUp, Leaf, Bell, Settings,
  ChevronRight, ExternalLink, BarChart3, Globe, RefreshCw, Star, X, Plus,
  Edit2, Trash2, Save, Zap, ChevronDown, ChevronUp
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ===== 型定義 =====
interface Deal {
  id: string
  title: string
  source: string
  buy_price: number
  sell_price: number
  status: string
  memo: string
  url: string
  created_at: string
}

interface KithulItem {
  id: string
  name: string
  stock: number
  unit: string
  price: number
  notes: string
}

interface NewsItem {
  title: string
  source: string
  time: string
  url: string
}

// ===== 定数 =====
const mockFinds = [
  { id: 1, site: 'ヤフオク', title: '電動車椅子 YAMAHA JWX-2 動作確認済み', price: 28000, image: '🦽', status: 'new', time: '3分前', url: 'https://auctions.yahoo.co.jp/search/search?p=電動車椅子', estimatedSell: 85000, margin: 57000 },
  { id: 2, site: 'ジモティー', title: '介護ベッド パラマウント 電動3モーター 引取歓迎', price: 15000, image: '🛏️', status: 'new', time: '12分前', url: 'https://jmty.jp/all/sale-fur/article-medicalequip', estimatedSell: 45000, margin: 30000 },
  { id: 3, site: 'メルカリ', title: '手動車椅子 ミキ BAL-0 折りたたみ 美品', price: 8500, image: '🦽', status: 'new', time: '31分前', url: 'https://jp.mercari.com/search?keyword=車椅子', estimatedSell: 22000, margin: 13500 },
  { id: 4, site: 'ラクマ', title: '歩行器 アルミ製 軽量タイプ 未使用に近い', price: 3200, image: '🚶', status: 'check', time: '1時間前', url: 'https://fril.jp/search?search[keyword]=歩行器', estimatedSell: 9000, margin: 5800 },
  { id: 5, site: 'ヤフオク', title: '介護ベッド セット 電動2モーター マットレス付き', price: 35000, image: '🛏️', status: 'new', time: '2時間前', url: 'https://auctions.yahoo.co.jp/search/search?p=介護ベッド', estimatedSell: 98000, margin: 63000 },
]

const siteColors: Record<string, string> = {
  'ヤフオク':  'bg-red-500/20 text-red-400 border-red-500/30',
  'ジモティー': 'bg-green-500/20 text-green-400 border-green-500/30',
  'メルカリ':  'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'ラクマ':    'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  '仕入中':   { label: '仕入中',   cls: 'badge badge-progress' },
  '輸出準備': { label: '輸出準備', cls: 'badge badge-new' },
  '輸送中':   { label: '輸送中',   cls: 'badge badge-alert' },
  '完了':     { label: '完了',     cls: 'badge badge-done' },
  'buying':   { label: '仕入中',   cls: 'badge badge-progress' },
  'ready':    { label: '輸出準備', cls: 'badge badge-new' },
  'shipping': { label: '輸送中',   cls: 'badge badge-alert' },
  'done':     { label: '完了',     cls: 'badge badge-done' },
}

const notifications = [
  { id: 1, type: 'alert', msg: '電動車椅子 YAMAHA の在庫が「輸出準備」になりました', time: '10分前', read: false },
  { id: 2, type: 'tip',   msg: 'LKR/JPY が上昇中。送金タイミングをご確認ください', time: '1時間前', read: false },
  { id: 3, type: 'news',  msg: 'スリランカ医療機器輸入関税の改定情報が更新されました', time: '3時間前', read: true },
]

type Tab = 'radar' | 'inventory' | 'intel' | 'kithul' | 'settings' | 'notifications'
type PrevTab = 'radar' | 'inventory' | 'intel' | 'kithul'

// ===== 利益グラフ（SVG） =====
function ProfitDonut({ deals }: { deals: Deal[] }) {
  const statusGroups = [
    { label: '仕入中',   statuses: ['仕入中','buying'],   color: '#38bdf8', bg: '#0ea5e9' },
    { label: '輸出準備', statuses: ['輸出準備','ready'],  color: '#a78bfa', bg: '#8b5cf6' },
    { label: '輸送中',   statuses: ['輸送中','shipping'], color: '#fb923c', bg: '#f97316' },
    { label: '完了',     statuses: ['完了','done'],       color: '#34d399', bg: '#10b981' },
  ]
  const counts = statusGroups.map(g => ({
    ...g,
    count: deals.filter(d => g.statuses.includes(d.status)).length,
  }))
  const total = counts.reduce((s, g) => s + g.count, 0)
  if (total === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs">案件がありません</div>
  )
  const r = 36, cx = 48, cy = 48, stroke = 14
  let offset = 0
  const circumference = 2 * Math.PI * r
  const slices = counts.map(g => {
    const pct = g.count / total
    const dash = pct * circumference
    const slice = { ...g, dash, gap: circumference - dash, offset: offset * circumference }
    offset += pct
    return slice
  }).filter(s => s.count > 0)

  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '48px 48px' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="9">案件</text>
      </svg>
      <div className="space-y-1.5">
        {counts.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
            <span className="text-slate-400">{g.label}</span>
            <span className="text-white font-medium ml-auto pl-3">{g.count}件</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfitBars({ deals }: { deals: Deal[] }) {
  // 直近6ヶ月の確定利益
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: `${d.getMonth() + 1}月`, year: d.getFullYear(), month: d.getMonth() }
  })
  const profits = months.map(m => {
    const sum = deals
      .filter(d => (d.status === '完了' || d.status === 'done') && d.created_at)
      .filter(d => {
        const dt = new Date(d.created_at)
        return dt.getFullYear() === m.year && dt.getMonth() === m.month
      })
      .reduce((s, d) => s + (d.sell_price - d.buy_price), 0)
    return { ...m, profit: sum }
  })
  const maxP = Math.max(...profits.map(p => p.profit), 1)
  const barW = 28, gap = 8, totalW = (barW + gap) * 6 - gap, svgH = 80

  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">月別確定利益（直近6ヶ月）</div>
      <svg width="100%" viewBox={`0 0 ${totalW} ${svgH + 20}`} style={{ overflow: 'visible' }}>
        {profits.map((p, i) => {
          const barH = p.profit > 0 ? Math.max(4, (p.profit / maxP) * svgH) : 2
          const x = i * (barW + gap)
          return (
            <g key={i}>
              <rect x={x} y={svgH - barH} width={barW} height={barH}
                rx={4}
                fill={p.profit > 0 ? '#34d399' : '#334155'}
              />
              <text x={x + barW / 2} y={svgH + 14} textAnchor="middle" fill="#64748b" fontSize="9">{p.label}</text>
              {p.profit > 0 && (
                <text x={x + barW / 2} y={svgH - barH - 4} textAnchor="middle" fill="#34d399" fontSize="8">
                  {p.profit >= 10000 ? `${Math.round(p.profit / 1000)}k` : p.profit}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ===== メインコンポーネント =====
export default function Home() {
  const [tab, setTab] = useState<Tab>('radar')
  const [prevTab, setPrevTab] = useState<PrevTab>('radar')
  const [radarScanning, setRadarScanning] = useState(false)
  const [aiIdx, setAiIdx] = useState(0)
  const [notifCount, setNotifCount] = useState(2)
  const [expandedFind, setExpandedFind] = useState<number | null>(null)
  const [findEstimates, setFindEstimates] = useState<Record<number, { sell: string; memo: string }>>({})

  // 案件
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [registerItem, setRegisterItem] = useState<typeof mockFinds[0] | null>(null)
  const [registerSell, setRegisterSell] = useState('')
  const [form, setForm] = useState({ title: '', source: 'ヤフオク', buy_price: '', sell_price: '', status: '仕入中', memo: '', url: '' })

  // 為替
  const [rates, setRates] = useState({ lkr: 0.44, change: 0.02 })
  const [ratesLoading, setRatesLoading] = useState(true)

  // ニュース
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  // AI提案
  const [aiTips, setAiTips] = useState<string[]>([
    '🔥 今週のヤフオクで「施設閉鎖」出品が急増中。まとめ買い交渉のチャンスです',
    '📈 LKR/JPY が先週比 +4.5%。今月の送金タイミングとして○',
    '💡 スリランカでは11月に医療機器の輸入関税が変更予定。今動くのがベター',
    '🎯 ラクマで「歩行器」の相場が先月比 -15%。仕入れ単価を下げられる可能性あり',
  ])
  const [aiSource, setAiSource] = useState('static')

  // キトゥル
  const [kithulStock, setKithulStock] = useState<KithulItem[]>([])
  const [kithulLoading, setKithulLoading] = useState(true)
  const [editingKithul, setEditingKithul] = useState<string | null>(null)

  // ===== データ取得 =====
  const fetchDeals = useCallback(async () => {
    setDealsLoading(true)
    const { data } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
    if (data) setDeals(data)
    setDealsLoading(false)
  }, [])

  const fetchRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const res = await fetch('/api/rates')
      if (res.ok) {
        const data = await res.json()
        setRates({ lkr: data.lkr, change: data.change })
      }
    } catch { /* fallback値のまま */ }
    setRatesLoading(false)
  }, [])

  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    try {
      const res = await fetch('/api/news')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setNews(data)
      }
    } catch { /* fallback */ }
    setNewsLoading(false)
  }, [])

  const fetchAiTips = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-tips')
      if (res.ok) {
        const data = await res.json()
        setAiTips(data.tips)
        setAiSource(data.source)
      }
    } catch { /* fallback */ }
  }, [])

  const fetchKithul = useCallback(async () => {
    setKithulLoading(true)
    const { data } = await supabase.from('kithul_stock').select('*').order('name')
    if (data && data.length > 0) setKithulStock(data)
    else {
      setKithulStock([
        { id: '1', name: 'キトゥル・トリークル 500ml', stock: 0, unit: '本', price: 3500, notes: '' },
        { id: '2', name: 'キトゥル・トリークル 1L', stock: 0, unit: '本', price: 6000, notes: '' },
        { id: '3', name: 'キトゥル・ジャガリー 250g', stock: 0, unit: '袋', price: 1800, notes: '' },
      ])
    }
    setKithulLoading(false)
  }, [])

  useEffect(() => {
    fetchDeals()
    fetchRates()
    fetchNews()
    fetchAiTips()
    fetchKithul()
  }, [fetchDeals, fetchRates, fetchNews, fetchAiTips, fetchKithul])

  // ===== 集計 =====
  const totalProfit = deals.filter(i => i.status === '完了' || i.status === 'done').reduce((s, i) => s + (i.sell_price - i.buy_price), 0)
  const pendingProfit = deals.filter(i => i.status !== '完了' && i.status !== 'done').reduce((s, i) => s + (i.sell_price - i.buy_price), 0)

  // ===== 案件操作 =====
  const resetForm = () => setForm({ title: '', source: 'ヤフオク', buy_price: '', sell_price: '', status: '仕入中', memo: '', url: '' })

  const saveDeal = async () => {
    if (!form.title) return
    setSaving(true)
    const payload = {
      title: form.title, source: form.source,
      buy_price: Number(form.buy_price) || 0, sell_price: Number(form.sell_price) || 0,
      status: form.status, memo: form.memo, url: form.url,
    }
    if (editingDeal) await supabase.from('deals').update(payload).eq('id', editingDeal.id)
    else await supabase.from('deals').insert([payload])
    await fetchDeals()
    setSaving(false)
    setShowAddModal(false)
    setEditingDeal(null)
    resetForm()
  }

  const registerFromRadar = async (item: typeof mockFinds[0]) => {
    setSaving(true)
    const sell = Number(registerSell) || 0
    await supabase.from('deals').insert([{
      title: item.title, source: item.site,
      buy_price: item.price, sell_price: sell,
      status: '仕入中', memo: '', url: item.url
    }])
    await fetchDeals()
    setSaving(false)
    setRegisterItem(null)
    setRegisterSell('')
    setTab('inventory')
  }

  const deleteDeal = async (id: string) => {
    if (!confirm('この案件を削除しますか？')) return
    await supabase.from('deals').delete().eq('id', id)
    await fetchDeals()
  }

  const startEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setForm({ title: deal.title, source: deal.source || 'ヤフオク', buy_price: String(deal.buy_price), sell_price: String(deal.sell_price), status: deal.status, memo: deal.memo || '', url: deal.url || '' })
    setShowAddModal(true)
  }

  // ===== キトゥル操作 =====
  const saveKithul = async (id: string, newStock: number, newNotes: string) => {
    await supabase.from('kithul_stock').update({ stock: newStock, notes: newNotes, updated_at: new Date().toISOString() }).eq('id', id)
    setKithulStock(prev => prev.map(k => k.id === id ? { ...k, stock: newStock, notes: newNotes } : k))
    setEditingKithul(null)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">

      {/* TOP BAR */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-sm font-bold">N</div>
            <span className="font-bold text-white tracking-wide">NIWA Dashboard</span>
            <span className="hidden sm:block text-xs text-slate-500">丹羽芳幸 ビジネス管理</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (tab === 'notifications') { setTab(prevTab) }
              else { if (tab !== 'settings') setPrevTab(tab as PrevTab); setTab('notifications') }
            }} className="relative">
              <Bell size={18} className={tab === 'notifications' ? 'text-sky-400' : 'text-slate-400 hover:text-sky-400'} />
              {notifCount > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center">{notifCount}</span>}
            </button>
            <button onClick={() => {
              if (tab === 'settings') { setTab(prevTab) }
              else { if (tab !== 'notifications') setPrevTab(tab as PrevTab); setTab('settings') }
            }} className={tab === 'settings' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}>
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* 通知 */}
        {tab === 'notifications' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2"><Bell size={16} className="text-sky-400" /> 通知</h2>
              <button onClick={() => setNotifCount(0)} className="text-xs text-slate-500 hover:text-slate-300">全て既読にする</button>
            </div>
            {notifications.map(n => (
              <div key={n.id} className={`bg-[#1e293b] border rounded-xl p-4 flex gap-3 ${n.read ? 'border-slate-800 opacity-60' : 'border-sky-500/30'}`}>
                <div className="text-lg">{n.type === 'alert' ? '🔔' : n.type === 'tip' ? '💡' : '📰'}</div>
                <div className="flex-1"><p className="text-sm text-slate-200">{n.msg}</p><p className="text-xs text-slate-500 mt-1">{n.time}</p></div>
                {!n.read && <div className="w-2 h-2 bg-sky-400 rounded-full flex-shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        )}

        {/* 設定 */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Settings size={16} className="text-slate-400" /> 設定</h2>
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl divide-y divide-slate-800">
              {[
                { label: 'アカウント', desc: '丹羽芳幸 / houmon.kango.yoshiyuki@gmail.com', icon: '👤' },
                { label: '為替レート更新', desc: 'LKR/JPY レートを毎時自動取得（exchangerate-api）', icon: '💱', toggle: true },
                { label: 'AI提案通知', desc: 'Claude Haiku による毎日自動生成', icon: '🤖', toggle: true },
                { label: 'レーダー巡回間隔', desc: '30分ごとに自動スキャン（GitHub Actions）', icon: '🔍' },
                { label: 'バージョン', desc: 'NIWA Dashboard v0.4 · フル機能版', icon: 'ℹ️' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <span className="text-xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{s.label}</div>
                    <div className="text-xs text-slate-500">{s.desc}</div>
                  </div>
                  {s.toggle ? (
                    <div className="w-10 h-5 bg-sky-500 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" /></div>
                  ) : (
                    <ChevronRight size={16} className="text-slate-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        {tab !== 'settings' && tab !== 'notifications' && (
          <>
            {/* サマリーカード */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '新着仕入れ候補', value: `${mockFinds.length}件`, sub: '過去3時間', icon: <Zap size={16}/>, color: 'text-sky-400', glow: 'glow-blue', border: 'border-sky-500/20' },
                { label: '確定利益（累計）', value: `¥${totalProfit.toLocaleString()}`, sub: '今月', icon: <BarChart3 size={16}/>, color: 'text-emerald-400', glow: 'glow-green', border: 'border-emerald-500/20' },
                { label: '見込み利益', value: `¥${pendingProfit.toLocaleString()}`, sub: '案件進行中', icon: <TrendingUp size={16}/>, color: 'text-amber-400', glow: '', border: 'border-amber-500/20' },
                {
                  label: 'LKR/JPY',
                  value: ratesLoading ? '...' : `${rates.lkr}円`,
                  sub: ratesLoading ? '取得中' : `前日比 ${rates.change >= 0 ? '+' : ''}${rates.change}円 ${rates.change >= 0 ? '📈' : '📉'}`,
                  icon: <Globe size={16}/>, color: 'text-purple-400', glow: '', border: 'border-purple-500/20'
                },
              ].map((s, i) => (
                <div key={i} className={`bg-[#1e293b] border ${s.border} rounded-xl p-4 card-hover ${s.glow}`}>
                  <div className={`${s.color} mb-2`}>{s.icon}</div>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                  <div className="text-xs text-slate-500">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* AI提案バナー */}
            <div className="bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Star size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-sky-400 font-medium mb-1">
                  AI提案 · {aiSource === 'claude' ? 'Claude生成 · 毎日更新' : '毎日更新'}
                </div>
                <p className="text-sm text-slate-200">{aiTips[aiIdx]}</p>
              </div>
              <button onClick={() => setAiIdx((aiIdx + 1) % aiTips.length)} className="text-slate-500 hover:text-sky-400 transition-colors flex-shrink-0">
                <RefreshCw size={14} />
              </button>
            </div>

            {/* タブナビ */}
            <div className="flex gap-1 bg-[#1e293b] rounded-xl p-1">
              {([
                { id: 'radar',     label: '🔍 仕入れレーダー' },
                { id: 'inventory', label: '📦 在庫・案件' },
                { id: 'intel',     label: '🌍 市場情報' },
                { id: 'kithul',    label: '🌿 キトゥル' },
              ] as { id: Tab; label: string }[]).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === t.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 仕入れレーダー */}
            {tab === 'radar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white flex items-center gap-2"><Search size={16} className="text-sky-400" />新着仕入れ候補</h2>
                  <button onClick={async () => { setRadarScanning(true); await new Promise(r => setTimeout(r, 2000)); setRadarScanning(false) }} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
                    <RefreshCw size={12} className={radarScanning ? 'animate-spin' : ''} /> {radarScanning ? '巡回中...' : '今すぐ巡回'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['ヤフオク', 'ジモティー', 'メルカリ', 'ラクマ', 'セカンドストリート'].map(site => (
                    <div key={site} className={`badge border ${siteColors[site] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      <span className="pulse-dot" />{site}
                    </div>
                  ))}
                </div>

                {mockFinds.map(item => {
                  const est = findEstimates[item.id]
                  const sellVal = est?.sell ? Number(est.sell) : item.estimatedSell
                  const profitVal = sellVal - item.price
                  const marginPct = sellVal > 0 ? Math.round((profitVal / sellVal) * 100) : 0
                  const isOpen = expandedFind === item.id

                  return (
                    <div key={item.id} className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden card-hover">
                      {/* メイン行 */}
                      <div className="flex items-center gap-4 p-4">
                        <div className="text-3xl flex-shrink-0">{item.image}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge border text-[10px] ${siteColors[item.site] || ''}`}>{item.site}</span>
                            {item.status === 'new' && <span className="badge badge-new">NEW</span>}
                            <span className="text-xs text-slate-500">{item.time}</span>
                          </div>
                          <p className="text-sm text-slate-200 font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-base font-bold text-white">¥{item.price.toLocaleString()}</p>
                            <span className="text-xs text-slate-600">→</span>
                            <p className="text-base font-bold text-emerald-400">+¥{profitVal.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">({marginPct}%)</span></p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button onClick={() => window.open(item.url, '_blank')} className="bg-sky-500 hover:bg-sky-400 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <ExternalLink size={12} /> 見る
                          </button>
                          <button
                            onClick={() => setExpandedFind(isOpen ? null : item.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            登録 {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* 展開パネル */}
                      {isOpen && (
                        <div className="border-t border-slate-700 bg-[#162032] p-4 space-y-3">
                          <div className="text-xs text-sky-400 font-medium mb-2">📋 案件詳細を確認して登録</div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-[#0f172a] rounded-lg p-2">
                              <div className="text-xs text-slate-500 mb-1">仕入値</div>
                              <div className="text-white font-bold">¥{item.price.toLocaleString()}</div>
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-2">
                              <div className="text-xs text-slate-500 mb-1">売値（見込）</div>
                              <input
                                type="number"
                                value={est?.sell ?? item.estimatedSell}
                                onChange={e => setFindEstimates(prev => ({ ...prev, [item.id]: { ...prev[item.id], sell: e.target.value } }))}
                                className="w-full bg-transparent text-emerald-400 font-bold text-center focus:outline-none border-b border-slate-600 focus:border-sky-400"
                              />
                            </div>
                            <div className="bg-[#0f172a] rounded-lg p-2">
                              <div className="text-xs text-slate-500 mb-1">予想利益</div>
                              <div className={`font-bold ${profitVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ¥{profitVal.toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500">{marginPct}%</div>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="メモ（任意）"
                            value={est?.memo ?? ''}
                            onChange={e => setFindEstimates(prev => ({ ...prev, [item.id]: { ...prev[item.id], memo: e.target.value } }))}
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                          />
                          <div className="flex gap-3">
                            <button onClick={() => setExpandedFind(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-lg transition-colors text-sm">キャンセル</button>
                            <button
                              onClick={async () => {
                                setSaving(true)
                                const sell = est?.sell ? Number(est.sell) : item.estimatedSell
                                await supabase.from('deals').insert([{
                                  title: item.title, source: item.site,
                                  buy_price: item.price, sell_price: sell,
                                  status: '仕入中', memo: est?.memo || '', url: item.url
                                }])
                                await fetchDeals()
                                setSaving(false)
                                setExpandedFind(null)
                                setTab('inventory')
                              }}
                              disabled={saving}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                              案件として登録
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 在庫・案件 */}
            {tab === 'inventory' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white flex items-center gap-2"><Package size={16} className="text-emerald-400" />案件一覧</h2>
                  <button onClick={() => { resetForm(); setEditingDeal(null); setShowAddModal(true) }} className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <Plus size={12} /> 新規登録
                  </button>
                </div>

                {/* グラフエリア */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ドーナツ */}
                  <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-400 font-medium mb-3">📊 案件ステータス分布</div>
                    <ProfitDonut deals={deals} />
                  </div>
                  {/* 棒グラフ */}
                  <div className="bg-[#1e293b] border border-emerald-500/20 rounded-xl p-4 glow-green">
                    <div className="text-xs text-slate-400 font-medium mb-2">💴 月別確定利益</div>
                    <ProfitBars deals={deals} />
                    <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">確定累計</div>
                        <div className="text-emerald-400 font-bold">¥{totalProfit.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">見込み</div>
                        <div className="text-amber-400 font-bold">¥{pendingProfit.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 件数サマリ */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '進行中案件', value: `${deals.filter(i => i.status !== '完了' && i.status !== 'done').length}件`, color: 'text-sky-400' },
                    { label: '見込み利益', value: `¥${pendingProfit.toLocaleString()}`, color: 'text-amber-400' },
                    { label: '確定利益', value: `¥${totalProfit.toLocaleString()}`, color: 'text-emerald-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center">
                      <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {dealsLoading ? (
                  <div className="text-center py-8 text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />読み込み中...</div>
                ) : deals.length === 0 ? (
                  <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                    <Package size={32} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-sm">案件がありません</p>
                    <p className="text-xs mt-1">「新規登録」またはレーダーの「登録」ボタンで追加してください</p>
                  </div>
                ) : deals.map(item => {
                  const profit = item.sell_price - item.buy_price
                  const margin = item.sell_price > 0 ? Math.round((profit / item.sell_price) * 100) : 0
                  const st = statusLabel[item.status] || { label: item.status, cls: 'badge badge-progress' }
                  return (
                    <div key={item.id} className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 card-hover">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={st.cls}>{st.label}</span>
                            {item.source && <span className={`badge border text-[10px] ${siteColors[item.source] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>{item.source}</span>}
                          </div>
                          <p className="font-medium text-white">{item.title}</p>
                          {item.memo && <p className="text-xs text-slate-500 mt-1">{item.memo}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-sky-400 p-1.5 rounded transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteDeal(item.id)} className="text-slate-500 hover:text-red-400 p-1.5 rounded transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800">
                        <div><div className="text-xs text-slate-500">仕入値</div><div className="font-medium text-slate-300">¥{item.buy_price.toLocaleString()}</div></div>
                        <div><div className="text-xs text-slate-500">売値</div><div className="font-medium text-white">¥{item.sell_price.toLocaleString()}</div></div>
                        <div>
                          <div className="text-xs text-slate-500">粗利</div>
                          <div className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ¥{profit.toLocaleString()}{item.sell_price > 0 && <span className="text-xs font-normal text-slate-500"> ({margin}%)</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 市場インテリジェンス */}
            {tab === 'intel' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-white flex items-center gap-2"><Globe size={16} className="text-purple-400" />市場インテリジェンス</h2>

                {/* 為替 */}
                <div className="bg-[#1e293b] border border-purple-500/20 rounded-xl p-4 glow-blue">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-purple-400 font-medium">💱 LKR/JPY 為替レート</div>
                    <button onClick={fetchRates} className="text-slate-500 hover:text-purple-400 transition-colors">
                      <RefreshCw size={12} className={ratesLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {ratesLoading ? (
                    <div className="text-slate-500 text-sm">取得中...</div>
                  ) : (
                    <div className="flex items-end gap-4">
                      <div>
                        <div className="text-3xl font-bold text-white">{rates.lkr}<span className="text-base text-slate-400">円</span></div>
                        <div className={`text-xs mt-1 ${rates.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {rates.change >= 0 ? '▲' : '▼'} {Math.abs(rates.change)}円 前日比
                        </div>
                      </div>
                      <div className="flex-1 text-right text-xs text-slate-500">
                        <div>1 LKR = {rates.lkr} JPY</div>
                        <div>100 LKR = {(rates.lkr * 100).toFixed(0)} JPY</div>
                        <div className="mt-2 text-sky-400">{rates.change >= 0 ? '送金のタイミングとして○' : '少し待つのも手'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI提案 */}
                <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-sky-400 font-medium mb-3 pulse-dot">
                    🤖 AIトレンド分析 · {aiSource === 'claude' ? 'Claude生成' : '本日更新'}
                  </div>
                  <div className="space-y-3">
                    {aiTips.map((tip, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="text-slate-500 flex-shrink-0">0{i + 1}</span>
                        <p className="text-slate-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ニュース */}
                <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-400 font-medium">📰 スリランカ医療・介護ニュース</div>
                    <button onClick={fetchNews} className="text-slate-500 hover:text-slate-300 transition-colors">
                      <RefreshCw size={12} className={newsLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  {newsLoading ? (
                    <div className="text-slate-500 text-sm py-2">取得中...</div>
                  ) : news.length > 0 ? news.map((n, i) => (
                    <div key={i} className="flex gap-3 py-3 border-b border-slate-800 last:border-0">
                      <div className="flex-1">
                        <p
                          className="text-sm text-slate-200 hover:text-sky-400 cursor-pointer transition-colors"
                          onClick={() => n.url !== '#' && window.open(n.url, '_blank')}
                        >{n.title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-slate-600">{n.source}</span>
                          <span className="text-xs text-slate-600">{n.time}</span>
                        </div>
                      </div>
                      {n.url !== '#' && <ExternalLink size={14} className="text-slate-600 flex-shrink-0 mt-1" />}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">ニュースを取得できませんでした</p>
                  )}
                </div>
              </div>
            )}

            {/* キトゥル */}
            {tab === 'kithul' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-white flex items-center gap-2"><Leaf size={16} className="text-emerald-400" />キトゥル・トリークル事業</h2>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '在庫総数', value: kithulLoading ? '...' : `${kithulStock.reduce((s, k) => s + k.stock, 0)}点`, color: 'text-emerald-400' },
                    { label: '注文数（今月）', value: '0件', color: 'text-slate-400' },
                    { label: '売上（今月）', value: '¥0', color: 'text-slate-400' },
                    { label: 'FOB単価', value: '¥642/本', color: 'text-amber-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* 在庫管理 */}
                <div className="bg-[#1e293b] border border-emerald-500/20 rounded-xl p-4 glow-green">
                  <div className="text-xs text-emerald-400 font-medium mb-3">📦 在庫管理</div>
                  {kithulLoading ? (
                    <div className="text-slate-500 text-sm py-2">読み込み中...</div>
                  ) : (
                    <div className="space-y-3">
                      {kithulStock.map(k => (
                        <div key={k.id} className="border border-slate-800 rounded-lg p-3">
                          {editingKithul === k.id ? (
                            <KithulEditor item={k} onSave={saveKithul} onCancel={() => setEditingKithul(null)} />
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">{k.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-lg font-bold ${k.stock > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{k.stock}{k.unit}</span>
                                  <span className="text-xs text-slate-500">¥{k.price.toLocaleString()}/個</span>
                                </div>
                                {k.notes && <p className="text-xs text-slate-500 mt-1">{k.notes}</p>}
                              </div>
                              <button onClick={() => setEditingKithul(k.id)} className="text-slate-500 hover:text-emerald-400 p-1.5 rounded transition-colors">
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 低GI競合 */}
                <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-emerald-400 font-medium mb-3">🌿 低GI市場トレンド監視</div>
                  {[
                    { title: '低GIシロップ Amazon新商品：メープルシロップ糖質オフ版', price: '¥1,890', change: 'NEW', site: 'Amazon' },
                    { title: 'キャロブシロップ 有機 300g', price: '¥2,200', change: '-5%', site: '楽天' },
                    { title: 'アガベシロップ ダイエット用', price: '¥1,650', change: '+3%', site: 'Yahoo' },
                  ].map((p, i) => (
                    <div key={i} className="flex gap-3 py-2 border-b border-slate-800 last:border-0 text-sm">
                      <div className="flex-1"><p className="text-slate-300">{p.title}</p><span className="text-xs text-slate-500">{p.site}</span></div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-white font-medium">{p.price}</div>
                        <div className={`text-xs ${p.change.startsWith('+') ? 'text-red-400' : p.change === 'NEW' ? 'text-sky-400' : 'text-emerald-400'}`}>{p.change}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-center text-xs text-slate-700 pb-4">
          NIWA Dashboard v0.4 · 最終更新: {new Date().toLocaleString('ja-JP')}
        </div>
      </main>

      {/* 案件登録モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">{editingDeal ? '案件を編集' : '新規案件登録'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingDeal(null); resetForm() }} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">商品名 *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例: 電動車椅子 YAMAHA JWX-2" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">仕入元</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                    {['ヤフオク', 'ジモティー', 'メルカリ', 'ラクマ', 'セカンドストリート', 'その他'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ステータス</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                    {['仕入中', '輸出準備', '輸送中', '完了'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">仕入値 (¥)</label>
                  <input type="number" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} placeholder="0" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">売値 (¥)</label>
                  <input type="number" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} placeholder="0" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              {form.buy_price && form.sell_price && (
                <div className="bg-[#0f172a] rounded-lg px-3 py-2 text-sm">
                  <span className="text-slate-500">粗利: </span>
                  <span className={`font-bold ${Number(form.sell_price) - Number(form.buy_price) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ¥{(Number(form.sell_price) - Number(form.buy_price)).toLocaleString()}
                  </span>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">メモ</label>
                <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="バラさん確認済み、コンテナ待ち等" rows={2} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">URL</label>
                <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
              </div>
              <button onClick={saveDeal} disabled={!form.title || saving} className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? '保存中...' : editingDeal ? '更新する' : '登録する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// キトゥル在庫編集コンポーネント
function KithulEditor({ item, onSave, onCancel }: { item: KithulItem; onSave: (id: string, stock: number, notes: string) => void; onCancel: () => void }) {
  const [stock, setStock] = useState(String(item.stock))
  const [notes, setNotes] = useState(item.notes)
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white">{item.name}</p>
      <div className="flex gap-2">
        <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-20 bg-[#0f172a] border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-500" />
        <span className="text-sm text-slate-400 self-center">{item.unit}</span>
      </div>
      <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="メモ" className="w-full bg-[#0f172a] border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
      <div className="flex gap-2">
        <button onClick={() => onSave(item.id, Number(stock) || 0, notes)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1"><Save size={12} /> 保存</button>
        <button onClick={onCancel} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1.5 rounded transition-colors">キャンセル</button>
      </div>
    </div>
  )
}
