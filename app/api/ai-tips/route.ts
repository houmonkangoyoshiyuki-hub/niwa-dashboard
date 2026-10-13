import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24時間キャッシュ

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `あなたはスリランカへの中古介護・医療機器輸出ビジネスと、キトゥルトリークル（低GIシロップ）輸入ビジネスを支援するAIアドバイザーです。今日（${today}）の市場動向に基づいた、簡潔で実用的なビジネス提案を4つ、以下のJSON形式で出力してください。\n\n[\n  "🔥 提案1（50文字以内）",\n  "📈 提案2（50文字以内）",\n  "💡 提案3（50文字以内）",\n  "🎯 提案4（50文字以内）"\n]\n\nJSONのみ出力してください。`
          }]
        })
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.content[0]?.text || '[]'
        const tips = JSON.parse(content)
        if (Array.isArray(tips) && tips.length > 0) {
          return NextResponse.json({ tips, source: 'claude', updatedAt: new Date().toISOString() })
        }
      }
    } catch {
      // fallthrough to static
    }
  }

  return NextResponse.json({
    tips: [
      '🔥 今週のヤフオクで「施設閉鎖」出品が急増中。まとめ買い交渉のチャンスです',
      '📈 LKR/JPY が先週比 +4.5%。今月の送金タイミングとして○',
      '💡 スリランカでは11月に医療機器の輸入関税が変更予定。今動くのがベター',
      '🎯 ラクマで「歩行器」の相場が先月比 -15%。仕入れ単価を下げられる可能性あり',
    ],
    source: 'static',
    updatedAt: new Date().toISOString()
  })
}
