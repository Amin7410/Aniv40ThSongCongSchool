'use client'
import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  narrow?: boolean
  book?: boolean
  className?: string
  label?: string
  nav?: { index: number; total: number; prev: () => void; next: () => void } | null
}

/** Hộp thoại giống prototype: nền tối, khung có viền vàng, nút ✕, điều hướng Trước/Sau, phím Esc và ← →. */
export function Modal({ open, onClose, children, narrow, book, className, label = 'Chi tiết', nav }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const last = useRef<Element | null>(null)
  useEffect(() => {
    if (!open) return
    last.current = document.activeElement
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('.m-close')?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (nav && e.key === 'ArrowRight' && !(e.target as HTMLElement).closest('input,textarea,select')) nav.next()
      if (nav && e.key === 'ArrowLeft' && !(e.target as HTMLElement).closest('input,textarea,select')) nav.prev()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      ;(last.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose, nav])
  if (!open) return null
  return (
    <div className="modal">
      <div className="m-back" onClick={onClose} />
      <div ref={panel} className={`m-panel${narrow ? ' narrow' : ''}${book ? ' mbook' : ''}${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <div className="m-head">
          <button className="m-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div className="m-body">{children}</div>
        {nav && nav.total > 1 && (
          <div className="m-nav">
            <button className="btn ghost" onClick={nav.prev} disabled={nav.index <= 0}>‹ Trước</button>
            <span>{nav.index + 1} / {nav.total}</span>
            <button className="btn ghost" onClick={nav.next} disabled={nav.index >= nav.total - 1}>Sau ›</button>
          </div>
        )}
      </div>
    </div>
  )
}
