import { z } from 'zod'

const name = z.string().trim().min(2, 'Hãy nhập họ và tên.').max(80)
const cohort = z.string().trim().max(60).optional().default('')
const contact = z.string().trim().max(120).optional().default('')
const emailOptional = z
  .string()
  .trim()
  .max(120)
  .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: 'Địa chỉ email chưa đúng định dạng.' })
  .optional()
  .default('')
const consent = z.literal(true, { error: 'Bạn cần đồng ý với điều khoản gửi nội dung.' })
const year = z.coerce.number().int().min(1900).max(2100).optional()

export const CONSENT_VERSION = '2026-10-v1'
export const MEMORY_TYPES = ['Ảnh kỷ niệm', 'Báo tường', 'Đồng phục, kỷ vật', 'Lưu bút, thư từ', 'Giấy khen, thẻ học sinh', 'Khác'] as const

export const submissionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('guestbook'), name, cohort, contact: emailOptional, consent, message: z.string().trim().min(5, 'Lời chúc cần ít nhất 5 ký tự.').max(600) }),
  z.object({
    kind: z.literal('memory'),
    name,
    cohort: z.string().trim().min(2, 'Hãy nhập khóa học.').max(60),
    contact,
    consent,
    title: z.string().trim().min(2, 'Hãy đặt tên cho kỷ vật.').max(100),
    type: z.enum(MEMORY_TYPES),
    year,
    message: z.string().trim().min(10, 'Hãy kể đôi dòng về kỷ vật.').max(1200),
  }),
  z.object({ kind: z.literal('photo'), name, cohort, contact, consent, year, message: z.string().trim().min(3, 'Hãy viết chú thích cho ảnh.').max(400) }),
  z.object({ kind: z.literal('tribute'), name, cohort, consent, exhibitId: z.coerce.number().int().positive(), message: z.string().trim().min(5).max(600) }),
  z.object({ kind: z.literal('pin'), name, cohort, consent, cityCode: z.string().trim().regex(/^[a-z0-9-]{2,40}$/), workplace: z.string().trim().max(100).optional().default('') }),
  z.object({
    kind: z.literal('donation'),
    name: z.string().trim().max(80).optional().transform((v) => v || 'Ẩn danh'),
    cohort,
    contact,
    consent,
    amount: z.coerce.number().int().min(1000, 'Số tiền tối thiểu 1.000 đồng.').max(10_000_000_000),
    message: z.string().trim().max(200).optional().default(''),
    anonymous: z.coerce.boolean().optional().default(false),
  }),
])

export type SubmissionInput = z.infer<typeof submissionSchema>
export const KINDS_WITH_FILES = new Set(['memory', 'photo'])
export const MAX_FILES = 5
export const MAX_FILE_BYTES = 10 * 1024 * 1024
