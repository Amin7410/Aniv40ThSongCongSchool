'use client'
import { useEffect, useState } from 'react'
import { NOIMG, awardArtURL, genURL } from '@/lib/art'

type Props = {
  src?: string | null
  art?: unknown[] | null
  award?: { k: string; title: string } | null
  old?: boolean
  big?: boolean
  alt?: string
  className?: string
  lazy?: boolean
  id?: string
}

/**
 * Ảnh thật nếu có; nếu chưa có thì vẽ hình minh họa giống hệt prototype (canvas, chạy sau khi tải trang).
 * Bộ lọc sepia (.old) chỉ áp cho hình minh họa / ảnh tư liệu cũ.
 */
export function Img({ src, art, award, old, big, alt = '', className, lazy = true, id }: Props) {
  const [gen, setGen] = useState<string | null>(null)
  useEffect(() => {
    if (src) return
    const t = setTimeout(() => {
      try {
        if (award) setGen(awardArtURL({ k: award.k, title: award.title }))
        else if (art) setGen(genURL(art, old, big))
      } catch {
        /* trình duyệt không hỗ trợ canvas */
      }
    }, 0)
    return () => clearTimeout(t)
  }, [src, art, award, old, big])
  const url = src || gen || NOIMG
  const cls = [className, old && (!src || old) ? 'old' : ''].filter(Boolean).join(' ') || undefined
  return <img id={id} src={url} alt={alt} loading={lazy ? 'lazy' : undefined} className={cls} />
}
