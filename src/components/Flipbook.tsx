'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

type Page = { src: string; alt: string }

/**
 * Kỷ yếu lật trang: màn hình rộng hiện 2 trang (bìa đứng riêng), điện thoại hiện 1 trang.
 * Điều khiển: nút, phím ← →, vuốt ngang. Chỉ tải trước 2 trang kế tiếp để tiết kiệm 4G.
 */
export function Flipbook({ title, pages }: { title: string; pages: Page[] }) {
  const [wide, setWide] = useState(false)
  const [i, setI] = useState(0) // chỉ số trang trái (hoặc trang duy nhất)
  const touch = useRef<number | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = matchMedia('(min-width: 900px)')
    const f = () => setWide(mq.matches)
    const t = setTimeout(f, 0)
    mq.addEventListener('change', f)
    return () => {
      clearTimeout(t)
      mq.removeEventListener('change', f)
    }
  }, [])

  // Bố cục 2 trang: [0] | [1,2] | [3,4] …
  const spreads: number[][] = wide ? [[0], ...Array.from({ length: Math.ceil((pages.length - 1) / 2) }, (_, k) => [1 + 2 * k, 2 + 2 * k].filter((x) => x < pages.length))] : pages.map((_, k) => [k])
  const si = Math.max(0, spreads.findIndex((s) => s.includes(i)))
  const go = useCallback((d: number) => setI((cur) => {
    const idx = Math.max(0, spreads.findIndex((s) => s.includes(cur)))
    const n = Math.min(spreads.length - 1, Math.max(0, idx + d))
    return spreads[n][0]
  }), [spreads])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { go(1); e.preventDefault() }
    if (e.key === 'ArrowLeft') { go(-1); e.preventDefault() }
  }
  const cur = spreads[si] || [0]
  const preload = (spreads[si + 1] || []).concat(spreads[si + 2] || [])

  const n = pages.length
  const label = wide
    ? si === 0 ? 'Bìa trước' : cur.length === 1 && cur[0] === n - 1 ? 'Bìa sau' : `Trang ${cur.join('–')}`
    : i === 0 ? 'Bìa trước' : i === n - 1 ? 'Bìa sau' : `Trang ${i}`
  const pg = (p: number | undefined, cls: string) =>
    p == null || !pages[p] ? <div className={`pg ${cls} none`} /> : <div className={`pg ${cls}`}><img src={pages[p].src} alt={pages[p].alt || `Trang ${p + 1}`} /></div>
  return (
    <section className="flip" aria-label={title}>
      <h2>{title}</h2>
      <div
        ref={box}
        className={`book${wide ? '' : ' single'}`}
        tabIndex={0}
        onKeyDown={onKey}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touch.current = null
        }}
        aria-roledescription="kỷ yếu lật trang"
      >
        {wide ? (
          si === 0 ? <>{pg(undefined, 'pl')}{pg(0, 'pr')}</> : <>{pg(cur[0], 'pl')}{pg(cur[1], 'pr')}</>
        ) : (
          pg(i, 'pr')
        )}
      </div>
      <div className="flip-ctl">
        <button className="btn sm" onClick={() => go(-1)} disabled={si === 0}>‹ Trang trước</button>
        <span aria-live="polite">{label}</span>
        <button className="btn sm" onClick={() => go(1)} disabled={si >= spreads.length - 1}>Trang sau ›</button>
      </div>
      <div hidden aria-hidden="true">{preload.map((p) => <img key={p} src={pages[p].src} alt="" loading="eager" />)}</div>
    </section>
  )
}
