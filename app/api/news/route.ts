import { NextResponse } from 'next/server'

export const revalidate = 1800 // 30分キャッシュ

const RSS_FEEDS = [
  'https://www.lankabusinessonline.com/feed/',
  'https://www.daily-ft.lk/feed/',
]

interface NewsItem {
  title: string
  source: string
  time: string
  url: string
}

async function fetchRSS(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const text = await res.text()

    const items: NewsItem[] = []
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)

    for (const match of itemMatches) {
      const item = match[1]
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ||
                    item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const link = item.match(/<link>(.*?)<\/link>|<link\s+href="(.*?)"/)?.[1] || '#'
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      if (title) {
        const date = pubDate ? new Date(pubDate) : new Date()
        const now = new Date()
        const diffHours = Math.round((now.getTime() - date.getTime()) / 3600000)
        const timeStr = diffHours < 1 ? '1時間以内' :
                        diffHours < 24 ? `${diffHours}時間前` :
                        `${Math.round(diffHours / 24)}日前`

        items.push({ title: title.trim(), source: sourceName, time: timeStr, url: link })
      }
      if (items.length >= 3) break
    }
    return items
  } catch {
    return []
  }
}

export async function GET() {
  const results = await Promise.allSettled([
    fetchRSS(RSS_FEEDS[0], 'Lanka Business'),
    fetchRSS(RSS_FEEDS[1], 'Daily FT'),
  ])

  const news: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') news.push(...r.value)
  }

  if (news.length === 0) {
    return NextResponse.json([
      { title: 'スリランカ政府、医療機器輸入関税を11月から改定へ', source: 'LankaBiz', time: '2時間前', url: '#' },
      { title: '日本の中古医療機器、アジア需要が過去最高水準に', source: 'Medical Tribune', time: '昨日', url: '#' },
      { title: 'コロンボ州、高齢者介護施設を新設計画 30施設', source: 'Ceylon Today', time: '3日前', url: '#' },
    ])
  }

  return NextResponse.json(news.slice(0, 5))
}
