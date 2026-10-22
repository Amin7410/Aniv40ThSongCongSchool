import { revalidatePath } from 'next/cache'

/** Làm mới cache trang công khai khi nội dung đổi. Không lỗi khi chạy ngoài Next (seed, CLI). */
export function revalidateSite(path = '/') {
  try {
    revalidatePath(path, 'layout')
  } catch {
    /* ngoài ngữ cảnh Next.js */
  }
}

export const revalidateAfterChange = <T>({ doc }: { doc: T }): T => {
  revalidateSite()
  return doc
}
