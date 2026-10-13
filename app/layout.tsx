import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NIWA Dashboard',
  description: '丹羽芳幸 ビジネス統合管理ダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[#0f172a]">{children}</body>
    </html>
  )
}
