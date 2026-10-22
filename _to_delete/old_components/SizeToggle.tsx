'use client'
import { useEffect, useState } from 'react'

/** Chế độ chữ lớn cho người lớn tuổi; ghi nhớ trên trình duyệt. */
export function SizeToggle() {
  const [lg, setLg] = useState(false)
  useEffect(() => {
    // đọc sau khi hydrate để tránh lệch HTML giữa server và client
    const t = setTimeout(() => {
      try {
        setLg(localStorage.getItem('size') === 'lg')
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.size = lg ? 'lg' : ''
  }, [lg])
  return (
    <button
      className="tool"
      type="button"
      aria-pressed={lg}
      onClick={() => {
        const v = !lg
        setLg(v)
        try {
          localStorage.setItem('size', v ? 'lg' : '')
        } catch {}
      }}
    >
      {lg ? 'Chữ thường' : 'Chữ lớn'}
    </button>
  )
}
