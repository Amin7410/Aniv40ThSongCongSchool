import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { admins, anyone, exhibitsWrite, isAdminRole, publishedOrLoggedIn, roleOf, zoneIds } from '../access/roles'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { revalidateAfterChange } from '../hooks/revalidate'
import { generationOf } from '../lib/text'

const commonHooks = {
  afterChange: [auditAfterChange, revalidateAfterChange],
  afterDelete: [auditAfterDelete, revalidateAfterChange],
}

export const ZONE_TYPES = [
  { label: 'Lãnh đạo', value: 'leaders' },
  { label: 'Cán bộ, giáo viên', value: 'staff' },
  { label: 'Cựu học sinh', value: 'alumni' },
  { label: 'Khen thưởng', value: 'awards' },
  { label: 'Album hoạt động', value: 'gallery' },
  { label: 'Cơ sở vật chất', value: 'campus' },
  { label: 'Góc ký ức', value: 'memories' },
] as const

export const Zones: CollectionConfig = {
  slug: 'zones',
  labels: { singular: 'Khu trưng bày', plural: 'Khu trưng bày' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'type', 'order'], group: 'Nội dung' },
  defaultSort: 'order',
  access: { read: anyone, create: admins, update: admins, delete: admins },
  hooks: commonHooks,
  fields: [
    { name: 'title', label: 'Tên khu', type: 'text', required: true },
    { name: 'shortTitle', label: 'Tên ngắn (thanh tab)', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'type', label: 'Kiểu trưng bày', type: 'select', required: true, options: [...ZONE_TYPES] },
    { name: 'description', label: 'Giới thiệu', type: 'textarea' },
    { name: 'categories', label: 'Phân loại dùng trong khu', type: 'text', hasMany: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'cover', label: 'Ảnh đại diện', type: 'upload', relationTo: 'media' },
  ],
}

export const Exhibits: CollectionConfig = {
  slug: 'exhibits',
  labels: { singular: 'Mục trưng bày', plural: 'Mục trưng bày' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'zone', 'subtitle', 'year', '_status'],
    listSearchableFields: ['title', 'subtitle', 'searchText'],
    group: 'Nội dung',
  },
  defaultSort: 'sortOrder',
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrLoggedIn, create: exhibitsWrite, update: exhibitsWrite, delete: exhibitsWrite },
  hooks: {
    ...commonHooks,
    beforeChange: [
      ({ req, data }) => {
        // access.create không lọc được theo dữ liệu → kiểm tra khu ở đây.
        if (req.user && roleOf(req) === 'editor') {
          const z = typeof data.zone === 'object' ? data.zone?.id : data.zone
          if (z != null && !zoneIds(req).map(String).includes(String(z)))
            throw new APIError('Bạn không phụ trách khu này.', 403)
        }
        const year = data.year || data.yearStart || data.cohort
        data.generation = generationOf(year) ?? undefined
        data.searchText = [data.title, data.subtitle, data.category, ...(data.peopleTags || [])]
          .filter(Boolean)
          .join(' ')
        return data
      },
    ],
  },
  fields: [
    { name: 'zone', label: 'Khu', type: 'relationship', relationTo: 'zones', required: true, index: true },
    { name: 'title', label: 'Tiêu đề / Họ và tên', type: 'text', required: true, maxLength: 140 },
    { name: 'subtitle', label: 'Dòng phụ (nhiệm kỳ, chức danh, khóa…)', type: 'text', maxLength: 140 },
    { name: 'category', label: 'Phân loại (chức vụ, tổ, lĩnh vực…)', type: 'text', index: true },
    {
      type: 'row',
      fields: [
        { name: 'year', label: 'Năm', type: 'number', min: 1900, max: 2100 },
        { name: 'yearStart', label: 'Từ năm', type: 'number', min: 1900, max: 2100 },
        { name: 'yearEnd', label: 'Đến năm', type: 'number', min: 1900, max: 2100 },
      ],
    },
    {
      name: 'staffStatus',
      label: 'Tình trạng công tác',
      type: 'select',
      options: [
        { label: 'Đang công tác', value: 'current' },
        { label: 'Nghỉ hưu', value: 'retired' },
        { label: 'Chuyển công tác', value: 'moved' },
      ],
    },
    {
      name: 'awardKind',
      label: 'Loại hiện vật',
      type: 'select',
      options: [
        { label: 'Huân chương', value: 'medal' },
        { label: 'Cờ thi đua', value: 'flag' },
        { label: 'Cúp', value: 'cup' },
        { label: 'Bằng khen, giấy khen', value: 'cert' },
      ],
    },
    { name: 'awardedBy', label: 'Cấp khen tặng', type: 'text' },
    { name: 'memoryType', label: 'Loại kỷ vật', type: 'text' },
    { name: 'cohort', label: 'Khóa học (người gửi kỷ vật)', type: 'text' },
    { name: 'contributor', label: 'Người gửi / cung cấp', type: 'text' },
    { name: 'description', label: 'Mô tả, tiểu sử, câu chuyện', type: 'textarea', maxLength: 3000 },
    { name: 'media', label: 'Ảnh / video', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 10 },
    { name: 'peopleTags', label: 'Người trong ảnh', type: 'text', hasMany: true },
    { name: 'facts', label: 'Điểm nổi bật (khu Cơ sở vật chất)', type: 'text', hasMany: true },
    {
      name: 'art',
      label: 'Hình minh họa thay thế',
      type: 'json',
      admin: { description: 'Tự dùng khi mục chưa có ảnh thật (hình vẽ minh họa như bản prototype). Có thể để trống.', position: 'sidebar' },
    },
    { name: 'pairKey', label: 'Mã cặp "Ngày ấy – Bây giờ"', type: 'text', admin: { description: 'Hai ảnh cùng mã sẽ ghép thành thanh trượt.' } },
    { name: 'sortOrder', label: 'Thứ tự', type: 'number', defaultValue: 100, index: true },
    { name: 'generation', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar' } },
    { name: 'searchText', type: 'text', admin: { hidden: true } },
    { name: 'sourceSubmission', type: 'relationship', relationTo: 'submissions', admin: { readOnly: true, position: 'sidebar' } },
  ],
}

export const Milestones: CollectionConfig = {
  slug: 'milestones',
  labels: { singular: 'Mốc lịch sử', plural: 'Dòng thời gian' },
  admin: { useAsTitle: 'date', defaultColumns: ['date', 'text', 'order'], group: 'Nội dung' },
  defaultSort: 'order',
  access: { read: anyone, create: admins, update: admins, delete: admins },
  hooks: commonHooks,
  fields: [
    { name: 'date', label: 'Thời điểm', type: 'text', required: true, admin: { description: 'VD: 05/07/1986 hoặc 1996' } },
    { name: 'text', label: 'Sự kiện', type: 'textarea', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

export const QuizQuestions: CollectionConfig = {
  slug: 'quiz-questions',
  labels: { singular: 'Câu hỏi', plural: 'Câu đố 40 năm' },
  admin: { useAsTitle: 'question', group: 'Nội dung' },
  defaultSort: 'order',
  access: { read: anyone, create: admins, update: admins, delete: admins },
  hooks: commonHooks,
  fields: [
    { name: 'question', label: 'Câu hỏi', type: 'text', required: true },
    { name: 'options', label: 'Phương án', type: 'text', hasMany: true, required: true, minRows: 2, maxRows: 4 },
    { name: 'correctIndex', label: 'Đáp án đúng (0 = phương án đầu)', type: 'number', required: true, min: 0, max: 3 },
    { name: 'explanation', label: 'Giải thích', type: 'textarea' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

export const Cities: CollectionConfig = {
  slug: 'cities',
  labels: { singular: 'Thành phố', plural: 'Danh mục thành phố' },
  admin: { useAsTitle: 'name', group: 'Hệ thống' },
  access: { read: anyone, create: admins, update: admins, delete: admins },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    { name: 'country', type: 'text', required: true },
    { name: 'lat', type: 'number', required: true },
    { name: 'lng', type: 'number', required: true },
  ],
}

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  labels: { singular: 'Nhật ký', plural: 'Nhật ký thao tác' },
  admin: { useAsTitle: 'action', defaultColumns: ['createdAt', 'actorLabel', 'action', 'target', 'docId'], group: 'Hệ thống' },
  defaultSort: '-createdAt',
  // Chỉ ghi thêm: không ai sửa hoặc xóa qua ứng dụng (kể cả Super Admin).
  access: {
    read: ({ req }) => isAdminRole(roleOf(req)),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'actorLabel', type: 'text' },
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'target', type: 'text', index: true },
    { name: 'docId', type: 'text' },
    { name: 'before', type: 'json' },
    { name: 'after', type: 'json' },
  ],
}
