'use client'
import { useEffect, useRef, useState } from 'react'
import { VN_D, WORLD_D } from '@/lib/world'
import { Modal } from './Modal'
import { SubmitForm } from '../SubmitForm'
import { KHOAS } from '@/lib/cohorts'

export type Pin = { id: number; name: string; khoa: string; work: string; city: string; lat: number; lng: number }
type View = { x: number; y: number; w: number }

const proj = (lat: number, lng: number): [number, number] => [((lng + 180) / 360) * 1000, 250 - (lat * 500) / 180]
const clamp = ({ x, y, w }: View): View => {
  w = Math.max(60, Math.min(1000, w))
  const h = w / 2
  return { w, x: Math.max(-w * 0.3, Math.min(1000 - w * 0.7, x)), y: Math.max(-h * 0.3, Math.min(500 - h * 0.7, y)) }
}

/** Bản đồ cựu học sinh toàn cầu (giống prototype): kéo, cuộn để phóng, gom cụm ghim, luôn thể hiện Hoàng Sa, Trường Sa. */
export function AlumniMap({ pins, cities, closed }: { pins: Pin[]; cities: Array<{ code: string; name: string }>; closed?: boolean }) {
  const [v, setV] = useState<View>({ x: 0, y: 0, w: 1000 })
  const [pop, setPop] = useState<{ key: string; x: number; y: number } | null>(null)
  const [form, setForm] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; mx: number; my: number; moved: boolean; rw: number } | null>(null)
  const vr = useRef(v)
  useEffect(() => {
    vr.current = v
  }, [v])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = svg.current!.getBoundingClientRect()
      const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height
      const cur = vr.current
      const nw = Math.max(60, Math.min(1000, cur.w * (e.deltaY > 0 ? 1.2 : 1 / 1.2)))
      setV(clamp({ x: cur.x + fx * (cur.w - nw), y: cur.y + fy * (cur.w / 2 - nw / 2), w: nw }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const k = v.w / 1000, cell = v.w / 55
  const groups: Record<string, Pin[]> = {}
  for (const p of pins) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue
    const [px, py] = proj(p.lat, p.lng)
    const key = Math.round(px / cell) + ',' + Math.round(py / cell)
    ;(groups[key] = groups[key] || []).push(p)
  }
  const zoom = (d: number) => {
    const nw = v.w * (d > 0 ? 1 / 1.5 : 1.5)
    setV(clamp({ x: v.x + (v.w - nw) / 2, y: v.y + (v.w / 2 - nw / 2) / 1, w: nw }))
  }
  const P = (lat: number, lng: number) => proj(lat, lng)
  const recent = [...pins].sort((a, b) => b.id - a.id).slice(0, 12)

  return (
    <>
      <h2 className="grp" id="ban-do">Bản đồ cựu học sinh toàn cầu</h2>
      <div className="map-layout">
        <div>
          <div
            className="map-wrap"
            ref={wrap}
            onPointerDown={(e) => {
              if ((e.target as Element).closest('.map-tools,.map-pop,.pin')) return
              drag.current = { x: e.clientX, y: e.clientY, mx: v.x, my: v.y, moved: false, rw: svg.current!.getBoundingClientRect().width }
              try {
                wrap.current!.setPointerCapture(e.pointerId)
              } catch {}
            }}
            onPointerMove={(e) => {
              const d = drag.current
              if (!d) return
              const dx = e.clientX - d.x, dy = e.clientY - d.y
              if (Math.hypot(dx, dy) > 4) d.moved = true
              if (d.moved) {
                const s = v.w / d.rw
                setV(clamp({ x: d.mx - dx * s, y: d.my - dy * s, w: v.w }))
              }
            }}
            onPointerUp={() => {
              const d = drag.current
              drag.current = null
              if (d && !d.moved) setPop(null)
            }}
          >
            <div className="map-tools">
              <button onClick={() => setV({ x: 0, y: 0, w: 1000 })}>Thế giới</button>
              <button onClick={() => { const [x, y] = proj(16, 106); setV(clamp({ x: x - 45, y: y - 22, w: 90 })) }}>Việt Nam</button>
              <button onClick={() => zoom(1)} aria-label="Phóng to">+</button>
              <button onClick={() => zoom(-1)} aria-label="Thu nhỏ">−</button>
            </div>
            <svg ref={svg} viewBox={`${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${(v.w / 2).toFixed(2)}`} role="img" aria-label="Bản đồ cựu học sinh">
              <rect x={-500} y={-300} width={2000} height={1100} fill="transparent" />
              <path className="land" d={WORLD_D} />
              <path className="vn" d={VN_D} />
              {v.w < 420 ? (
                <g>
                  <circle className="isl" cx={P(16.5, 112)[0]} cy={P(16.5, 112)[1]} r={1.6 * k * 3} />
                  <circle className="isl" cx={P(16.1, 111.6)[0]} cy={P(16.1, 111.6)[1]} r={1.2 * k * 3} />
                  <text className="isl-t" x={P(16.5, 112)[0] + 6 * k} y={P(16.5, 112)[1]} fontSize={11 * k * 1.6}>Q.Đ. Hoàng Sa</text>
                  {[[10.4, 114.4], [9.9, 114.9], [8.9, 113.6], [10.1, 113.3], [8.6, 111.9]].map((c) => (
                    <circle key={c.join()} className="isl" cx={P(c[0], c[1])[0]} cy={P(c[0], c[1])[1]} r={1.1 * k * 3} />
                  ))}
                  <text className="isl-t" x={P(10.4, 115.2)[0]} y={P(10.4, 115.2)[1]} fontSize={11 * k * 1.6}>Q.Đ. Trường Sa</text>
                </g>
              ) : (
                <>
                  <circle className="isl" cx={P(16.5, 112)[0]} cy={P(16.5, 112)[1]} r={1.4 * k * 1.6} />
                  <circle className="isl" cx={P(10, 114)[0]} cy={P(10, 114)[1]} r={1.4 * k * 1.6} />
                </>
              )}
              {Object.entries(groups).map(([key, arr]) => {
                const pts = arr.map((p) => proj(p.lat, p.lng))
                const x = pts.reduce((a, q) => a + q[0], 0) / pts.length
                const y = pts.reduce((a, q) => a + q[1], 0) / pts.length
                const r = (5 + Math.min(9, Math.sqrt(arr.length) * 2.4)) * k * 1.4
                return (
                  <g
                    key={key}
                    className="pin"
                    transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
                    onClick={(e) => {
                      const wr = wrap.current!.getBoundingClientRect()
                      setPop({ key, x: e.clientX - wr.left, y: e.clientY - wr.top })
                    }}
                  >
                    <circle r={r.toFixed(2)} />
                    {arr.length > 1 && <text fontSize={(r * 1.1).toFixed(2)}>{arr.length}</text>}
                  </g>
                )
              })}
            </svg>
            {pop && groups[pop.key] && (
              <div className="map-pop" style={{ left: Math.max(8, pop.x + 10), top: Math.max(8, pop.y + 10) }}>
                <h4>{[...new Set(groups[pop.key].map((p) => p.city))].slice(0, 3).join(', ')} ({groups[pop.key].length})</h4>
                {groups[pop.key].map((p) => (
                  <p key={p.id}><b>{p.name}</b><br />{p.khoa}<br />{p.work ? p.work + ', ' : ''}{p.city}</p>
                ))}
              </div>
            )}
          </div>
          <p className="note">Kéo để di chuyển bản đồ, chạm vào chấm đỏ để xem ai đang ở đó. Bản đồ thể hiện quần đảo Hoàng Sa và Trường Sa của Việt Nam.</p>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="side-card">
            <h3>Ghim của bạn</h3>
            <p className="note" style={{ marginTop: 0 }}>Cựu học sinh thả ghim nơi mình đang sống, học tập, làm việc. Ghim hiện lên sau khi nhà trường duyệt.</p>
            <button className="btn" onClick={() => setForm(true)}>Thả ghim của tôi</button>
          </div>
          <div className="side-card">
            <h3>Mới thả ghim</h3>
            {recent.length ? (
              <ul className="plist">
                {recent.map((x) => (
                  <li key={x.id}><b>{x.name}</b>{x.khoa}<br />{x.work ? x.work + ', ' : ''}{x.city}</li>
                ))}
              </ul>
            ) : (
              <p className="note">Chưa có ai thả ghim.</p>
            )}
          </div>
        </div>
      </div>
      <Modal open={form} onClose={() => setForm(false)} narrow label="Thả ghim">
        <h2 className="m-title">Thả ghim của tôi</h2>
        <SubmitForm
          kind="pin"
          closed={closed}
          fields={[
            { name: 'name', label: 'Họ và tên', required: true, max: 80, placeholder: 'VD: Nguyễn Văn A' },
            { name: 'cohort', label: 'Khóa học', type: 'select', options: KHOAS, placeholder: 'Chọn khóa học…', half: true },
            { name: 'workplace', label: 'Nơi làm việc, học tập hiện tại', max: 100, placeholder: 'VD: Đại học Bách khoa Hà Nội', half: true },
            { name: 'cityCode', label: 'Thành phố', type: 'select', required: true, options: cities.map((c) => ({ value: c.code, label: c.name })) },
          ]}
          submitLabel="Lưu ghim"
          successText="Đã gửi ghim. Ghim sẽ hiện trên bản đồ sau khi nhà trường duyệt."
          onCancel={() => setForm(false)}
        />
        <p className="note">Tên, khóa học và nơi làm việc sẽ hiển thị công khai trên bản đồ.</p>
      </Modal>
    </>
  )
}
