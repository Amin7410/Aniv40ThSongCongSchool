'use client'
/* eslint-disable @next/next/no-html-link-for-pages -- liên kết tải tệp CSV từ API, không phải điều hướng trang */
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Stats = {
  byKind: Record<string, { pending: number; approved: number }>
  pendingTotal: number
  oldestPendingAt: string | null
  candles: number
  exhibits: number
  fund: { goal: number; raised: number; donors: number }
  days: Array<{ day: string; count: number }>
}

export const KIND_LABEL: Record<string, string> = { guestbook: 'Lời chúc', memory: 'Kỷ vật', photo: 'Ảnh', tribute: 'Lời tri ân', pin: 'Ghim bản đồ', donation: 'Báo đóng góp' }
const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ'
const nf = (n: number) => n.toLocaleString('vi-VN')

function ago(iso: string | null, now: number) {
  if (!iso) return '—'
  const m = Math.round((now - Date.parse(iso)) / 60000)
  return m < 60 ? `${m} phút` : m < 1440 ? `${Math.round(m / 60)} giờ` : `${Math.round(m / 1440)} ngày`
}

export function StaffDashboard({ canExport }: { canExport: boolean }) {
  const [s, setS] = useState<Stats | null>(null)
  const [now, setNow] = useState(0)
  const [err, setErr] = useState('')
  useEffect(() => {
    const load = () =>
      fetch('/api/staff/stats', { cache: 'no-store' })
        .then(async (r) => {
          if (r.ok) {
            setS(await r.json())
            setNow(Date.now())
          } else setErr((await r.json()).error || 'Không tải được số liệu.')
        })
        .catch(() => setErr('Không tải được số liệu.'))
    load()
    const t = setInterval(load, 30_000) // tự cập nhật mỗi 30 giây
    return () => clearInterval(t)
  }, [])
  if (err) return <p className="errmsg">{err}</p>
  if (!s) return <p className="meta">Đang tải…</p>
  const max = Math.max(1, ...s.days.map((d) => d.count))
  const pct = s.fund.goal ? Math.min(100, (s.fund.raised / s.fund.goal) * 100) : 0
  const late = s.oldestPendingAt && now - Date.parse(s.oldestPendingAt) > 2 * 3600e3
  return (
    <div className="form" style={{ gap: 20, marginTop: 16 }}>
      <div className="grid">
        <Link href="/quan-tri/kiem-duyet" className="box" style={{ textDecoration: 'none' }}>
          <div className="meta">Đang chờ duyệt</div>
          <div className="bignum" style={{ color: late ? 'var(--danger)' : undefined }}>{nf(s.pendingTotal)}</div>
          <div className="meta">Chờ lâu nhất: {ago(s.oldestPendingAt, now)}{late ? ' — quá 2 giờ' : ''}</div>
        </Link>
        <div className="box">
          <div className="meta">Nến tri ân</div>
          <div className="bignum">{nf(s.candles)}</div>
          <div className="meta">Mục trưng bày: {nf(s.exhibits)}</div>
        </div>
        <div className="box">
          <div className="meta">Quỹ học bổng (đã xác nhận)</div>
          <div className="bignum" style={{ fontSize: 30 }}>{vnd(s.fund.raised)}</div>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ quỹ"><i style={{ width: `${pct}%` }} /></div>
          <div className="meta">{pct.toFixed(1)}% mục tiêu {vnd(s.fund.goal)} · {nf(s.fund.donors)} lượt</div>
        </div>
      </div>

      <div className="two-col">
        <section className="box">
          <h2>Theo loại nội dung</h2>
          <table className="tbl">
            <thead><tr><th scope="col">Loại</th><th scope="col">Chờ duyệt</th><th scope="col">Đã đăng</th></tr></thead>
            <tbody>
              {Object.entries(s.byKind).map(([k, v]) => (
                <tr key={k}>
                  <th scope="row"><Link href={`/quan-tri/kiem-duyet?kind=${k}`}>{KIND_LABEL[k]}</Link></th>
                  <td>{v.pending ? <b>{nf(v.pending)}</b> : 0}</td>
                  <td>{nf(v.approved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="box">
          <h2>Nội dung gửi về, 14 ngày</h2>
          <ul className="bars" aria-label="Số nội dung gửi về mỗi ngày">
            {s.days.map((d) => (
              <li key={d.day}>
                <span className="meta">{d.day.slice(8, 10)}/{d.day.slice(5, 7)}</span>
                <span className="bar"><i style={{ width: `${(d.count / max) * 100}%` }} /></span>
                <b>{nf(d.count)}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {canExport && (
        <section className="box">
          <h2>Xuất dữ liệu (CSV, mở bằng Excel)</h2>
          <p className="meta">Mỗi lần xuất được ghi vào Nhật ký thao tác. Tệp có thông tin liên hệ — chỉ lưu ở máy của nhà trường.</p>
          <div className="filters">
            <a className="chip" href="/api/staff/export?bo=loi-chuc">Lời chúc</a>
            <a className="chip" href="/api/staff/export?bo=tri-an">Lời tri ân</a>
            <a className="chip" href="/api/staff/export?bo=ky-vat">Kỷ vật, ảnh</a>
            <a className="chip" href="/api/staff/export?bo=dong-gop">Đóng góp quỹ</a>
          </div>
        </section>
      )}
    </div>
  )
}
