import type { Metadata } from 'next'
import { MfaClient } from '@/components/MfaClient'

export const metadata: Metadata = { title: 'Xác thực hai bước', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default function MfaPage() {
  return (
    <div className="wrap section" style={{ maxWidth: 560 }}>
      <h1>Xác thực hai bước</h1>
      <MfaClient />
    </div>
  )
}
