import type { Metadata } from 'next'
import { requireStaff } from '@/lib/staff-page'
import { MODERATOR_ROLES } from '@/lib/staff'
import { ModerationQueue } from '@/components/staff/Queue'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Kiểm duyệt', robots: { index: false } }

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  await requireStaff('/quan-tri/kiem-duyet', MODERATOR_ROLES)
  return (
    <div className="wrap section">
      <ModerationQueue initialKind={(await searchParams).kind || ''} />
    </div>
  )
}
