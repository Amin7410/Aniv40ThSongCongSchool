import 'server-only'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import config from '@payload-config'
import { mfaSatisfied } from './mfa'
import type { Role } from '../access/roles'

export type StaffUser = { id: number; email: string; name?: string; role: Role; zones?: unknown[]; _sid?: string; collection: 'users' }
export type StaffCtx = { payload: Payload; user: StaffUser; req: Partial<PayloadRequest> }

/**
 * Xác thực cho route nội bộ: đăng nhập + đã qua 2FA + đúng vai trò.
 * Trả `req` để truyền vào Local API (overrideAccess: false) — access control và hook vẫn chạy như qua REST.
 */
export async function staff(headers: Headers, roles?: Role[]): Promise<StaffCtx | Response> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  if (!user) return Response.json({ error: 'Chưa đăng nhập.' }, { status: 401 })
  if (!mfaSatisfied({ user: user as never, headers })) return Response.json({ error: 'Cần xác thực hai bước.', mfa: true }, { status: 401 })
  const u = user as unknown as StaffUser
  if (roles && !roles.includes(u.role)) return Response.json({ error: 'Không có quyền.' }, { status: 403 })
  return { payload, user: u, req: { headers, user: user as never } }
}

export const MODERATOR_ROLES: Role[] = ['super', 'school_admin', 'moderator', 'accountant']
export const ADMIN_ROLES: Role[] = ['super', 'school_admin']
