import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'
import { mfaSatisfied } from '../lib/mfa'

export const ROLES = [
  { label: 'Super Admin (THD)', value: 'super' },
  { label: 'Quản trị trường (Ban Giám hiệu)', value: 'school_admin' },
  { label: 'Biên tập viên khu', value: 'editor' },
  { label: 'Kiểm duyệt viên', value: 'moderator' },
  { label: 'Kế toán (xác nhận quỹ)', value: 'accountant' },
] as const

export type Role = (typeof ROLES)[number]['value']

type U = { id: number | string; role?: Role; zones?: Array<number | string | { id: number | string }> } | null | undefined

/**
 * Người dùng nhân viên đã xác thực ĐỦ HAI BƯỚC. Mọi quyền nghiệp vụ đi qua hàm này,
 * nên đăng nhập bằng mật khẩu mà chưa nhập mã TOTP thì không làm được gì (kể cả qua REST API).
 */
export const userOf = (req: PayloadRequest): U => (mfaSatisfied(req as never) ? (req.user as U) : null)
export const rawUserOf = (req: PayloadRequest): U => req.user as U
export const roleOf = (req: PayloadRequest): Role | undefined => userOf(req)?.role

export const isAdminRole = (r?: Role) => r === 'super' || r === 'school_admin'

export const zoneIds = (req: PayloadRequest): Array<number | string> =>
  (userOf(req)?.zones || []).map((z) => (typeof z === 'object' ? z.id : z))

export const anyone: Access = () => true
export const loggedIn: Access = ({ req }) => !!userOf(req)
export const admins: Access = ({ req }) => isAdminRole(roleOf(req))
export const superOnly: Access = ({ req }) => roleOf(req) === 'super'
export const adminsField: FieldAccess = ({ req }) => isAdminRole(roleOf(req))

/** Nội dung trưng bày: admin toàn quyền; biên tập viên chỉ trong các khu được giao (thực thi ở server). */
export const exhibitsWrite: Access = ({ req }) => {
  const r = roleOf(req)
  if (isAdminRole(r)) return true
  if (r === 'editor') {
    const ids = zoneIds(req)
    if (!ids.length) return false
    return { zone: { in: ids } } as Where
  }
  return false
}

/** Đọc công khai chỉ bản đã xuất bản; người đăng nhập đọc cả bản nháp. */
export const publishedOrLoggedIn: Access = ({ req }) =>
  userOf(req) ? true : ({ _status: { equals: 'published' } } as Where)

/** Hàng chờ UGC: kiểm duyệt viên và admin; kế toán chỉ thấy báo đóng góp. */
export const submissionsStaff: Access = ({ req }) => {
  const r = roleOf(req)
  if (isAdminRole(r) || r === 'moderator') return true
  if (r === 'accountant') return { kind: { equals: 'donation' } } as Where
  return false
}
