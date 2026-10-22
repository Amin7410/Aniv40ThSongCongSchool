/** Chuẩn hóa tiếng Việt: bỏ dấu, đ → d, chữ thường, gộp khoảng trắng. */
export function norm(input: unknown): string {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tách từ sau khi chuẩn hóa (chỉ giữ chữ và số). */
export function words(input: unknown): string[] {
  return norm(input)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

export const DEFAULT_FLAG_WORDS = [
  'dm',
  'dmm',
  'vcl',
  'vkl',
  'dit',
  'deo',
  'lua dao',
  'oc cho',
  'do ec',
  'cut',
  'ngu',
]

/**
 * Bỏ dấu sẽ gộp các từ khác nghĩa ("ngủ", "ngũ" → "ngu"; "đít" → "dit").
 * Danh sách loại trừ này được so khớp trên văn bản CÒN DẤU để tránh báo nhầm.
 */
const ACCENTED_SAFE = new Set(['ngủ', 'ngũ', 'ngụ', 'ngự', 'ngừ', 'ngư', 'ngữ', 'ngú', 'ngù', 'đi', 'cụt', 'đeo', 'dít'])

/**
 * So khớp theo ranh giới từ trên văn bản đã bỏ dấu. Cụm nhiều từ được so khớp
 * như một chuỗi từ liên tiếp. Chỉ dùng để GẮN CỜ cho kiểm duyệt viên, không tự từ chối.
 */
export function findFlags(text: string, list: string[] = DEFAULT_FLAG_WORDS): string[] {
  const raw = String(text ?? '')
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  const toks = raw.map((w) => norm(w))
  const hits = new Set<string>()
  for (const entry of list) {
    const target = words(entry)
    if (!target.length) continue
    for (let i = 0; i + target.length <= toks.length; i++) {
      let ok = true
      for (let j = 0; j < target.length; j++) {
        if (toks[i + j] !== target[j]) {
          ok = false
          break
        }
      }
      if (!ok) continue
      if (target.length === 1 && ACCENTED_SAFE.has(raw[i])) continue
      hits.add(entry)
    }
  }
  return [...hits]
}

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi

/** Dấu hiệu spam đơn giản: nhiều đường link, ký tự lặp dài. */
export function spamSignals(text: string): string[] {
  const out: string[] = []
  if ((String(text).match(URL_RE) || []).length >= 2) out.push('nhieu-link')
  if (/(.)\1{9,}/u.test(text)) out.push('ky-tu-lap')
  return out
}

/** Thế hệ (thập niên) theo năm bắt đầu khóa học, dùng cho Góc ký ức. */
export const GENERATIONS = [
  { key: '1986-1995', label: 'Thế hệ 1986 – 1995', from: 1986, to: 1995 },
  { key: '1996-2005', label: 'Thế hệ 1996 – 2005', from: 1996, to: 2005 },
  { key: '2006-2015', label: 'Thế hệ 2006 – 2015', from: 2006, to: 2015 },
  { key: '2016-nay', label: 'Thế hệ 2016 – nay', from: 2016, to: 9999 },
] as const

export function generationOf(yearOrCohort: number | string | null | undefined): string | null {
  let y =
    typeof yearOrCohort === 'number'
      ? yearOrCohort
      : Number((/(\d{4})/.exec(String(yearOrCohort ?? '')) || [])[1])
  if (!y) {
    const km = /^[Kk](\d{1,2})/.exec(String(yearOrCohort ?? '').trim())
    if (km) {
      const k = parseInt(km[1], 10)
      if (k >= 1 && k <= 100) y = 1986 + k - 1
    }
  }
  if (!y) return null
  const g = GENERATIONS.find((x) => y >= x.from && y <= x.to)
  return g ? g.key : null
}
