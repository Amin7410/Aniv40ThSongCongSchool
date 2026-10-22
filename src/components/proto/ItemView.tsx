'use client'
import { useState } from 'react'
import { I } from '@/lib/proto-svg'
import { Raw } from '../Raw'
import { Img } from './Img'
import { SubmitForm } from '../SubmitForm'
import { KHOAS } from '@/lib/cohorts'

export type ViewItem = {
  id: number
  title: string
  sub: string
  cat: string
  year: number | null
  start: number | null
  end: number | null
  status: string | null
  k: string | null
  by: string
  type: string | null
  khoa: string
  desc: string
  img: string | null
  big: string | null
  imgs: string[]
  video: string | null
  old: boolean
  art: unknown[] | null
  tags: string[]
  facts: string[]
  tributes: number
}
export type Trib = { id: number; name: string; cohort?: string | null; text: string; at: string }

export const MEM_T: Array<[string, string]> = [['anh', 'Ảnh kỷ niệm'], ['baotuong', 'Báo tường'], ['kyvat', 'Đồng phục, kỷ vật'], ['luubut', 'Lưu bút, thư từ'], ['giayto', 'Giấy khen, thẻ học sinh']]
export const GENS: Array<[string, number, number]> = [['Thế hệ 1986 – 1995', 1986, 1995], ['Thế hệ 1996 – 2005', 1996, 2005], ['Thế hệ 2006 – 2015', 2006, 2015], ['Thế hệ 2016 – nay', 2016, 9999]]
export const memT = (k: string | null) => (MEM_T.find((t) => t[0] === k) || [0, k || 'Kỷ vật'])[1]
export const kStart = (it: ViewItem) => {
  const m = /(\d{4})/.exec(it.khoa || '')
  return m ? +m[1] : +(it.year || 0)
}
export const genName = (it: ViewItem) => (GENS.find((g) => kStart(it) >= g[1] && kStart(it) <= g[2]) || ['Chưa rõ thế hệ'])[0]
const STATUS: Record<string, string> = { current: 'Đang công tác', retired: 'Nghỉ hưu', moved: 'Chuyển công tác' }
const dstr = (t: string) => new Date(t).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

function AwardView({ a, school }: { a: ViewItem; school: string }) {
  const kind = a.k === 'cert' ? (/Giấy khen/i.test(a.title) ? 'Giấy khen' : /chuẩn quốc gia/i.test(a.title) ? 'Bằng công nhận' : 'Bằng khen') : ''
  const vis = a.big ? (
    <div className="velvet-big" style={{ aspectRatio: 'auto', padding: 14 }}><img src={a.big} alt={a.title} style={{ maxHeight: '60vh' }} /></div>
  ) : a.k === 'cert' ? (
    <div className="cert">
      <div className="cert-in">
        <span className="seal" />
        <p className="nation">Cộng hòa xã hội chủ nghĩa Việt Nam<span>Độc lập – Tự do – Hạnh phúc</span></p>
        <p className="by">{a.by}</p>
        <h3>{kind}</h3>
        <p>Tặng</p>
        <p className="to">{school}</p>
        <p>{a.desc}</p>
        <p style={{ marginTop: 8, fontStyle: 'italic' }}>Năm {a.year}</p>
      </div>
    </div>
  ) : (
    <div className="velvet-big"><Img award={{ k: a.k || 'medal', title: a.title }} alt={a.title} lazy={false} /></div>
  )
  return (
    <article className="award-view">
      {vis}
      <div style={{ maxWidth: '56ch' }}>
        <h2 className="m-title">{a.title}</h2>
        <p className="mv-sub">{a.by}, năm {a.year}</p>
        {(a.k !== 'cert' || a.big) && <p className="mv-desc">{a.desc}</p>}
      </div>
    </article>
  )
}

function MemView({ it, zoneTitle }: { it: ViewItem; zoneTitle: string }) {
  const imgs = it.imgs.length ? it.imgs : [null]
  const [cur, setCur] = useState(0)
  return (
    <article className="mv">
      <div className="mv-img">
        <Img src={imgs[cur]} art={it.art} old={it.old} big alt={it.title} lazy={false} />
        {imgs.length > 1 && (
          <div className="memg">
            {imgs.map((u, i) => (
              <button key={i} onClick={() => setCur(i)} aria-pressed={i === cur} aria-label={`Ảnh ${i + 1}`}><img src={u!} alt="" /></button>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="mv-zone">{zoneTitle}, {genName(it).toLowerCase()}</p>
        <h2>{it.title}</h2>
        <p className="mv-sub">{memT(it.type)}{it.khoa ? `, ${it.khoa}` : ''}{it.year ? `, năm ${it.year}` : ''}</p>
        <p className="mv-desc">{it.desc}</p>
        {it.by && <p className="note">Gửi bởi {it.by}</p>}
      </div>
    </article>
  )
}

/** Nội dung hộp thoại xem một mục trưng bày — y như itemView() của prototype. */
export function ItemView({ zoneType, zoneTitle, it, school, tribs, onTag }: { zoneType: string; zoneTitle: string; it: ViewItem; school: string; tribs?: Trib[]; onTag?: (t: string) => void }) {
  const [trib, setTrib] = useState(false)
  if (zoneType === 'awards') return <AwardView a={it} school={school} />
  if (zoneType === 'memories') return <MemView it={it} zoneTitle={zoneTitle} />
  if (trib)
    return (
      <>
        <h2 className="m-title">Lời tri ân gửi {it.title}</h2>
        <p className="note">Lời tri ân được Ban quản trị duyệt trước khi ghim vào thẻ hồ sơ.</p>
        <SubmitForm
          kind="tribute"
          hidden={{ exhibitId: String(it.id) }}
          fields={[
            { name: 'name', label: 'Họ và tên của bạn', required: true, max: 80, placeholder: 'VD: Nguyễn Văn A', half: true },
            { name: 'cohort', label: 'Khóa học', type: 'select', options: KHOAS, placeholder: 'Chọn khóa học…', half: true },
            { name: 'message', label: 'Lời tri ân', type: 'textarea', required: true, max: 600, placeholder: 'Viết đôi dòng gửi thầy cô…' },
          ]}
          submitLabel="Gửi lời tri ân"
          successText="Lời tri ân đã được gửi và đang chờ Ban quản trị duyệt. Sau khi duyệt, lời tri ân sẽ được ghim vào thẻ hồ sơ."
          onCancel={() => setTrib(false)}
        />
      </>
    )
  const person = ['leaders', 'staff', 'alumni'].includes(zoneType)
  let sub = it.sub
  if (zoneType === 'leaders') sub = [it.cat, it.sub].filter(Boolean).join(', ')
  if (zoneType === 'staff') sub = `${it.sub}. ${STATUS[it.status || ''] || ''}, ${it.start || '?'}${it.end ? ' – ' + it.end : ' – nay'}`
  if (zoneType === 'gallery') sub = [it.year, it.cat].filter(Boolean).join(', ')
  const T = tribs || []
  return (
    <article className={`mv${person ? ' person' : ''}`}>
      <div className="mv-img">
        {it.video ? <video controls playsInline src={it.video} /> : <Img src={it.big} art={it.art} old={it.old} big alt={it.title} lazy={false} />}
      </div>
      <div>
        <p className="mv-zone">{zoneTitle}</p>
        <h2>{it.title}</h2>
        <p className="mv-sub">{sub}</p>
        {it.desc && <p className="mv-desc">{it.desc}</p>}
        {zoneType === 'alumni' && it.cat && <span className="tag">{it.cat}</span>}
        {zoneType === 'gallery' && it.tags.length > 0 && (
          <>
            <h3>Người trong ảnh</h3>
            <div className="tags">
              {it.tags.map((t) => (
                <button key={t} className="tag" onClick={() => onTag?.(t)}><Raw html={I.user} /> {t}</button>
              ))}
            </div>
          </>
        )}
        {zoneType === 'campus' && it.facts.length > 0 && <div className="facts">{it.facts.map((f) => <span key={f}>{f}</span>)}</div>}
        {(zoneType === 'leaders' || zoneType === 'staff') && (
          <>
            <h3>Lời tri ân ({T.length})</h3>
            {T.length ? (
              T.map((t) => (
                <figure key={t.id} className="trib">
                  {t.text && <blockquote>{t.text}</blockquote>}
                  <figcaption>{t.name}{t.cohort ? ', ' + t.cohort : ''}, {dstr(t.at)}</figcaption>
                </figure>
              ))
            ) : (
              <p className="note">Chưa có lời tri ân nào được đăng.</p>
            )}
            <button className="btn" onClick={() => setTrib(true)}><Raw html={I.mic} /> Gửi lời tri ân</button>
          </>
        )}
      </div>
    </article>
  )
}
