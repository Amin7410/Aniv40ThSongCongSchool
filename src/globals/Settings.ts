import type { GlobalConfig } from 'payload'
import { APIError } from 'payload'
import { admins, anyone, isAdminRole, roleOf } from '../access/roles'
import { auditGlobal, writeAudit } from '../hooks/audit'
import { revalidateAfterChange } from '../hooks/revalidate'
import { notifyAdmins } from '../lib/notify'

const hooks = { afterChange: [auditGlobal, revalidateAfterChange] }

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Thông tin chung',
  admin: { group: 'Cấu hình' },
  access: { read: anyone, update: admins },
  hooks,
  fields: [
    { name: 'schoolName', label: 'Tên trường', type: 'text', required: true, defaultValue: 'Trường THPT Sông Công' },
    { name: 'foundedDate', label: 'Ngày thành lập', type: 'date', required: true, defaultValue: '1986-07-05' },
    { name: 'decisionNo', label: 'Số Quyết định thành lập', type: 'text' },
    { name: 'decisionIssuer', label: 'Cơ quan ban hành', type: 'text', admin: { description: 'Năm 1986 Sông Công thuộc tỉnh Bắc Thái — đối chiếu bản gốc.' } },
    { name: 'decisionScan', label: 'Ảnh scan Quyết định', type: 'upload', relationTo: 'media' },
    { name: 'bannerText', label: 'Khẩu hiệu gian trung tâm', type: 'text', defaultValue: 'Đảng Cộng sản Việt Nam quang vinh muôn năm' },
    { name: 'tour3dUrl', label: 'Link tham quan 3D (nếu có)', type: 'text', validate: (v: string | null | undefined) => !v || /^https:\/\//.test(v) || 'Link phải bắt đầu bằng https://' },
    { name: 'music', label: 'Nhạc nền (MP3)', type: 'upload', relationTo: 'media' },
    { name: 'musicTitle', label: 'Tên bài nhạc', type: 'text', defaultValue: 'Bài ca truyền thống của trường' },
    { name: 'contactEmail', label: 'Email liên hệ, yêu cầu gỡ nội dung', type: 'email' },
    {
      name: 'flagWords',
      label: 'Từ ngữ cần chú ý (kiểm duyệt)',
      type: 'text',
      hasMany: true,
      admin: { description: 'So khớp theo nguyên từ, không phân biệt dấu. Chỉ gắn cờ, không tự từ chối.' },
    },
  ],
}

export const EventSettings: GlobalConfig = {
  slug: 'event-settings',
  label: 'Đại lễ & công tắc khẩn',
  admin: { group: 'Cấu hình' },
  access: { read: anyone, update: admins },
  hooks,
  fields: [
    { name: 'title', label: 'Tên sự kiện', type: 'text', defaultValue: 'Lễ kỷ niệm 40 năm thành lập trường' },
    {
      name: 'startsAt',
      label: 'Thời gian bắt đầu',
      type: 'date',
      defaultValue: '2026-11-15T00:30:00.000Z',
      admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Giờ Việt Nam (UTC+7).' },
    },
    { name: 'place', label: 'Địa điểm', type: 'text', defaultValue: 'Sân trường' },
    {
      name: 'liveUrl',
      label: 'Link phát trực tiếp (YouTube hoặc Facebook)',
      type: 'text',
      validate: (v: string | null | undefined) =>
        !v ||
        /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(v) ||
        /^https:\/\/(www\.|m\.|web\.)?facebook\.com\//.test(v) ||
        'Chỉ chấp nhận link YouTube hoặc Facebook (https).',
    },
    {
      name: 'liveMode',
      label: 'Chế độ phát',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Tự động theo giờ', value: 'auto' },
        { label: 'Bật ngay', value: 'on' },
        { label: 'Tắt', value: 'off' },
      ],
    },
    { name: 'liveHours', label: 'Thời lượng phát (giờ)', type: 'number', defaultValue: 4, min: 1, max: 12 },
    { name: 'campaignStart', label: 'Chiến dịch Gửi kỷ vật: bắt đầu', type: 'date', defaultValue: '2026-09-20' },
    { name: 'campaignEnd', label: 'Chiến dịch Gửi kỷ vật: kết thúc', type: 'date', defaultValue: '2026-11-19' },
    {
      type: 'collapsible',
      label: 'Công tắc khẩn cấp',
      fields: [
        { name: 'submissionsOpen', label: 'Cho phép khách gửi nội dung', type: 'checkbox', defaultValue: true },
        { name: 'staticFallback', label: 'Chế độ tĩnh (giảm tải, ẩn phần động)', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}

const ACCT_FIELDS = ['bankBin', 'bankName', 'accountNo', 'accountName'] as const

/**
 * Quỹ học bổng — thay đổi thông tin tài khoản cần HAI người:
 * người thứ nhất điền "Đề xuất thay đổi", một quản trị trường KHÁC tích "Phê duyệt đề xuất".
 * Thông tin đang hiệu lực không thể sửa trực tiếp.
 */
export const FundSettings: GlobalConfig = {
  slug: 'fund-settings',
  label: 'Quỹ học bổng',
  admin: { group: 'Cấu hình' },
  access: { read: anyone, update: admins },
  hooks: {
    beforeChange: [
      async ({ req, data, originalDoc }) => {
        if (!req.user) return data // seed
        const changedActive = ACCT_FIELDS.some((k) => (data[k] ?? null) !== (originalDoc?.[k] ?? null))
        const prop = data.proposal || {}
        const prevProp = originalDoc?.proposal || {}
        const proposalEdited = ACCT_FIELDS.some((k) => (prop[k] ?? null) !== (prevProp[k] ?? null))

        if (data.approveProposal) {
          if (!prevProp.proposedBy) throw new APIError('Không có đề xuất nào để phê duyệt.', 400)
          const proposer = typeof prevProp.proposedBy === 'object' ? prevProp.proposedBy.id : prevProp.proposedBy
          if (String(proposer) === String(req.user.id)) throw new APIError('Người đề xuất không được tự phê duyệt.', 403)
          if (!isAdminRole(roleOf(req))) throw new APIError('Chỉ quản trị trường được phê duyệt.', 403)
          if (proposalEdited) throw new APIError('Đề xuất vừa bị sửa — hãy xem lại trước khi phê duyệt.', 409)
          for (const k of ACCT_FIELDS) data[k] = prevProp[k] ?? null
          data.lastApprovedBy = req.user.id
          data.lastApprovedAt = new Date().toISOString()
          data.proposal = {}
          data.approveProposal = false
          await writeAudit(req, 'fund-account-approved', 'global:fund-settings', null, { proposedBy: proposer }, { ...prevProp })
          req.payload.logger.warn({ msg: 'CẢNH BÁO: thông tin tài khoản quỹ đã thay đổi', by: req.user.id })
          void notifyAdmins(
            req.payload,
            'CẢNH BÁO: tài khoản Quỹ học bổng vừa được THAY ĐỔI',
            `Tài khoản nhận quyên góp hiển thị trên trang đã đổi thành:\n${prevProp.bankName || ''} – STK ${prevProp.accountNo} – ${prevProp.accountName}\n\nNgười phê duyệt: ${(req.user as { email?: string }).email}. Nếu bạn KHÔNG biết về thay đổi này, hãy khóa tài khoản liên quan và liên hệ THD ngay.`,
          )
          return data
        }
        if (changedActive) throw new APIError('Không sửa trực tiếp tài khoản quỹ. Hãy tạo "Đề xuất thay đổi" để người khác phê duyệt.', 403)
        if (proposalEdited) {
          data.proposal = { ...prop, proposedBy: req.user.id, proposedAt: new Date().toISOString() }
          await writeAudit(req, 'fund-account-proposed', 'global:fund-settings', null, null, data.proposal)
          req.payload.logger.warn({ msg: 'Có đề xuất thay đổi tài khoản quỹ', by: req.user.id })
          void notifyAdmins(
            req.payload,
            'Đề xuất thay đổi tài khoản Quỹ học bổng — cần phê duyệt',
            `${(req.user as { email?: string }).email} đề xuất đổi tài khoản quỹ thành:\n${prop.bankName || ''} – STK ${prop.accountNo} – ${prop.accountName}\n\nMột quản trị trường KHÁC cần kiểm tra với ngân hàng rồi phê duyệt trong trang quản trị.`,
          )
        }
        return data
      },
    ],
    afterChange: [auditGlobal, revalidateAfterChange],
  },
  fields: [
    { name: 'name', label: 'Tên quỹ', type: 'text', defaultValue: 'Quỹ học bổng 40 năm' },
    { name: 'goal', label: 'Mục tiêu (đ)', type: 'number', defaultValue: 200000000 },
    { name: 'transferPrefix', label: 'Tiền tố nội dung chuyển khoản', type: 'text', defaultValue: 'QHB40' },
    {
      type: 'collapsible',
      label: 'Tài khoản đang hiệu lực (chỉ đọc)',
      fields: [
        { name: 'bankBin', label: 'Mã BIN ngân hàng', type: 'text', admin: { readOnly: true } },
        { name: 'bankName', label: 'Ngân hàng', type: 'text', admin: { readOnly: true } },
        { name: 'accountNo', label: 'Số tài khoản', type: 'text', admin: { readOnly: true } },
        { name: 'accountName', label: 'Chủ tài khoản', type: 'text', admin: { readOnly: true } },
        { name: 'lastApprovedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
        { name: 'lastApprovedAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    {
      name: 'proposal',
      label: 'Đề xuất thay đổi tài khoản',
      type: 'group',
      fields: [
        { name: 'bankBin', label: 'Mã BIN ngân hàng (6 số)', type: 'text', validate: (v: string | null | undefined) => !v || /^\d{6}$/.test(v) || 'Mã BIN gồm 6 chữ số' },
        { name: 'bankName', label: 'Ngân hàng', type: 'text' },
        { name: 'accountNo', label: 'Số tài khoản', type: 'text', validate: (v: string | null | undefined) => !v || /^[0-9A-Za-z]{4,19}$/.test(v) || 'Số tài khoản không hợp lệ' },
        { name: 'accountName', label: 'Chủ tài khoản', type: 'text' },
        { name: 'proposedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
        { name: 'proposedAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    {
      name: 'approveProposal',
      label: 'Phê duyệt đề xuất (người khác với người đề xuất)',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
