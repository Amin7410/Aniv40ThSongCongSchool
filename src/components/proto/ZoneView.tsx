'use client'
import { useEffect, useMemo, useState } from 'react'
import { I } from '@/lib/proto-svg'
import { norm } from '@/lib/text'
import { hash } from '@/lib/art'
import { Raw } from '../Raw'
import { Img } from './Img'
import { Modal } from './Modal'
import { ItemView, GENS, MEM_T, genName, kStart, memT, type Trib, type ViewItem } from './ItemView'
import { AlumniMap, type Pin } from './AlumniMap'
import { CampaignCard } from './Campaign'

const TO_LIST = ['Ban Giám hiệu', 'Toán – Tin', 'Ngữ văn', 'Ngoại ngữ', 'Khoa học tự nhiên', 'Khoa học xã hội', 'GDTC – QPAN', 'Văn phòng']
const PERIODS: Array<[string, number, number]> = [['1986 – 1995', 1986, 1995], ['1996 – 2005', 1996, 2005], ['2006 – 2015', 2006, 2015], ['2016 – nay', 2016, 9999]]
const ALUMNI_CATS = ['Khoa học', 'Y tế', 'Giáo dục', 'Quân đội – Công an', 'Kinh doanh', 'Văn hóa – Thể thao', 'Lãnh đạo – Quản lý']
const ALL = 'Tất cả'

type Props = {
  zone: { slug: string; title: string; type: string; categories: string[] }
  items: ViewItem[]
  school: string
  tribs: Record<number, Trib[]>
  pins?: Pin[]
  cities?: Array<{ code: string; name: string }>
  campaign?: { start?: string | null; end?: string | null; closed?: boolean }
}

function Search({ ph, value, onChange, list }: { ph: string; value: string; onChange: (v: string) => void; list?: string }) {
  return (
    <label className="search">
      <Raw html={I.search} />
      <span className="sr">{ph}</span>
      <input type="search" placeholder={ph} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" list={list} />
    </label>
  )
}

function Chips({ label, opts, cur, set }: { label: string; opts: Array<string | [string, string]>; cur: string; set: (v: string) => void }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      <small>{label}</small>
      {opts.map((o) => {
        const v = Array.isArray(o) ? o[0] : o
        const l = Array.isArray(o) ? o[1] : o
        return <button key={v} className="chip" aria-pressed={v === cur} onClick={() => set(v)}>{l}</button>
      })}
    </div>
  )
}

const trunc = (t: string, n: number) => (t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t)
const decade = (y: number | null) => Math.floor((+(y || 0)) / 10) * 10

/** Toàn bộ phần thân của một khu trưng bày, dựng y hệt các hàm zLeaders/zStaff/… của prototype; lọc tức thì ở client. */
export function ZoneView({ zone, items, school, tribs, pins = [], cities = [], campaign }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const [list, setList] = useState<ViewItem[]>(items)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(ALL)
  const [st, setSt] = useState('current')
  const [per, setPer] = useState(ALL)
  const [dec, setDec] = useState(ALL)
  const [gen, setGen] = useState(ALL)
  const [ba1, setBa1] = useState(0)
  const [ba2, setBa2] = useState(Math.max(0, items.length - 1))
  const [pos, setPos] = useState(50)
  const t = zone.type

  useEffect(() => {
    const m = /^#m-(\d+)$/.exec(location.hash)
    if (m && items.some((i) => i.id === +m[1])) {
      const id = +m[1]
      setTimeout(() => setOpen(id), 0)
    }
  }, [items])

  const show = (id: number, from: ViewItem[]) => {
    setList(from)
    setOpen(id)
    history.replaceState(null, '', `#m-${id}`)
  }
  const close = () => {
    setOpen(null)
    history.replaceState(null, '', location.pathname + location.search)
  }
  const idx = open == null ? -1 : list.findIndex((i) => i.id === open)
  const cur = idx >= 0 ? list[idx] : null

  const nq = norm(q)
  const filtered = useMemo(() => {
    if (t === 'staff')
      return items.filter(
        (it) =>
          (st === 'current' ? it.status === 'current' : it.status !== 'current') &&
          (cat === ALL || it.cat === cat) &&
          (per === ALL || (() => { const p = PERIODS.find((p) => p[0] === per); return !!p && +(it.start || 0) >= p[1] && +(it.start || 0) <= p[2] })()) &&
          (!nq || norm([it.title, it.sub, it.cat, it.desc].join(' ')).includes(nq)),
      )
    if (t === 'alumni') return items.filter((it) => (cat === ALL || it.cat === cat) && (!nq || norm([it.title, it.sub, it.desc].join(' ')).includes(nq)))
    if (t === 'gallery')
      return items
        .filter((it) => (dec === ALL || String(decade(it.year)) === dec) && (cat === ALL || it.cat === cat) && (!nq || norm(it.tags.join('|') + '|' + it.title).includes(nq)))
        .sort((a, b) => (+(b.year || 0)) - (+(a.year || 0)))
    if (t === 'memories')
      return items.filter((it) => (cat === ALL || it.type === cat) && (gen === ALL || genName(it) === gen) && (!nq || norm([it.title, it.desc, it.khoa, it.by].join(' ')).includes(nq)))
    return items
  }, [items, t, st, cat, per, nq, dec, gen])

  const pcard = (it: ViewItem, from: ViewItem[], extra?: React.ReactNode) => (
    <button key={it.id} className="pcard" onClick={() => show(it.id, from)}>
      <span className="frame"><Img src={it.img} art={it.art} /></span>
      <b>{it.title}</b>
      <span>{it.sub}</span>
      {extra}
    </button>
  )
  const nT = (it: ViewItem) => tribs[it.id]?.length ?? it.tributes

  let body: React.ReactNode = null
  if (t === 'leaders') {
    const HT = items.filter((i) => i.cat === 'Hiệu trưởng')
    const PHT = items.filter((i) => i.cat !== 'Hiệu trưởng')
    body = (
      <>
        <h2 className="grp">Hiệu trưởng qua các thời kỳ</h2>
        <ol className="ltl">
          {HT.map((it) => (
            <li key={it.id}>
              <p className="ltl-yr">{it.sub}</p>
              <button className="lcard" onClick={() => show(it.id, HT)}>
                <span className="frame"><Img src={it.img} art={it.art} /></span>
                <span>
                  <b>{it.title}</b>
                  <span>{it.cat}</span>
                  <em><Raw html={I.msg} /> {nT(it) ? `${nT(it)} lời tri ân` : 'Gửi lời tri ân'}</em>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <h2 className="grp">Phó Hiệu trưởng qua các thời kỳ</h2>
        <div className="pgrid">
          {PHT.map((it) => pcard(it, PHT, <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{nT(it) ? `${nT(it)} lời tri ân` : ''}</span>))}
        </div>
      </>
    )
  } else if (t === 'staff') {
    body = (
      <>
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Tình trạng">
            {[['current', 'Đang công tác'], ['former', 'Nghỉ hưu, chuyển công tác']].map(([v, l]) => (
              <button key={v} aria-pressed={st === v} onClick={() => setSt(v)}>{l}</button>
            ))}
          </div>
          <Search ph="Tìm theo tên, bộ môn…" value={q} onChange={setQ} />
          <Chips label="Tổ:" opts={[ALL, ...(zone.categories.length ? zone.categories : TO_LIST)]} cur={cat} set={setCat} />
          <Chips label="Thời kỳ về trường:" opts={[ALL, ...PERIODS.map((p) => p[0])]} cur={per} set={setPer} />
        </div>
        <p className="count">{filtered.length} chân dung</p>
        {filtered.length ? <div className="pgrid">{filtered.map((it) => pcard(it, filtered))}</div> : <p className="empty">Không có kết quả phù hợp. Hãy thử gõ không dấu hoặc chọn “Tất cả”.</p>}
      </>
    )
  } else if (t === 'alumni') {
    body = (
      <>
        <div className="toolbar">
          <Search ph="Tìm theo tên, khóa học…" value={q} onChange={setQ} />
          <Chips label="Lĩnh vực:" opts={[ALL, ...(zone.categories.length ? zone.categories : ALUMNI_CATS)]} cur={cat} set={setCat} />
        </div>
        {filtered.length ? <div className="pgrid">{filtered.map((it) => pcard(it, filtered))}</div> : <p className="empty">Không có kết quả phù hợp.</p>}
        <AlumniMap pins={pins} cities={cities} closed={campaign?.closed} />
      </>
    )
  } else if (t === 'awards') {
    const sh = [items.filter((i) => i.k === 'medal' || i.k === 'flag'), items.filter((i) => i.k === 'cup'), items.filter((i) => i.k === 'cert')].filter((a) => a.length)
    const flat = sh.flat()
    body = (
      <>
        <div className="case">
          <div className="case-glass">
            {sh.map((a, i) => (
              <div key={i} className="shelf">
                {a.map((it) => (
                  <button key={it.id} className={`ex${it.k === 'cert' ? ' excert' : ''}`} onClick={() => show(it.id, flat)}>
                    <Img src={it.img} award={{ k: it.k || 'cert', title: it.title }} />
                    <span>{it.title} ({it.year})</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="case-base" />
        </div>
        <p className="note center" style={{ marginTop: 14 }}>Chạm vào từng hiện vật để phóng to và đọc nội dung thành tích.</p>
      </>
    )
  } else if (t === 'gallery') {
    const decs = [...new Set(items.map((i) => decade(i.year)))].filter(Boolean).sort()
    const tags = [...new Set(items.flatMap((i) => i.tags))].sort((a, b) => a.localeCompare(b, 'vi'))
    body = (
      <>
        <div className="toolbar">
          <Search ph="Tìm người trong ảnh, VD: Nguyễn Văn Hòa" value={q} onChange={setQ} list="tagList" />
          <datalist id="tagList">{tags.map((x) => <option key={x} value={x} />)}</datalist>
          <Chips label="Thập niên:" opts={[ALL, ...decs.map((d) => [String(d), d + 's'] as [string, string])]} cur={dec} set={setDec} />
          {zone.categories.length > 0 && <Chips label="Phân loại:" opts={[ALL, ...zone.categories]} cur={cat} set={setCat} />}
        </div>
        <p className="count">{filtered.length} ảnh, video</p>
        {filtered.length ? (
          <div className="ggrid">
            {filtered.map((it) => (
              <button key={it.id} className="gcard" onClick={() => show(it.id, filtered)}>
                <span className="ph">
                  <Img src={it.img} art={it.art} old={it.old} />
                  {it.video && <span className="play"><Raw html={I.play} /></span>}
                </span>
                <b>{it.title}</b>
                <span className="m">
                  <span>{it.year || it.sub}{it.cat ? ', ' + it.cat : ''}</span>
                  {it.tags.length > 0 && <span><Raw html={I.user} /> {it.tags.length}</span>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty">Không có ảnh phù hợp.</p>
        )}
      </>
    )
  } else if (t === 'campus') {
    const a = Math.min(ba1, items.length - 1), b = Math.min(ba2, items.length - 1)
    const opt = (sel: number, set: (n: number) => void) => (
      <select value={sel} onChange={(e) => set(+e.target.value)}>
        {items.map((x, i) => <option key={x.id} value={i}>{x.sub}: {x.title}</option>)}
      </select>
    )
    body = (
      <>
        <div className="section-head" style={{ marginBottom: 10 }}>
          <div>
            <h2>Ngày ấy – Bây giờ</h2>
            <p>Kéo thanh trượt sang trái, phải để so sánh diện mạo nhà trường giữa hai giai đoạn.</p>
          </div>
        </div>
        {items.length < 2 ? (
          <p className="empty">Cần ít nhất hai giai đoạn để so sánh.</p>
        ) : (
          <>
            <div className="ba-pick">
              <label>Ngày ấy {opt(a, setBa1)}</label>
              <label>Bây giờ {opt(b, setBa2)}</label>
            </div>
            <div className="ba" style={{ ['--p' as string]: pos + '%' }}>
              <Img src={items[b].big} art={items[b].art} big alt={items[b].title} lazy={false} />
              <div className="ba-before">
                <Img src={items[a].big} art={items[a].art} old={items[a].old} big alt={items[a].title} lazy={false} />
              </div>
              <span className="ba-line" />
              <span className="ba-knob"><Raw html={I.arrows} /></span>
              <span className="ba-l">Ngày ấy, {items[a].sub}</span>
              <span className="ba-r">Bây giờ, {items[b].sub}</span>
              <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Kéo để so sánh hai giai đoạn" />
            </div>
          </>
        )}
        <h2 className="grp">Các giai đoạn xây dựng</h2>
        <ol className="tl">
          {items.map((it) => (
            <li key={it.id}>
              <p className="yr">{it.sub}</p>
              <h3>{it.title}</h3>
              <div className="row2">
                <button className="ph" style={{ appearance: 'none', border: 0, cursor: 'zoom-in' }} onClick={() => show(it.id, items)} aria-label={`Xem ảnh ${it.title}`}>
                  <Img src={it.img} art={it.art} old={it.old} />
                </button>
                <div>
                  <p>{it.desc}</p>
                  {it.facts.length > 0 && <div className="facts">{it.facts.map((f) => <span key={f}>{f}</span>)}</div>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </>
    )
  } else if (t === 'memories') {
    const people = new Set(items.map((i) => norm(i.by)).filter(Boolean)).size
    const gens = new Set(items.map((i) => genName(i)).filter((g) => g !== 'Chưa rõ thế hệ')).size
    const groups = [...GENS.map((g) => g[0]), 'Chưa rõ thế hệ']
      .map((g) => [g, filtered.filter((it) => genName(it) === g).sort((x, y) => kStart(x) - kStart(y))] as const)
      .filter(([, a]) => a.length)
    const flat = groups.flatMap(([, a]) => a)
    body = (
      <>
        <CampaignCard start={campaign?.start} end={campaign?.end} items={items.length} people={people} gens={gens} closed={campaign?.closed} />
        <div className="toolbar">
          <Search ph="Tìm theo khóa, người gửi, câu chuyện…" value={q} onChange={setQ} />
          <Chips label="Thế hệ:" opts={[ALL, ...GENS.map((g) => g[0])]} cur={gen} set={setGen} />
          <Chips label="Loại kỷ vật:" opts={[ALL, ...MEM_T]} cur={cat} set={setCat} />
        </div>
        {!flat.length ? (
          <p className="empty">Chưa có kỷ vật phù hợp. Hãy là người đầu tiên gửi kỷ vật của thế hệ mình.</p>
        ) : (
          groups.map(([g, a]) => (
            <div key={g}>
              <h2 className="grp">{g} <span className="grp-n">{a.length} kỷ vật</span></h2>
              <div className="mgrid">
                {a.map((it) => {
                  const rot = ((hash(String(it.id)) % 7) - 3) * 0.55
                  return (
                    <button key={it.id} className="mcard" style={{ ['--rot' as string]: rot.toFixed(2) + 'deg' }} onClick={() => show(it.id, flat)}>
                      <span className="mph">
                        <Img src={it.img} art={it.art} old={it.old} />
                        {it.imgs.length > 1 && <span className="more">{it.imgs.length} ảnh</span>}
                      </span>
                      <b>{it.title}</b>
                      <span className="mstory">{trunc(it.desc, 130)}</span>
                      <span className="mmeta">{memT(it.type)}{it.khoa ? ', ' + it.khoa : ''}{it.by ? `. Gửi bởi ${it.by}` : ''}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </>
    )
  }

  return (
    <>
      {body}
      <Modal
        open={!!cur}
        onClose={close}
        label={cur?.title}
        nav={cur && list.length > 1 ? { index: idx, total: list.length, prev: () => show(list[(idx - 1 + list.length) % list.length].id, list), next: () => show(list[(idx + 1) % list.length].id, list) } : null}
      >
        {cur && (
          <ItemView
            key={cur.id}
            zoneType={t}
            zoneTitle={zone.title}
            it={cur}
            school={school}
            tribs={tribs[cur.id]}
            onTag={(tag) => {
              close()
              setQ(tag)
            }}
          />
        )}
      </Modal>
    </>
  )
}
