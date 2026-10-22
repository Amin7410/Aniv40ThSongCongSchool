'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Img } from './Img'

export type BoxItem = { id: number; y: number; title: string; story: string; meta: string; img: string | null; art: unknown[] | null; old: boolean; href: string }
const GENS: Array<[string, number, number]> = [['Thế hệ 1986 – 1995', 1986, 1995], ['Thế hệ 1996 – 2005', 1996, 2005], ['Thế hệ 2006 – 2015', 2006, 2015], ['Thế hệ 2016 – nay', 2016, 9999]]

const get = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d
  } catch {
    return d
  }
}
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {}
}

/** Hộp ký ức ngẫu nhiên (giống prototype): chiếc hộp lắc, đếm số ký ức đã "săn" được. */
export function MemoryBox({ pool: all }: { pool: BoxItem[] }) {
  const [gen, setGen] = useState('Tất cả')
  const [seen, setSeen] = useState<number[]>([])
  const [cur, setCur] = useState<BoxItem | null>(null)
  const [anim, setAnim] = useState(false)
  const [note, setNote] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setGen(get('ptt-boxgen', 'Tất cả'))
      try {
        setSeen(JSON.parse(get('ptt-seen', '[]')))
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])
  const pool = useMemo(() => {
    const g = GENS.find((x) => x[0] === gen)
    return all.filter((m) => !g || (m.y >= g[1] && m.y <= g[2]))
  }, [all, gen])
  const got = pool.filter((p) => seen.includes(p.id)).length

  const draw = () => {
    if (anim) return
    setNote('')
    if (!pool.length) {
      setNote('Thế hệ này chưa có ký ức nào. Hãy là người đầu tiên gửi kỷ vật!')
      return
    }
    let cand = pool.filter((p) => !seen.includes(p.id) && p.id !== cur?.id)
    let all2 = false
    if (!cand.length) {
      all2 = true
      cand = pool.filter((p) => p.id !== cur?.id)
      if (!cand.length) cand = pool
    }
    const pick = cand[Math.floor(Math.random() * cand.length)]
    setAnim(true)
    const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches
    setTimeout(() => {
      setAnim(false)
      setCur(pick)
      const s = seen.includes(pick.id) ? seen : [...seen, pick.id].slice(-600)
      setSeen(s)
      set('ptt-seen', JSON.stringify(s))
      if (all2) setNote('Bạn đã săn đủ ký ức của thế hệ này! Hộp sẽ trộn lại để bạn xem lại.')
    }, reduced ? 60 : 650)
  }

  return (
    <div className="mbox">
      <div className="mbox-l">
        <button className={`tin${anim ? ' shake' : ''}`} onClick={draw} aria-label="Bốc một ký ức ngẫu nhiên">
          <span className="tin-lid" />
          <span className="tin-body"><span className="tin-label">Hộp ký ức</span></span>
        </button>
        <button className="btn" onClick={draw}>Bốc một ký ức</button>
        <div className="chips" role="group" aria-label="Thế hệ của tôi">
          {['Tất cả', ...GENS.map((g) => g[0])].map((v) => (
            <button key={v} className="chip" aria-pressed={v === gen} onClick={() => { setGen(v); setCur(null); set('ptt-boxgen', v) }}>
              {v === 'Tất cả' ? 'Mọi thế hệ' : v.replace('Thế hệ ', '')}
            </button>
          ))}
        </div>
        <p className="note" style={{ margin: 0 }}>Bạn đã săn được {got}/{pool.length} ký ức{gen !== 'Tất cả' ? ' của ' + gen.toLowerCase() : ''}.</p>
        <div className="bar"><i style={{ width: `${pool.length ? (got / pool.length) * 100 : 0}%` }} /></div>
      </div>
      <div aria-live="polite">
        {note && <p className="warnmsg" style={{ marginTop: 0 }}>{note}</p>}
        {cur ? (
          <figure className="reveal" key={cur.id}>
            <span className="mph"><Img src={cur.img} art={cur.art} old={cur.old} big alt={cur.title} lazy={false} /></span>
            <figcaption>
              <h3>{cur.title}</h3>
              <p>{cur.story}</p>
              <small>{cur.meta}</small>
              <div className="actions" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
                <button className="btn" onClick={draw}>Bốc tiếp</button>
                <Link className="btn ghost" href={cur.href}>Xem đầy đủ</Link>
              </div>
            </figcaption>
          </figure>
        ) : (
          <div className="reveal-empty">
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--ink)' }}>Chiếc hộp đang giữ {pool.length} ký ức.</p>
            <p style={{ margin: 0 }}>Mỗi lần bấm là một tấm ảnh cũ và một câu chuyện học trò. Chọn thế hệ của bạn rồi săn lại khoảnh khắc thanh xuân của khóa mình.</p>
          </div>
        )}
      </div>
    </div>
  )
}
