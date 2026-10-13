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
  // 拡張フィールド（叔父さん提案・v0.9）
  buyer_type?: 'personal' | 'business'   // 個人 or 業務
  ordered_at?: string                     // 受注日
  delivered_at?: string                   // 納品日
  cost_estimate?: number                  // 見積コスト
  cost_actual?: number                    // 実際コスト
  irregular?: boolean                     // イレギュラー発生
  irregular_note?: string                 // イレギュラー内容
  claim?: boolean                         // クレーム発生
  claim_note?: string                     // クレーム内容
  sell_price_lkr?: number                 // スリランカ実売値(LKR)
  photo_url?: string                      // 販売サイト用写真URL
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
// regulation: 'clear'=問題なし(ClassA), 'check'=要確認, 'warn'=規制リスク高
const mockFinds = [
  { id: 1, site: 'ヤフオク', title: '電動車椅子 YAMAHA JWX-2 動作確認済み', price: 28000, image: '🦽', status: 'new', time: '3分前', url: 'https://auctions.yahoo.co.jp/search/search?p=%E9%9B%BB%E5%8B%95%E8%BB%8A%E6%A4%85%E5%AD%90+%E5%8F%A4%E7%89%A9', estimatedSell: 85000, margin: 57000, regulation: 'check' as const, regNote: '電動→NMRA確認推奨' },
  { id: 2, site: 'ジモティー', title: '介護ベッド パラマウント 電動3モーター 引取歓迎', price: 15000, image: '🛏️', status: 'new', time: '12分前', url: 'https://jmty.jp/all/sale/article-medicalequip?keyword=%E4%BB%8B%E8%AD%B7%E3%83%99%E3%83%83%E3%83%89', estimatedSell: 45000, margin: 30000, regulation: 'check' as const, regNote: '電動→NMRA確認推奨' },
  { id: 3, site: 'メルカリ', title: '手動車椅子 ミキ BAL-0 折りたたみ 美品', price: 8500, image: '🦽', status: 'new', time: '31分前', url: 'https://jp.mercari.com/search?keyword=%E8%BB%8A%E6%A4%85%E5%AD%90+%E6%8A%98%E3%82%8A%E3%81%9F%E3%81%9F%E3%81%BF&category_id=5', estimatedSell: 22000, margin: 13500, regulation: 'clear' as const, regNote: '手動ClassA・比較的クリア' },
  { id: 4, site: 'ラクマ', title: '歩行器 アルミ製 軽量タイプ 未使用に近い', price: 3200, image: '🚶', status: 'check', time: '1時間前', url: 'https://fril.jp/search?search%5Bkeyword%5D=%E6%AD%A9%E8%A1%8C%E5%99%A8&search%5Border%5D=created_at_desc', estimatedSell: 9000, margin: 5800, regulation: 'clear' as const, regNote: '雑品扱いの可能性あり' },
  { id: 5, site: 'ヤフオク', title: '介護ベッド セット 電動2モーター マットレス付き', price: 35000, image: '🛏️', status: 'new', time: '2時間前', url: 'https://auctions.yahoo.co.jp/search/search?p=%E4%BB%8B%E8%AD%B7%E3%83%99%E3%83%83%E3%83%89+%E9%9B%BB%E5%8B%95', estimatedSell: 98000, margin: 63000, regulation: 'warn' as const, regNote: '電動大型→NMRA登録必須の可能性' },
  { id: 6, site: 'ジモティー', title: '手動車椅子 カワムラサイクル KR-3 自走式', price: 5500, image: '🦽', status: 'new', time: '45分前', url: 'https://jmty.jp/all/sale/article-medicalequip?keyword=%E8%BB%8A%E6%A4%85%E5%AD%90', estimatedSell: 18000, margin: 12500, regulation: 'clear' as const, regNote: '手動ClassA・比較的クリア' },
  { id: 7, site: 'セカンドストリート', title: 'シャワーチェア 折りたたみ ほぼ未使用', price: 1800, image: '🪑', status: 'new', time: '2時間前', url: 'https://www.2ndstreet.jp/search/result/?search_word=%E4%BB%8B%E8%AD%B7%E7%94%A8%E5%93%81', estimatedSell: 6000, margin: 4200, regulation: 'clear' as const, regNote: '雑品扱い・規制対象外の可能性高' },
]

// 巡回サイト定義（「今すぐ巡回」で開くURL）
const PATROL_SITES = [
  { name: 'ヤフオク', url: 'https://auctions.yahoo.co.jp/search/search?p=%E9%9B%BB%E5%8B%95%E8%BB%8A%E6%A4%85%E5%AD%90+OR+%E4%BB%8B%E8%AD%B7%E3%83%99%E3%83%83%E3%83%89+OR+%E6%AD%A9%E8%A1%8C%E5%99%A8&order=1' },
  { name: 'ジモティー', url: 'https://jmty.jp/all/sale/article-medicalequip' },
  { name: 'メルカリ', url: 'https://jp.mercari.com/search?keyword=%E8%BB%8A%E6%A4%85%E5%AD%90+OR+%E4%BB%8B%E8%AD%B7%E3%83%99%E3%83%83%E3%83%89&order=created_time&sort=desc' },
  { name: 'ラクマ', url: 'https://fril.jp/search?search%5Bkeyword%5D=%E4%BB%8B%E8%AD%B7%E7%94%A8%E5%93%81&search%5Border%5D=created_at_desc' },
  { name: 'セカンドストリート', url: 'https://www.2ndstreet.jp/search/result/?search_word=%E4%BB%8B%E8%AD%B7' },
]

const siteColors: Record<string, string> = {
  'ヤフオク':        'bg-red-500/20 text-red-400 border-red-500/30',
  'ジモティー':      'bg-green-500/20 text-green-400 border-green-500/30',
  'メルカリ':        'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'ラクマ':          'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'セカンドストリート': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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

type Tab = 'radar' | 'inventory' | 'intel' | 'kithul' | 'export' | 'settings' | 'notifications'
type PrevTab = 'radar' | 'inventory' | 'intel' | 'kithul' | 'export'

// ===== コスト設定のデフォルト値 =====
const DEFAULT_COSTS = {
  domesticShipping: 3000,   // 国内輸送費（円/件）
  seaFreight: 8000,         // 船代・コンテナ按分（円/件）
  customsDutyPct: 10,       // スリランカ関税（売値の%）
  vatPct: 18,               // スリランカVAT（売値の%）
  palPct: 10,               // 港湾・空港開発税（売値の%）
  sscl: 2.5,                // 社会保障賦課金（売値の%）
  platformFeePct: 10,       // ヤフオク等手数料（仕入値の%）
  targetMarginPct: 30,      // 目標利益率（%）
  scenario: 'standard' as 'optimistic' | 'standard' | 'pessimistic',
}

// シナリオ別の課税率プリセット（関税+VAT+PAL+SSCLの合計）
const SCENARIOS = {
  optimistic:  { label: '楽観', desc: '関税免除・VAT軽減あり', totalTaxPct: 20, color: 'text-emerald-400' },
  standard:    { label: '標準', desc: '関税10%+VAT18%+PAL10%+SSCL2.5%', totalTaxPct: 40, color: 'text-amber-400' },
  pessimistic: { label: '悲観', desc: 'フル課税+追加Cess', totalTaxPct: 50, color: 'text-red-400' },
}

// ===== コスト計算 =====
function calcExport(buyPrice: number, costs: typeof DEFAULT_COSTS) {
  const platformFee = Math.round(buyPrice * costs.platformFeePct / 100)
  const fixedCosts = costs.domesticShipping + costs.seaFreight + platformFee
  const taxRate = SCENARIOS[costs.scenario].totalTaxPct / 100
  // 売値 × (1 - 総税率 - 目標利益率) = fixedCosts + buyPrice
  const divisor = 1 - taxRate - (costs.targetMarginPct / 100)
  const recommendedSell = divisor > 0 ? Math.ceil((fixedCosts + buyPrice) / divisor / 1000) * 1000 : buyPrice * 5
  const totalTax = Math.round(recommendedSell * taxRate)
  const netProfit = recommendedSell - totalTax - fixedCosts - buyPrice
  const actualMargin = recommendedSell > 0 ? Math.round((netProfit / recommendedSell) * 100) : 0
  return { recommendedSell, netProfit, actualMargin, fixedCosts, totalTax, platformFee, taxRate }
}

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
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: `${d.getMonth() + 1}月`, year: d.getFullYear(), month: d.getMonth() }
  })
  // 粗利から固定コスト(¥11,000)と課税(標準40%)を差し引いた手取り近似
  const netApprox = (d: Deal) => {
    const fixedCost = 11000 + Math.round(d.buy_price * 0.1)
    const tax = Math.round(d.sell_price * 0.4)
    return d.sell_price - tax - fixedCost - d.buy_price
  }
  const data = months.map(m => {
    const inMonth = (d: Deal) => {
      const dt = new Date(d.created_at)
      return dt.getFullYear() === m.year && dt.getMonth() === m.month
    }
    const confirmed = deals.filter(d => (d.status === '完了' || d.status === 'done') && d.created_at && inMonth(d))
      .reduce((s, d) => s + Math.max(0, netApprox(d)), 0)
    const pending = deals.filter(d => d.status !== '完了' && d.status !== 'done' && d.created_at && inMonth(d))
      .reduce((s, d) => s + Math.max(0, netApprox(d)), 0)
    return { ...m, confirmed, pending }
  })
  const maxP = Math.max(...data.map(d => d.confirmed + d.pending), 1)
  const barW = 28, gap = 8, totalW = (barW + gap) * 6 - gap, svgH = 80

  return (
    <div>
      <div className="flex items-center gap-3 text-[10px] mb-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"/>確定利益</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block"/>見込み利益</span>
        <span className="text-slate-600 ml-auto">※手取り概算</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${totalW} ${svgH + 20}`} style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const confH = d.confirmed > 0 ? Math.max(3, (d.confirmed / maxP) * svgH) : 0
          const pendH = d.pending > 0 ? Math.max(3, (d.pending / maxP) * svgH) : 0
          const totalH = confH + pendH || 2
          const x = i * (barW + gap)
          const total = d.confirmed + d.pending
          return (
            <g key={i}>
              {/* 見込み（上） */}
              {pendH > 0 && <rect x={x} y={svgH - totalH} width={barW} height={pendH} rx={pendH === totalH ? 4 : 0} fill="#fbbf24" />}
              {/* 確定（下） */}
              {confH > 0 && <rect x={x} y={svgH - confH} width={barW} height={confH} rx={4} fill="#34d399" />}
              {/* 空バー */}
              {totalH === 2 && <rect x={x} y={svgH - 2} width={barW} height={2} rx={1} fill="#334155" />}
              <text x={x + barW / 2} y={svgH + 14} textAnchor="middle" fill="#64748b" fontSize="9">{d.label}</text>
              {total > 0 && (
                <text x={x + barW / 2} y={svgH - totalH - 4} textAnchor="middle" fill={d.confirmed > 0 ? '#34d399' : '#fbbf24'} fontSize="8">
                  {total >= 10000 ? `${Math.round(total / 1000)}k` : total}
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
  const [costs, setCosts] = useState(DEFAULT_COSTS)

  // 案件
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [registerItem, setRegisterItem] = useState<typeof mockFinds[0] | null>(null)
  const [registerSell, setRegisterSell] = useState('')
  const [form, setForm] = useState({ title: '', source: 'ヤフオク', buy_price: '', sell_price: '', status: '仕入中', memo: '', url: '',
    buyer_type: 'personal' as 'personal' | 'business',
    ordered_at: '', delivered_at: '',
    cost_estimate: '', cost_actual: '',
    irregular: false, irregular_note: '',
    claim: false, claim_note: '',
    sell_price_lkr: '', photo_url: '',
  })

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

  // 販売ページ生成
  const [exportForm, setExportForm] = useState({
    imageUrl: '',
    titleJa: '',
    descJa: '',
    priceJpy: '',
    condition: '良好',
    route: 'personal' as 'personal' | 'bulk',
    bulkMin: '3',
  })
  const [exportResult, setExportResult] = useState<{ title: string; desc: string; post: string } | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ===== 翻訳（Google翻訳 無料エンドポイント） =====
  const translateToEn = async (text: string): Promise<string> => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`
      const res = await fetch(url)
      const data = await res.json()
      return data[0].map((d: [string]) => d[0]).join('')
    } catch {
      return text
    }
  }

  const generateExportPost = async () => {
    setExportLoading(true)
    setExportResult(null)
    try {
      const [titleEn, descEn] = await Promise.all([
        translateToEn(exportForm.titleJa),
        translateToEn(exportForm.descJa),
      ])
      const priceJpy = Number(exportForm.priceJpy) || 0
      const priceLkr = Math.round(priceJpy / (rates.lkr || 0.44))
      const conditionEn: Record<string, string> = { '新品同様': 'Like New', '良好': 'Good Condition', '使用感あり': 'Used - Fair', 'ジャンク': 'For Parts' }
      const cond = conditionEn[exportForm.condition] || 'Good Condition'

      let post = ''
      if (exportForm.route === 'personal') {
        post = `🇯🇵 Japanese Quality Medical Equipment for Sale! 🇯🇵

📦 ${titleEn}
✅ Condition: ${cond}
💴 Price: LKR ${priceLkr.toLocaleString()} (¥${priceJpy.toLocaleString()})

${descEn}

🌟 WHY BUY JAPANESE?
• Strict quality standards
• Long-lasting durability
• Hard to find in Sri Lanka

📩 DM to order | Delivery within 4-6 weeks
#JapaneseMedicalEquipment #SriLanka #MedicalEquipment #Japan`
      } else {
        post = `🏥 Bulk Order Available – Japanese Medical Equipment 🏥

📦 ${titleEn}
✅ Condition: ${cond}
💴 Unit Price: LKR ${priceLkr.toLocaleString()} / ¥${priceJpy.toLocaleString()}
📦 Minimum Order: ${exportForm.bulkMin} units

${descEn}

✈️ Direct import from Japan
⏱ Lead time: 4-6 weeks after order confirmation
📋 Bulk discount available for ${Number(exportForm.bulkMin) * 2}+ units

📩 Contact for quotation
#MedicalEquipmentSriLanka #BulkOrder #JapanImport #Healthcare`
      }

      setExportResult({ title: titleEn, desc: descEn, post })
    } finally {
      setExportLoading(false)
    }
  }

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
  const resetForm = () => setForm({ title: '', source: 'ヤフオク', buy_price: '', sell_price: '', status: '仕入中', memo: '', url: '',
    buyer_type: 'personal', ordered_at: '', delivered_at: '',
    cost_estimate: '', cost_actual: '',
    irregular: false, irregular_note: '',
    claim: false, claim_note: '',
    sell_price_lkr: '', photo_url: '',
  })

  const saveDeal = async () => {
    if (!form.title) return
    setSaving(true)
    const payload = {
      title: form.title, source: form.source,
      buy_price: Number(form.buy_price) || 0, sell_price: Number(form.sell_price) || 0,
      status: form.status, memo: form.memo, url: form.url,
      buyer_type: form.buyer_type,
      ordered_at: form.ordered_at || null,
      delivered_at: form.delivered_at || null,
      cost_estimate: Number(form.cost_estimate) || 0,
      cost_actual: Number(form.cost_actual) || 0,
      irregular: form.irregular,
      irregular_note: form.irregular_note,
      claim: form.claim,
      claim_note: form.claim_note,
      sell_price_lkr: Number(form.sell_price_lkr) || 0,
      photo_url: form.photo_url,
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
    setForm({ title: deal.title, source: deal.source || 'ヤフオク', buy_price: String(deal.buy_price), sell_price: String(deal.sell_price), status: deal.status, memo: deal.memo || '', url: deal.url || '',
      buyer_type: deal.buyer_type || 'personal',
      ordered_at: deal.ordered_at ? deal.ordered_at.slice(0, 10) : '',
      delivered_at: deal.delivered_at ? deal.delivered_at.slice(0, 10) : '',
      cost_estimate: String(deal.cost_estimate || ''),
      cost_actual: String(deal.cost_actual || ''),
      irregular: deal.irregular || false,
      irregular_note: deal.irregular_note || '',
      claim: deal.claim || false,
      claim_note: deal.claim_note || '',
      sell_price_lkr: String(deal.sell_price_lkr || ''),
      photo_url: deal.photo_url || '',
    })
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

            {/* 利益計算シナリオ */}
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium text-white">📊 利益計算シナリオ</div>
              <div className="text-xs text-slate-500 mb-2">スリランカ側の課税状況に応じて切り替え。全計算に即反映されます。</div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map(key => (
                  <button
                    key={key}
                    onClick={() => setCosts(prev => ({ ...prev, scenario: key }))}
                    className={`rounded-xl p-3 border text-left transition-all ${costs.scenario === key
                      ? key === 'optimistic' ? 'border-emerald-500 bg-emerald-500/10'
                        : key === 'standard' ? 'border-amber-500 bg-amber-500/10'
                        : 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 bg-slate-800/50 opacity-60'}`}
                  >
                    <div className={`text-sm font-bold ${SCENARIOS[key].color}`}>{SCENARIOS[key].label}</div>
                    <div className={`text-lg font-black mt-0.5 ${SCENARIOS[key].color}`}>{SCENARIOS[key].totalTaxPct}%</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-tight">{SCENARIOS[key].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* コスト変数 */}
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium text-white">⚙️ 固定コスト設定</div>
              {[
                { key: 'domesticShipping' as const, label: '国内輸送費（円）', unit: '¥' },
                { key: 'seaFreight' as const, label: '船代・コンテナ按分（円）', unit: '¥' },
                { key: 'platformFeePct' as const, label: 'ヤフオク等手数料', unit: '%' },
                { key: 'targetMarginPct' as const, label: '目標利益率', unit: '%' },
              ].map(({ key, label, unit }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-1 text-xs text-slate-400">{label}</div>
                  <div className="flex items-center gap-1 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-slate-500">{unit}</span>
                    <input
                      type="number"
                      value={costs[key]}
                      onChange={e => setCosts(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-20 bg-transparent text-sm text-white text-right focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* その他設定 */}
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl divide-y divide-slate-800">
              {[
                { label: 'アカウント', desc: '丹羽芳幸 / houmon.kango.yoshiyuki@gmail.com', icon: '👤' },
                { label: '為替レート更新', desc: 'LKR/JPY レートを毎時自動取得（exchangerate-api）', icon: '💱', toggle: true },
                { label: 'AI提案通知', desc: 'Claude Haiku による毎日自動生成', icon: '🤖', toggle: true },
                { label: 'レーダー巡回間隔', desc: '30分ごとに自動スキャン（GitHub Actions）', icon: '🔍' },
                { label: 'バージョン', desc: 'NIWA Dashboard v0.5 · シナリオ計算・規制フラグ対応', icon: 'ℹ️' },
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
                { id: 'radar',     label: '🔍 仕入れ' },
                { id: 'inventory', label: '📦 案件' },
                { id: 'intel',     label: '🌍 市場' },
                { id: 'kithul',    label: '🌿 キトゥル' },
                { id: 'export',    label: '🌐 販売' },
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
                  <button onClick={async () => {
                    setRadarScanning(true)
                    PATROL_SITES.forEach(s => window.open(s.url, '_blank'))
                    await new Promise(r => setTimeout(r, 2000))
                    setRadarScanning(false)
                  }} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 border border-sky-500/30 bg-sky-500/10 px-2 py-1 rounded-lg transition-colors">
                    <RefreshCw size={12} className={radarScanning ? 'animate-spin' : ''} /> {radarScanning ? '巡回中...' : '今すぐ巡回 ↗'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PATROL_SITES.map(site => (
                    <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
                      className={`badge border cursor-pointer hover:opacity-80 transition-opacity ${siteColors[site.name] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      <span className="pulse-dot" />{site.name}
                    </a>
                  ))}
                </div>

                {mockFinds.map(item => {
                  const est = findEstimates[item.id]
                  const calc = calcExport(item.price, costs)
                  const sellVal = est?.sell ? Number(est.sell) : calc.recommendedSell
                  // 表示用：入力売値でのコスト再計算
                  const totalTaxManual = Math.round(sellVal * calc.taxRate)
                  const netProfit = sellVal - totalTaxManual - calc.fixedCosts - item.price
                  const marginPct = sellVal > 0 ? Math.round((netProfit / sellVal) * 100) : 0
                  const marginColor = marginPct >= costs.targetMarginPct ? 'text-emerald-400' : marginPct >= 20 ? 'text-amber-400' : 'text-red-400'
                  const regColors = { clear: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', check: 'text-amber-400 border-amber-500/40 bg-amber-500/10', warn: 'text-red-400 border-red-500/40 bg-red-500/10' }
                  const regIcons = { clear: '🟢', check: '🟡', warn: '🔴' }
                  const isOpen = expandedFind === item.id

                  return (
                    <div key={item.id} className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden card-hover">
                      {/* メイン行 */}
                      <div className="flex items-center gap-4 p-4">
                        <div className="text-3xl flex-shrink-0">{item.image}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`badge border text-[10px] ${siteColors[item.site] || ''}`}>{item.site}</span>
                            {item.status === 'new' && <span className="badge badge-new">NEW</span>}
                            <span className={`badge border text-[10px] ${regColors[item.regulation]}`} title={item.regNote}>{regIcons[item.regulation]} 規制{item.regulation === 'clear' ? 'OK' : item.regulation === 'check' ? '要確認' : '要注意'}</span>
                            <span className="text-xs text-slate-500">{item.time}</span>
                          </div>
                          <p className="text-sm text-slate-200 font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-slate-400">仕入¥{item.price.toLocaleString()}</p>
                            <span className="text-xs text-slate-600">→</span>
                            <p className="text-sm text-sky-400">推奨売¥{calc.recommendedSell.toLocaleString()}</p>
                            <span className="text-xs text-slate-600">→</span>
                            <p className={`text-sm font-bold ${marginColor}`}>手取+¥{calc.netProfit.toLocaleString()}<span className="text-xs font-normal text-slate-500 ml-1">({calc.actualMargin}%)</span></p>
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
                          <div className="text-xs text-sky-400 font-medium">📋 コスト内訳 · 売値を変えると自動計算</div>
                          {/* コスト内訳 */}
                          <div className="bg-[#0f172a] rounded-lg p-3 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-500"><span>仕入値</span><span className="text-white">¥{item.price.toLocaleString()}</span></div>
                            <div className="flex justify-between text-slate-500"><span>手数料（{costs.platformFeePct}%）</span><span>-¥{calc.platformFee.toLocaleString()}</span></div>
                            <div className="flex justify-between text-slate-500"><span>国内輸送</span><span>-¥{costs.domesticShipping.toLocaleString()}</span></div>
                            <div className="flex justify-between text-slate-500"><span>船代・コンテナ按分</span><span>-¥{costs.seaFreight.toLocaleString()}</span></div>
                            <div className="flex justify-between text-slate-500">
                              <span>現地諸税（{SCENARIOS[costs.scenario].totalTaxPct}%）<span className={`ml-1 ${SCENARIOS[costs.scenario].color}`}>[{SCENARIOS[costs.scenario].label}]</span></span>
                              <span>-¥{totalTaxManual.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold"><span className="text-slate-300">手取り利益</span><span className={marginColor}>¥{netProfit.toLocaleString()}（{marginPct}%）</span></div>
                          </div>
                          {/* 売値編集 */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="text-xs text-slate-500 mb-1">売値（変更可）</div>
                              <input
                                type="number"
                                value={est?.sell ?? calc.recommendedSell}
                                onChange={e => setFindEstimates(prev => ({ ...prev, [item.id]: { ...prev[item.id], sell: e.target.value } }))}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-sky-500"
                              />
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-slate-500 mb-1">目標利益率</div>
                              <div className="text-sm font-bold text-sky-400">{costs.targetMarginPct}%</div>
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
                                const sell = est?.sell ? Number(est.sell) : calc.recommendedSell
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

                {/* コンテナ積載シミュレーター */}
                {(() => {
                  // 商品カテゴリ別の容積（m³）推定
                  const volMap: Record<string, number> = {
                    '電動車椅子': 0.35, '手動車椅子': 0.20, '介護ベッド': 1.20, '歩行器': 0.10,
                  }
                  const getVol = (title: string) => {
                    if (title.includes('電動車椅子') || title.includes('電動')) return volMap['電動車椅子']
                    if (title.includes('車椅子') || title.includes('車いす')) return volMap['手動車椅子']
                    if (title.includes('介護ベッド') || title.includes('ベッド')) return volMap['介護ベッド']
                    if (title.includes('歩行器')) return volMap['歩行器']
                    return 0.25 // デフォルト
                  }
                  const CONTAINER_VOL = 28 // 20フィートコンテナ有効容積(m³)
                  const activeDeals = deals.filter(d => d.status !== '完了' && d.status !== 'done')
                  const usedVol = activeDeals.reduce((s, d) => s + getVol(d.title), 0)
                  const usedPct = Math.min(100, Math.round((usedVol / CONTAINER_VOL) * 100))
                  const remainVol = Math.max(0, CONTAINER_VOL - usedVol)
                  const segW = 200
                  const filledW = Math.round((usedPct / 100) * segW)
                  return (
                    <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-white">🚢 コンテナ積載シミュレーター</div>
                        <div className="text-xs text-slate-500">20フィート（{CONTAINER_VOL}m³）</div>
                      </div>
                      {/* プログレスバー */}
                      <div className="relative h-6 bg-slate-800 rounded-lg overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-lg transition-all ${usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-sky-500'}`}
                          style={{ width: `${usedPct}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{usedPct}% 使用</div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                        <div className="text-center">
                          <div className="text-slate-500">使用済み</div>
                          <div className="text-sky-400 font-bold">{usedVol.toFixed(1)}m³</div>
                          <div className="text-slate-600">{activeDeals.length}件</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-500">残り容積</div>
                          <div className={`font-bold ${remainVol < 5 ? 'text-red-400' : 'text-emerald-400'}`}>{remainVol.toFixed(1)}m³</div>
                          <div className="text-slate-600">約{Math.floor(remainVol / 0.2)}台分※</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-500">輸送タイミング</div>
                          <div className={`font-bold ${usedPct >= 70 ? 'text-emerald-400' : usedPct >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {usedPct >= 70 ? '🟢 GO' : usedPct >= 40 ? '🟡 準備中' : '🔴 積載待ち'}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-2">※手動車椅子0.2m³換算。電動車椅子0.35m³・介護ベッド1.2m³・歩行器0.1m³</div>
                    </div>
                  )
                })()}

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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={st.cls}>{st.label}</span>
                            {item.source && <span className={`badge border text-[10px] ${siteColors[item.source] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>{item.source}</span>}
                            {item.buyer_type === 'business' && <span className="badge border text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30">🏥 業務</span>}
                            {item.irregular && <span className="badge border text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">⚠️ イレギュラー</span>}
                            {item.claim && <span className="badge border text-[10px] bg-red-500/20 text-red-400 border-red-500/30">🚨 クレーム</span>}
                          </div>
                          <p className="font-medium text-white">{item.title}</p>
                          {item.memo && <p className="text-xs text-slate-500 mt-1">{item.memo}</p>}
                          {item.ordered_at && item.delivered_at && (
                            <p className="text-xs text-slate-500 mt-1">
                              リードタイム: {Math.round((new Date(item.delivered_at).getTime() - new Date(item.ordered_at).getTime()) / (1000*60*60*24))}日
                            </p>
                          )}
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

            {/* 販売ページ生成タブ */}
            {tab === 'export' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-white flex items-center gap-2"><Globe size={16} className="text-sky-400" />スリランカ向け販売ページ生成</h2>

                {/* ルート選択 */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'personal', label: '👤 個人販売ルート', desc: 'Facebook/個人向け' },
                    { key: 'bulk',     label: '🏥 バラ姉まとめ発注', desc: 'ロット・法人向け' },
                  ] as const).map(r => (
                    <button key={r.key} onClick={() => setExportForm(f => ({ ...f, route: r.key }))}
                      className={`p-3 rounded-xl border text-left transition-all ${exportForm.route === r.key ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-[#1e293b]'}`}>
                      <div className="text-sm font-medium text-white">{r.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>

                {/* 商品情報入力 */}
                <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs text-sky-400 font-medium">📝 商品情報（日本語で入力）</div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">画像URL（ヤフオク等の画像リンク）</label>
                    <input type="url" value={exportForm.imageUrl} onChange={e => setExportForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                    {exportForm.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={exportForm.imageUrl} alt="preview" className="mt-2 w-full max-h-40 object-contain rounded-lg bg-slate-900" onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">商品名（日本語）</label>
                    <input type="text" value={exportForm.titleJa} onChange={e => setExportForm(f => ({ ...f, titleJa: e.target.value }))}
                      placeholder="例: 電動車椅子 YAMAHA JWX-2 動作良好" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">説明（日本語）</label>
                    <textarea value={exportForm.descJa} onChange={e => setExportForm(f => ({ ...f, descJa: e.target.value }))} rows={3}
                      placeholder="例: 使用回数少なく状態は良好です。折りたたみ可能で収納・輸送に便利です。" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">販売価格（円）</label>
                      <input type="number" value={exportForm.priceJpy} onChange={e => setExportForm(f => ({ ...f, priceJpy: e.target.value }))}
                        placeholder="85000" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                      {exportForm.priceJpy && <div className="text-xs text-amber-400 mt-1">≈ LKR {Math.round(Number(exportForm.priceJpy) / (rates.lkr || 0.44)).toLocaleString()}</div>}
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">状態</label>
                      <select value={exportForm.condition} onChange={e => setExportForm(f => ({ ...f, condition: e.target.value }))}
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500">
                        {['新品同様', '良好', '使用感あり', 'ジャンク'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {exportForm.route === 'bulk' && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">最低発注数（台）</label>
                      <input type="number" value={exportForm.bulkMin} onChange={e => setExportForm(f => ({ ...f, bulkMin: e.target.value }))}
                        className="w-32 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                    </div>
                  )}

                  <button onClick={generateExportPost} disabled={!exportForm.titleJa || exportLoading}
                    className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                    {exportLoading ? <><RefreshCw size={16} className="animate-spin" /> 翻訳中...</> : <><Globe size={16} /> 英語投稿文を生成</>}
                  </button>
                </div>

                {/* 生成結果 */}
                {exportResult && (
                  <div className="bg-[#1e293b] border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-emerald-400 font-medium">✅ 生成完了 · Facebook投稿用</div>
                      <button onClick={() => {
                        navigator.clipboard.writeText(exportResult.post)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }} className={`text-xs px-3 py-1 rounded-lg transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                        {copied ? '✓ コピー済み' : 'コピー'}
                      </button>
                    </div>
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans bg-[#0f172a] rounded-lg p-3 leading-relaxed">{exportResult.post}</pre>
                    <div className="text-xs text-slate-500">
                      ※ 為替レート: ¥1 ≈ LKR {(1 / (rates.lkr || 0.44)).toFixed(1)} · 翻訳はGoogle翻訳を使用
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="text-center text-xs text-slate-700 pb-4">
          NIWA Dashboard v0.9 · 最終更新: {new Date().toLocaleString('ja-JP')}
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

              {/* ===== 拡張フィールド（叔父さん提案） ===== */}
              <div className="border-t border-slate-700 pt-3">
                <div className="text-xs text-sky-400 font-medium mb-2">📊 販売実績データ</div>

                {/* 利用区分 */}
                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">利用区分</label>
                  <div className="flex gap-2">
                    {([['personal','👤 個人'], ['business','🏥 業務']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setForm(f => ({ ...f, buyer_type: v }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${form.buyer_type === v ? 'bg-sky-500 text-white' : 'bg-[#0f172a] border border-slate-700 text-slate-400'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 受注日・納品日 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">受注日</label>
                    <input type="date" value={form.ordered_at} onChange={e => setForm(f => ({ ...f, ordered_at: e.target.value }))} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">納品日</label>
                    <input type="date" value={form.delivered_at} onChange={e => setForm(f => ({ ...f, delivered_at: e.target.value }))} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                  </div>
                </div>

                {/* コスト予実 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">コスト見積 (¥)</label>
                    <input type="number" value={form.cost_estimate} onChange={e => setForm(f => ({ ...f, cost_estimate: e.target.value }))} placeholder="11000" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">コスト実績 (¥)</label>
                    <input type="number" value={form.cost_actual} onChange={e => setForm(f => ({ ...f, cost_actual: e.target.value }))} placeholder="0" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                  </div>
                </div>
                {form.cost_estimate && form.cost_actual && (
                  <div className="bg-[#0f172a] rounded px-3 py-1.5 text-xs mb-3">
                    <span className="text-slate-500">予実差: </span>
                    <span className={`font-bold ${Number(form.cost_actual) <= Number(form.cost_estimate) ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Number(form.cost_actual) <= Number(form.cost_estimate) ? '▼' : '▲'}¥{Math.abs(Number(form.cost_actual) - Number(form.cost_estimate)).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* スリランカ実売値 */}
                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">スリランカ実売値 (LKR)</label>
                  <input type="number" value={form.sell_price_lkr} onChange={e => setForm(f => ({ ...f, sell_price_lkr: e.target.value }))} placeholder="0" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                </div>

                {/* 写真URL */}
                <div className="mb-3">
                  <label className="text-xs text-slate-400 mb-1 block">販売写真URL</label>
                  <input type="url" value={form.photo_url} onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500" />
                </div>

                {/* イレギュラー */}
                <div className="mb-2">
                  <label className="flex items-center gap-2 cursor-pointer mb-1">
                    <input type="checkbox" checked={form.irregular} onChange={e => setForm(f => ({ ...f, irregular: e.target.checked }))} className="rounded" />
                    <span className="text-xs text-amber-400">⚠️ イレギュラー発生</span>
                  </label>
                  {form.irregular && (
                    <input type="text" value={form.irregular_note} onChange={e => setForm(f => ({ ...f, irregular_note: e.target.value }))} placeholder="例: 通関で1週間遅延" className="w-full bg-[#0f172a] border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400" />
                  )}
                </div>

                {/* クレーム */}
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer mb-1">
                    <input type="checkbox" checked={form.claim} onChange={e => setForm(f => ({ ...f, claim: e.target.checked }))} className="rounded" />
                    <span className="text-xs text-red-400">🚨 クレーム発生</span>
                  </label>
                  {form.claim && (
                    <input type="text" value={form.claim_note} onChange={e => setForm(f => ({ ...f, claim_note: e.target.value }))} placeholder="例: 電動部分が動かないとの連絡" className="w-full bg-[#0f172a] border border-red-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-400" />
                  )}
                </div>
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
