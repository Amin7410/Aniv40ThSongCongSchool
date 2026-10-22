import type { CollectionConfig } from 'payload'
import { admins, loggedIn } from '../access/roles'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

/**
 * Media công khai (đã duyệt). Ảnh gốc được nén lại sang WebP nên metadata EXIF/GPS bị loại bỏ
 * (sharp không giữ metadata nếu không gọi withMetadata).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Ảnh / tệp', plural: 'Thư viện media' },
  admin: { group: 'Nội dung', useAsTitle: 'alt' },
  access: { read: () => true, create: loggedIn, update: loggedIn, delete: admins },
  hooks: { afterChange: [auditAfterChange], afterDelete: [auditAfterDelete] },
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf', 'audio/mpeg'],
    formatOptions: { format: 'webp', options: { quality: 85 } },
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumb', width: 320, height: 400, position: 'centre', formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 720, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'full', width: 1600, formatOptions: { format: 'webp', options: { quality: 84 } } },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'Mô tả ảnh (alt)', type: 'text', required: true },
    { name: 'caption', label: 'Chú thích', type: 'text' },
    { name: 'credit', label: 'Nguồn / người cung cấp', type: 'text' },
    { name: 'isHistorical', label: 'Ảnh tư liệu cũ (hiển thị tông sepia)', type: 'checkbox', defaultValue: false },
  ],
}

/**
 * Tệp người dùng gửi lên chờ duyệt. KHÔNG đọc công khai: chỉ người đã đăng nhập xem được
 * (Payload kiểm tra quyền read trước khi phục vụ file). Thư mục lưu riêng.
 */
export const SubmissionFiles: CollectionConfig = {
  slug: 'submission-files',
  labels: { singular: 'Tệp chờ duyệt', plural: 'Tệp chờ duyệt' },
  admin: { group: 'Kiểm duyệt', hidden: ({ user }) => !user },
  access: { read: loggedIn, create: () => false, update: () => false, delete: admins },
  upload: {
    staticDir: process.env.QUARANTINE_DIR || 'quarantine',
    mimeTypes: ['image/jpeg', 'image/webp'],
    imageSizes: [{ name: 'thumb', width: 320, formatOptions: { format: 'webp', options: { quality: 75 } } }],
    adminThumbnail: 'thumb',
  },
  fields: [{ name: 'alt', type: 'text' }],
}
