import type { Metadata } from 'next'
import { StatusView } from '@/components/StatusView'

export const metadata: Metadata = { title: 'Trạng thái bài gửi', robots: { index: false } }

export default function StatusPage() {
  return (
    <div className="wrap section">
      <h1>Bài bạn đã gửi</h1>
      <StatusView />
    </div>
  )
}
