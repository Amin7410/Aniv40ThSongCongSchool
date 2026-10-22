/**
 * Danh sách khóa học trường THPT Sông Công từ K1 (1986 – 1989) đến K40 (2025 – 2028).
 */
export const KHOAS = [
  ...Array.from({ length: 40 }, (_, idx) => {
    const k = idx + 1
    const start = 1986 + idx
    const end = start + 3
    return `K${k} (${start} – ${end})`
  }),
  'Cán bộ, Giáo viên',
  'Khác / Khách mời',
] as const

export type KhoaOption = (typeof KHOAS)[number]
