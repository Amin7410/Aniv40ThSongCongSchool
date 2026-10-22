'use client'
import { useState } from 'react'

export type Pair = { key: string; before: { src: string; title: string; year?: number | null; old?: boolean }; after: { src: string; title: string; year?: number | null } }

/** Thanh trượt "Ngày ấy – Bây giờ": kéo (chuột, cảm ứng) hoặc dùng phím mũi tên trên thanh trượt. */
export function BeforeAfter({ pairs }: { pairs: Pair[] }) {
  const [i, setI] = useState(0)
  const [pos, setPos] = useState(50)
  if (!pairs.length) return null
  const p = pairs[i]
  return (
    <section className="box ba-box" aria-label="Ngày ấy – Bây giờ">
      <h2>Ngày ấy – Bây giờ</h2>
      {pairs.length > 1 && (
        <div className="filters">
          {pairs.map((x, k) => (
            <button key={x.key} className="chip" aria-current={k === i} onClick={() => { setI(k); setPos(50) }}>{x.after.title}</button>
          ))}
        </div>
      )}
      <div className="ba">
        <img src={p.after.src} alt={`Bây giờ: ${p.after.title}`} />
        <div className="ba-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={p.before.src} alt={`Ngày ấy: ${p.before.title}`} className={p.before.old ? 'old' : undefined} />
        </div>
        <span className="ba-line" style={{ left: `${pos}%` }} aria-hidden="true" />
        <span className="ba-lbl l">Ngày ấy{p.before.year ? ` · ${p.before.year}` : ''}</span>
        <span className="ba-lbl r">Bây giờ{p.after.year ? ` · ${p.after.year}` : ''}</span>
        <input className="ba-range" type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Kéo để so sánh ngày ấy và bây giờ" />
      </div>
    </section>
  )
}
