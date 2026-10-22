import type { CollectionConfig } from 'payload'
import { ROLES, admins, isAdminRole, rawUserOf, roleOf, userOf } from '../access/roles'
import { auditAfterChange, auditAfterDelete, writeAudit } from '../hooks/audit'
import { ipHash } from '../lib/security'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Tài khoản', plural: 'Tài khoản quản trị' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role', 'zones'], group: 'Hệ thống' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: { sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // Đọc hồ sơ của chính mình được phép ngay sau bước 1 (để trang /mfa biết ai đang đăng nhập);
    // mọi thao tác khác cần đủ hai bước.
    read: ({ req }) => (isAdminRole(roleOf(req)) ? true : rawUserOf(req) ? { id: { equals: rawUserOf(req)!.id } } : false),
    create: admins,
    update: ({ req }) => (isAdminRole(roleOf(req)) ? true : userOf(req) ? { id: { equals: userOf(req)!.id } } : false),
    delete: admins,
    admin: ({ req }) => !!userOf(req),
  },
  hooks: {
    beforeChange: [
      ({ req, data, originalDoc }) => {
        // Chỉ Super Admin được cấp hoặc gỡ vai trò super; người dùng thường không tự đổi vai trò.
        const actor = roleOf(req)
        if (!req.user) return data // seed/CLI
        if (data.role && data.role !== originalDoc?.role) {
          if (!isAdminRole(actor)) throw new Error('Bạn không được đổi vai trò.')
          if ((data.role === 'super' || originalDoc?.role === 'super') && actor !== 'super')
            throw new Error('Chỉ Super Admin được cấp vai trò Super Admin.')
        }
        if (data.resetTotp) {
          // Chỉ quản trị được đặt lại 2FA cho NGƯỜI KHÁC (khi mất điện thoại); không tự đặt lại cho mình.
          if (!isAdminRole(actor) || String(originalDoc?.id) === String(req.user.id)) throw new Error('Không được đặt lại 2FA cho tài khoản này.')
          if (originalDoc?.role === 'super' && actor !== 'super') throw new Error('Chỉ Super Admin được đặt lại 2FA của Super Admin.')
          // Xóa bí mật ở afterChange (bằng overrideAccess) vì các trường bí mật khóa ghi qua API.
        }
        if (!isAdminRole(actor) && data.zones && JSON.stringify(data.zones) !== JSON.stringify(originalDoc?.zones))
          throw new Error('Bạn không được tự đổi khu phụ trách.')
        return data
      },
    ],
    afterChange: [
      auditAfterChange,
      async ({ req, doc, context }) => {
        if (!doc.resetTotp || context.totpReset) return doc
        await req.payload.update({
          collection: 'users',
          id: doc.id,
          data: { totpSecretEnc: null, totpPendingEnc: null, totpEnabled: false, totpLastStep: 0, recoveryHashes: [], resetTotp: false },
          overrideAccess: true,
          context: { totpReset: true },
          req,
        })
        await writeAudit(req, 'totp-reset', 'users', doc.id)
        return { ...doc, resetTotp: false, totpEnabled: false }
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        // Ghi nhật ký đăng nhập (bước 1). Không lưu IP thô.
        await writeAudit(req, 'login-password', 'users', user.id, null, { ipHash: req.headers ? ipHash(req as never).slice(0, 16) : '' }, user)
      },
    ],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    { name: 'name', label: 'Họ và tên', type: 'text', required: true },
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: ROLES.map((r) => ({ label: r.label, value: r.value })),
      saveToJWT: true,
    },
    {
      name: 'zones',
      label: 'Khu phụ trách',
      type: 'relationship',
      relationTo: 'zones',
      hasMany: true,
      saveToJWT: true,
      admin: { condition: (d) => d?.role === 'editor', description: 'Biên tập viên chỉ sửa được mục trong các khu này.' },
    },
    {
      name: 'totpEnabled',
      label: 'Đã bật xác thực hai bước',
      type: 'checkbox',
      defaultValue: false,
      access: { update: () => false },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'resetTotp',
      label: 'Đặt lại 2FA (khi người dùng mất thiết bị)',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Người dùng sẽ phải đăng ký lại ở lần đăng nhập sau.' },
      access: { read: ({ req }) => isAdminRole(roleOf(req)), update: ({ req }) => isAdminRole(roleOf(req)) },
    },
    // Bí mật TOTP (mã hóa AES-GCM) và mã khôi phục (băm): không đọc/ghi qua API, chỉ máy chủ dùng.
    { name: 'totpSecretEnc', type: 'text', access: { read: () => false, update: () => false, create: () => false }, admin: { hidden: true } },
    { name: 'totpPendingEnc', type: 'text', access: { read: () => false, update: () => false, create: () => false }, admin: { hidden: true } },
    { name: 'totpLastStep', type: 'number', defaultValue: 0, access: { read: () => false, update: () => false, create: () => false }, admin: { hidden: true } },
    { name: 'recoveryHashes', type: 'json', access: { read: () => false, update: () => false, create: () => false }, admin: { hidden: true } },
  ],
}
