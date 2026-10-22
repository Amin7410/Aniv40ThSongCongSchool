'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Item = { id: number; title: string; story: string; meta: string; img: string | null; old: boolean; href: string }
const GENS = [
  ['', 'Mọi thế hệ'],
  ['1986-1995', '1986 – 1995'],
  ['1996-2005', '1996 – 2005'],
  ['2006-2015', '2006 – 2015'],
  ['2016-nay', '2016 – nay'],
] as const

function seen(): number[] {
  try {
    return JSON.parse(localStorage.getItem('box-seen') || '[]')
  } catch {
    return []
  }
}

/** Hộp ký ức ngẫu nhiên: mỗi lần bốc là một tấm ảnh tư liệu kèm câu chuyện học trò. */
export function MemoryBox() {
  const [gen, setGen] = useState('')
  const [item, setItem] = useState<Item | null>(null)
  const [empty, setEmpty] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setGen(localStorage.getItem('box-gen') || '')
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const draw = async (g = gen) => {
    setBusy(true)
    try {
      const s = seen()
      const r = await fetch(`/api/public/memory-box?${new URLSearchParams({ ...(g && { the_he: g }), bo: s.slice(-50).join(',') })}`)
      const j = await r.json()
      setEmpty(!j.item)
      setItem(j.item)
      if (j.item) {
        try {
          localStorage.setItem('box-seen', JSON.stringify([...s, j.item.id].slice(-200)))
        } catch {}
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="box memory-box">
      <div className="filters" aria-label="Chọn thế hệ">
        {GENS.map(([k, l]) => (
          <button
            key={k || 'all'}
            className="chip"
            aria-current={gen === k}
            onClick={() => {
              setGen(k)
              setItem(null)
              try {
                localStorage.setItem('box-gen', k)
              } catch {}
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {item ? (
          <figure className="mb-fig">
            {item.img && <img src={item.img} alt={item.title} className={item.old ? 'old' : undefined} />}
            <figcaption>
              <h3>{item.title}</h3>
              {item.story && <p className="prose">{item.story.length > 360 ? item.story.slice(0, 360).replace(/\s+\S*$/, '') + '…' : item.story}</p>}
              <small className="meta">{item.meta}</small>
              <p><Link href={item.href}>Xem đầy đủ ›</Link></p>
            </figcaption>
          </figure>
        ) : (
          <p className="meta">{empty ? 'Thế hệ này chưa có kỷ vật nào được đăng. Hãy là người đầu tiên gửi về!' : 'Bấm “Bốc một ký ức” để mở hộp.'}</p>
        )}
      </div>
      <div className="filters">
        <button className="btn" onClick={() => draw()} disabled={busy}>{busy ? 'Đang mở hộp…' : item ? 'Bốc ký ức khác' : 'Bốc một ký ức'}</button>
        <Link className="btn ghost" href="/gui-ky-vat">Gửi kỷ vật của bạn</Link>
      </div>
    </div>
  )
}
