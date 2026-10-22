import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff } from '@/lib/staff-page'
import { MODERATOR_ROLES } from '@/lib/staff'
import { StaffDashboard } from '@/components/staff/Dashboard'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Bảng điều hành', robots: { index: false } }

export default async function StaffHome() {
  const u = await requireStaff('/quan-tri', MODERATOR_ROLES)
  const isAdmin = u.role === 'super' || u.role === 'school_admin'
  return (
    <div className="wrap section">
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Bảng điều hành</h1>
        <div className="filters">
          <Link className="btn" href="/quan-tri/kiem-duyet">Kiểm duyệt</Link>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="btn ghost" href="/admin">Trang quản trị nội dung</a>
        </div>
      </div>
      <StaffDashboard canExport={isAdmin} />
    </div>
  )
}
