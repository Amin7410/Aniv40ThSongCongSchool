import type { Payload } from 'payload'

/**
 * Gửi email cảnh báo tới mọi Quản trị trường + Super Admin.
 * Chưa cấu hình SMTP thì Payload ghi email ra log (không mất cảnh báo, chỉ chưa tới hộp thư).
 */
export async function notifyAdmins(payload: Payload, subject: string, text: string) {
  try {
    const admins = await payload.find({
      collection: 'users',
      where: { role: { in: ['super', 'school_admin'] } },
      limit: 50,
      depth: 0,
      overrideAccess: true,
      select: { email: true },
    })
    const to = admins.docs.map((u) => u.email).filter(Boolean)
    if (!to.length) return
    await payload.sendEmail({ to, subject: `[Phòng truyền thống] ${subject}`, text })
  } catch (e) {
    payload.logger.error({ msg: 'Gửi email cảnh báo thất bại', err: e })
  }
}
