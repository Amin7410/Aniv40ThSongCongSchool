import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { staff, type StaffUser } from './staff'
import type { Role } from '../access/roles'

/** Bảo vệ trang nội bộ: chưa đăng nhập → /admin/login; chưa 2FA → /mfa; sai vai trò → về trang chủ quản trị. */
export async function requireStaff(path: string, roles?: Role[]): Promise<StaffUser> {
  const h = await headers()
  const c = await staff(h, roles)
  if (c instanceof Response) {
    const j = await c.json().catch(() => ({}))
    if (c.status === 401 && j.mfa) redirect(`/mfa?next=${encodeURIComponent(path)}`)
    if (c.status === 401) redirect(`/admin/login?redirect=${encodeURIComponent(path)}`)
    redirect('/admin')
  }
  return c.user
}
