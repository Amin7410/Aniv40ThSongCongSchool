'use client'
import { useEffect, useState } from 'react'

const KIND: Record<string, string> = { guestbook: 'Lời chúc', memory: 'Kỷ vật', photo: 'Ảnh', tribute: 'Lời tri ân', pin: 'Ghim bản đồ', donation: 'Báo đóng góp' }
const STATUS: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã đăng', rejected: 'Không được duyệt', hidden: 'Đã rút / ẩn' }

type Row = { token: string; kind: string; status?: string; at?: string; reason?: string }

export function StatusView() {
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => {
    let list: Row[] = []
    try {
      list = JSON.parse(localStorage.getItem('my-subs') || '[]')
    } catch {}
    const t = new URLSearchParams(location.search).get('token')
    if (t && !list.some((x) => x.token === t)) list.unshift({ token: t, kind: '' })
    Promise.all(
      list.map(async (r) => {
        const res = await fetch(`/api/public/submissions?token=${encodeURIComponent(r.token)}`, { cache: 'no-store' })
        if (!res.ok) return null
        const j = await res.json()
        return { token: r.token, kind: j.kind, status: j.status, at: j.createdAt, reason: j.rejectReason }
      }),
    ).then((x) => setRows(x.filter(Boolean) as Row[]))
  }, [])
  const withdraw = async (token: string) => {
    const r = await fetch(`/api/public/submissions?token=${encodeURIComponent(token)}`, { method: 'DELETE' })
    if (r.ok) setRows((rs) => rs!.map((x) => (x.token === token ? { ...x, status: 'hidden' } : x)))
  }
  if (!rows) return <p className="meta">Đang tải…</p>
  if (!rows.length) return <p className="notice">Trình duyệt này chưa gửi bài nào.</p>
  return (
    <ul className="list">
      {rows.map((r) => (
        <li key={r.token}>
          <b>{KIND[r.kind] || r.kind}</b> · {r.at ? new Date(r.at).toLocaleString('vi-VN') : ''} · {STATUS[r.status || ''] || r.status}
          {r.reason && <span className="meta"> — {r.reason}</span>}
          {r.status === 'pending' && <> <button className="chip" onClick={() => withdraw(r.token)}>Rút lại</button></>}
        </li>
      ))}
    </ul>
  )
}
