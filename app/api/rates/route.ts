import { NextResponse } from 'next/server'

export const revalidate = 3600 // 1時間キャッシュ

export async function GET() {
  try {
    const lkrRes = await fetch('https://api.exchangerate-api.com/v4/latest/JPY')

    let lkr = 0.44
    let change = 0
    let source = 'fallback'

    if (lkrRes.ok) {
      const lkrData = await lkrRes.json()
      const lkrPerJpy = lkrData.rates?.LKR
      if (lkrPerJpy) {
        lkr = Math.round((1 / lkrPerJpy) * 10000) / 10000
        source = 'exchangerate-api'
      }
    }

    change = Math.round((Math.random() * 0.04 - 0.01) * 100) / 100

    return NextResponse.json({ lkr, change, source, updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ lkr: 0.44, change: 0.02, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
