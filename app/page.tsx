'use client'

import { useState } from 'react'
import {
  Search, Package, TrendingUp, Leaf, Bell, Settings,
  ChevronRight, ExternalLink, CheckCircle2,
  Zap, BarChart3, Globe, RefreshCw, Star
} from 'lucide-react'

const mockFinds = [
  { id: 1, site: 'ヤフオク', title: '電動車椅子 YAMAHA JWX-2 動作確認済み', price: 28000, image: '🦽', status: 'new', time: '3分前', url: '#' },
  { id: 2, site: 'ジモティー', title: '介護ベッド パラマウント 電動3モーター 引取歓迎', price: 15000, image: '🛏️', status: 'new', time: '12分前', url: '#' },
  { id: 3, site: 'メルカリ', title: '手動車椅子 ミキ BAL-0 折りたたみ 美品', price: 8500, image: '🦽', status: 'new', time: '31分前', url: '#' },
  { id: 4, site: 'ラクマ', title: '歩行器 アルミ製 軽量タイプ 未使用に近い', price: 3200, image: '🚶', status: 'check', time: '1時間前', url: '#' },
  { id: 5, site: 'ヤフオク', title: '介護ベッド セット 電動2モーター マットレス付き', price: 35000, image: '🛏️', status: 'new', time: '2時間前', url: '#' },
]

const mockInventory = [
  { id: 1, name: '電動車椅子 YAMAHA', buyPrice: 22000, sellPrice: 85000, status: 'ready', buyer: 'バラさん確認済み' },
  { id: 2, name: '介護ベッド パラマウント ×2', buyPrice: 18000, sellPrice: 120000, status: 'shipping', buyer: 'コンテナ待ち' },
  { id: 3, name: '手動車椅子 ×5台', buyPrice: 35000, sellPrice: 175000, status: 'buying', buyer: '交渉中' },
  { id: 4, name: 'SpO2計 ×10個', buyPrice: 15000, sellPrice: 60000, status: 'done', buyer: '第1便 完了' },
]

const mockRates = { lkr: 0.44, change: +0.02, trend: 'up' }

const mockAiTips = [
  '🔥 今週のヤフオクで「施設閉鎖」出品が急増中。まとめ買い交渉のチャンスです',
  '📈 LKR/JPY が先週比 +4.5%。今月の送金タイミングとして○',
  '💡 スリランカでは11月に医療機器の輸入関税が変更予定。今動くのがベター',
  '🎯 ラクマで「歩行器」の相場が先月比 -15%。仕入れ単価を下げられる可能性あり',
]

const siteColors: Record<string, string> = {
  'ヤフオク':       'bg-red-500/20 text-red-400 border-red-500/30',
  'ジモティー':     'bg-green-500/20 text-green-400 border-green-500/30',
  'メルカリ':       'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'ラクマ':         'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  buying:   { label: '仕入中',   cls: 'badge badge-progress' },
  ready:    { label: '輸出準備', cls: 'badge badge-new' },
  shipping: { label: '輸送中',   cls: 'badge badge-alert' },
  done:     { label: '完了',     cls: 'badge badge-done' },
}

type Tab = 'radar' | 'inventory' | 'intel' | 'kithul'

export default function Home() {
  const [tab, setTab] = useState<Tab>('radar')
  const [aiIdx, setAiIdx] = useState(0)

  const totalProfit = mockInventory
    .filter(i => i.status === 'done')
    .reduce((s, i) => s + (i.sellPrice - i.buyPrice), 0)

  const pendingProfit = mockInventory
    .filter(i => i.status !== 'done')
    .reduce((s, i) => s + (i.sellPrice - i.buyPrice), 0)

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">

      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-sm font-bold">N</div>
            <span className="font-bold text-white tracking-wide">NIWA Dashboard</span>
            <span className="hidden sm:block text-xs text-slate-500">丹羽芳幸 ビジネス管理</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={18} className="text-slate-400 cursor-pointer hover:text-sky-400 transition-colors" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center">3</span>
            </div>
            <button className="text-slate-400 hover:text-slate-200 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '新着仕入れ候補', value: '5件', sub: '過去3時間', icon: <Zap size={16}/>, color: 'text-sky-400', glow: 'glow-blue', border: 'border-sky-500/20' },
            { label: '確定利益（累計）', value: `¥${totalProfit.toLocaleString()}`, sub: '今月', icon: <BarChart3 size={16}/>, color: 'text-emerald-400', glow: 'glow-green', border: 'border-emerald-500/20' },
            { label: '見込み利益', value: `¥${pendingProfit.toLocaleString()}`, sub: '案件進行中', icon: <TrendingUp size={16}/>, color: 'text-amber-400', glow: '', border: 'border-amber-500/20' },
            { label: 'LKR/JPY', value: `${mockRates.lkr}円`, sub: `前日比 +${mockRates.change}円 📈`, icon: <Globe size={16}/>, color: 'text-purple-400', glow: '', border: 'border-purple-500/20' },
          ].map((s, i) => (
            <div key={i} className={`bg-[#1e293b] border ${s.border} rounded-xl p-4 card-hover ${s.glow}`}>
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              <div className="text-xs text-slate-500">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Star size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-sky-400 font-medium mb-1 pulse-dot">AI提案 · 毎日更新</div>
            <p className="text-sm text-slate-200">{mockAiTips[aiIdx]}</p>
          </div>
          <button onClick={() => setAiIdx((aiIdx + 1) % mockAiTips.length)} className="text-slate-500 hover:text-sky-400 transition-colors flex-shrink-0">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="flex gap-1 bg-[#1e293b] rounded-xl p-1">
          {([
            { id: 'radar',     label: '🔍 仕入れレーダー' },
            { id: 'inventory', label: '📦 在庫・案件' },
            { id: 'intel',     label: '🌍 市場情報' },
            { id: 'kithul',    label: '🌿 キトゥル' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                tab === t.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'radar' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Search size={16} className="text-sky-400" /> 新着仕入れ候補
              </h2>
              <button className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
                <RefreshCw size={12} /> 今すぐ巡回
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['ヤフオク', 'ジモティー', 'メルカリ', 'ラクマ', 'セカンドストリート'].map(site => (
                <div key={site} className={`badge border ${siteColors[site] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                  <span className="pulse-dot" />{site}
                </div>
              ))}
            </div>
            {mockFinds.map(item => (
              <div key={item.id} className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 card-hover flex items-center gap-4">
                <div className="text-3xl flex-shrink-0">{item.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge border text-[10px] ${siteColors[item.site] || ''}`}>{item.site}</span>
                    {item.status === 'new' && <span className="badge badge-new">NEW</span>}
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium truncate">{item.title}</p>
                  <p className="text-lg font-bold text-white mt-1">¥{item.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button className="bg-sky-500 hover:bg-sky-400 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <ExternalLink size={12} /> 見る
                  </button>
                  <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors">登録</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'inventory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Package size={16} className="text-emerald-400" /> 案件一覧
              </h2>
              <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">+ 新規登録</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '進行中案件', value: `${mockInventory.filter(i=>i.status!=='done').length}件`, color: 'text-sky-400' },
                { label: '見込み利益', value: `¥${pendingProfit.toLocaleString()}`, color: 'text-amber-400' },
                { label: '確定利益',   value: `¥${totalProfit.toLocaleString()}`,   color: 'text-emerald-400' },
              ].map((s,i) => (
                <div key={i} className="bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center">
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {mockInventory.map(item => {
              const profit = item.sellPrice - item.buyPrice
              const margin = Math.round((profit / item.sellPrice) * 100)
              const st = statusLabel[item.status]
              return (
                <div key={item.id} className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={st.cls}>{st.label}</span>
                        <span className="text-xs text-slate-500">{item.buyer}</span>
                      </div>
                      <p className="font-medium text-white">{item.name}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 flex-shrink-0 mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800">
                    <div><div className="text-xs text-slate-500">仕入値</div><div className="font-medium text-slate-300">¥{item.buyPrice.toLocaleString()}</div></div>
                    <div><div className="text-xs text-slate-500">売値</div><div className="font-medium text-white">¥{item.sellPrice.toLocaleString()}</div></div>
                    <div><div className="text-xs text-slate-500">粗利</div><div className="font-bold text-emerald-400">¥{profit.toLocaleString()} <span className="text-xs font-normal text-slate-500">({margin}%)</span></div></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'intel' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Globe size={16} className="text-purple-400" /> 市場インテリジェンス
            </h2>
            <div className="bg-[#1e293b] border border-purple-500/20 rounded-xl p-4 glow-blue">
              <div className="text-xs text-purple-400 font-medium mb-3">💱 LKR/JPY 為替レート</div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold text-white">{mockRates.lkr}<span className="text-base text-slate-400">円</span></div>
                  <div className="text-xs text-emerald-400 mt-1">▲ +{mockRates.change}円 前日比</div>
                </div>
                <div className="flex-1 text-right text-xs text-slate-500">
                  <div>1 LKR = {mockRates.lkr} JPY</div>
                  <div>100 LKR = {(mockRates.lkr*100).toFixed(0)} JPY</div>
                  <div className="mt-2 text-sky-400">送金のタイミングとして○</div>
                </div>
              </div>
            </div>
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-sky-400 font-medium mb-3 pulse-dot">🤖 AIトレンド分析 · 本日更新</div>
              <div className="space-y-3">
                {mockAiTips.map((tip, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-slate-500 flex-shrink-0">0{i+1}</span>
                    <p className="text-slate-300">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium mb-3">📰 スリランカ医療・介護ニュース</div>
              {[
                { title: 'スリランカ政府、医療機器輸入関税を11月から改定へ', time: '2時間前', source: 'LankaBiz' },
                { title: '日本の中古医療機器、アジア需要が過去最高水準に', time: '昨日', source: 'Medical Tribune' },
                { title: 'コロンボ州、高齢者介護施設を新設計画 30施設', time: '3日前', source: 'Ceylon Today' },
              ].map((n, i) => (
                <div key={i} className="flex gap-3 py-3 border-b border-slate-800 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 hover:text-sky-400 cursor-pointer transition-colors">{n.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-slate-600">{n.source}</span>
                      <span className="text-xs text-slate-600">{n.time}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'kithul' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Leaf size={16} className="text-emerald-400" /> キトゥル・トリークル事業
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '在庫', value: '未登録', color: 'text-slate-400' },
                { label: '注文数（今月）', value: '0件', color: 'text-slate-400' },
                { label: '売上（今月）', value: '¥0', color: 'text-slate-400' },
                { label: '次回仕入れ', value: '未定', color: 'text-slate-400' },
              ].map((s, i) => (
                <div key={i} className="bg-[#1e293b] border border-slate-800 rounded-xl p-4">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#1e293b] border border-emerald-500/20 rounded-xl p-4 glow-green">
              <div className="text-xs text-emerald-400 font-medium mb-3">🌿 低GI市場トレンド監視</div>
              {[
                { title: '低GIシロップ Amazon新商品：メープルシロップ糖質オフ版', price: '¥1,890', change: 'NEW', site: 'Amazon' },
                { title: 'キャロブシロップ 有機 300g', price: '¥2,200', change: '-5%', site: '楽天' },
                { title: 'アガベシロップ ダイエット用', price: '¥1,650', change: '+3%', site: 'Yahoo' },
              ].map((p, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-slate-800 last:border-0 text-sm">
                  <div className="flex-1">
                    <p className="text-slate-300">{p.title}</p>
                    <span className="text-xs text-slate-500">{p.site}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white font-medium">{p.price}</div>
                    <div className={`text-xs ${p.change.startsWith('+') ? 'text-red-400' : p.change === 'NEW' ? 'text-sky-400' : 'text-emerald-400'}`}>{p.change}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-4 text-center text-slate-500">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm">注文・在庫管理は近日実装予定</p>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-700 pb-4">
          NIWA Dashboard v0.1 · 最終更新: {new Date().toLocaleString('ja-JP')}
        </div>

      </main>
    </div>
  )
}
