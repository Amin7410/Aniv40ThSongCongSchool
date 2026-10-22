'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KIND_LABEL } from './Dashboard'

type Item = {
  id: number
  kind: string
  status: string
  name: string
  cohort?: string | null
  contact?: string | null
  message?: string | null
  payload?: { title?: string; type?: string; year?: number; amount?: number; workplace?: string; anonymous?: boolean } | null
  flags: string[]
  createdAt: string
  rejectReason?: string | null
  confirmedAmount?: number | null
  tributeTo: { id: number; title: string } | null
  city: { name: string; country: string } | null
  files: Array<{ id: number; url?: string | null; thumb?: string | null }>
}
type Zone = { id: number; title: string; type: string }
type Resp = { docs: Item[]; total: number; page: number; pages: number; counts: Record<string, number>; role: string; zones: Zone[] }

const REASONS = ['Nội dung không phù hợp', 'Thông tin chưa chính xác', 'Trùng lặp', 'Ảnh không rõ hoặc không liên quan', 'Quảng cáo, spam', 'Không đối chiếu được giao dịch']
const KINDS = ['', 'guestbook', 'memory', 'photo', 'tribute', 'pin', 'donation']
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã đăng', rejected: 'Từ chối', hidden: 'Đã ẩn' }
const vnd = (n?: number | null) => (n == null ? '' : new Intl.NumberFormat('vi-VN').format(n) + ' đ')

/**
 * Màn hình kiểm duyệt nhanh cho ngày lễ.
 * Phím tắt: J/K chuyển mục · A duyệt · R từ chối · X chọn · Shift+A duyệt các mục đã chọn.
 */
export function ModerationQueue({ initialKind = '' }: { initialKind?: string }) {
  const [kind, setKind] = useState(KINDS.includes(initialKind) ? initialKind : '')
  const [status, setStatus] = useState('pending')
  const [flagged, setFlagged] = useState(false)
  const [q, setQ] = useState('')
  const [qLive, setQLive] = useState('')
  const [data, setData] = useState<Resp | null>(null)
  const [cur, setCur] = useState(0)
  const [sel, setSel] = useState<Set<number>>(new Set())
  // Giá trị chỉnh tay cho mục đang xem; mặc định suy ra từ mục (không cần setState trong effect)
  const [edit, setEdit] = useState<{ id: number; zone?: number | ''; title?: string; amount?: string }>({ id: 0 })
  const [reason, setReason] = useState(REASONS[0])
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [big, setBig] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const load = useCallback(async () => {
    const u = new URLSearchParams({ status, ...(kind && { kind }), ...(flagged && { flagged: '1' }), ...(q && { q }) })
    const r = await fetch(`/api/staff/queue?${u}`, { cache: 'no-store' })
    if (r.status === 401) {
      location.href = '/mfa?next=/quan-tri/kiem-duyet'
      return
    }
    const j: Resp = await r.json()
    setData(j)
    setCur((c) => Math.min(c, Math.max(0, j.docs.length - 1)))
  }, [kind, status, flagged, q])

  useEffect(() => {
    const first = setTimeout(() => void load(), 0)
    const t = setInterval(() => void load(), 20_000) // ngày lễ: hàng chờ tự làm mới
    return () => {
      clearTimeout(first)
      clearInterval(t)
    }
  }, [load])

  const item = data?.docs[cur]
  // Gợi ý khu đích, tiêu đề, số tiền theo mục đang xem
  const defaults = useMemo(() => {
    if (!item || !data) return { zone: '' as number | '', title: '', amount: '' }
    const prefer = item.kind === 'memory' ? 'memories' : item.kind === 'photo' ? 'gallery' : ''
    const z = data.zones.find((x) => x.type === prefer)
    return {
      zone: (z ? z.id : '') as number | '',
      title: item.payload?.title || (item.kind === 'photo' ? (item.message || '').slice(0, 100) : ''),
      amount: item.kind === 'donation' ? String(item.confirmedAmount ?? item.payload?.amount ?? '') : '',
    }
  }, [item, data])
  const mine = item && edit.id === item.id ? edit : { id: 0 }
  const zone = mine.zone ?? defaults.zone
  const title = mine.title ?? defaults.title
  const amount = mine.amount ?? defaults.amount
  const setZone = (v: number | '') => item && setEdit((e) => ({ ...(e.id === item.id ? e : { id: item.id }), zone: v }))
  const setTitle = (v: string) => item && setEdit((e) => ({ ...(e.id === item.id ? e : { id: item.id }), title: v }))
  const setAmount = (v: string) => item && setEdit((e) => ({ ...(e.id === item.id ? e : { id: item.id }), amount: v }))

  const act = useCallback(
    async (action: 'approve' | 'reject' | 'hide' | 'restore', ids?: number[]) => {
      if (!data) return
      const targets = ids || (item ? [item.id] : [])
      if (!targets.length) return
      setBusy(true)
      setMsg(null)
      const one = targets.length === 1 ? data.docs.find((d) => d.id === targets[0]) : undefined
      const body: Record<string, unknown> = { ids: targets, action }
      if (action === 'reject') body.reason = reason
      if (action === 'approve') {
        if (zone) body.targetZone = zone
        if (one && title) body.publishTitle = title
        if (one?.kind === 'donation' && amount) body.confirmedAmount = Number(amount.replace(/\D/g, ''))
      }
      const r = await fetch('/api/staff/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json()
      setBusy(false)
      const failed = (j.results || []).filter((x: { ok: boolean }) => !x.ok)
      if (failed.length) setMsg({ ok: false, text: `${failed.length} mục chưa xử lý được: ${failed[0].error}` })
      else setMsg({ ok: true, text: `Đã ${action === 'approve' ? 'duyệt' : action === 'reject' ? 'từ chối' : action === 'hide' ? 'ẩn' : 'đưa về chờ duyệt'} ${targets.length} mục.` })
      setSel(new Set())
      await load()
    },
    [data, item, reason, zone, title, amount, load],
  )

  // Phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return
      if (!data?.docs.length || busy) return
      const k = e.key.toLowerCase()
      if (k === 'j') setCur((c) => Math.min(c + 1, data.docs.length - 1))
      else if (k === 'k') setCur((c) => Math.max(c - 1, 0))
      else if (k === 'x' && item) setSel((s) => { const n = new Set(s); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n })
      else if (k === 'a' && e.shiftKey && sel.size) void act('approve', [...sel])
      else if (k === 'a' && status === 'pending') void act('approve')
      else if (k === 'r' && status === 'pending') void act('reject')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, item, sel, busy, act, status])

  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cur])

  const needsZone = item && (item.kind === 'memory' || item.kind === 'photo')
  const allIds = useMemo(() => data?.docs.map((d) => d.id) || [], [data])

  return (
    <div className="mod">
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Kiểm duyệt</h1>
        <Link className="chip" href="/quan-tri">‹ Bảng điều hành</Link>
      </div>
      <div className="filters" role="tablist" aria-label="Loại nội dung">
        {KINDS.map((k) => (
          <button key={k || 'all'} role="tab" className="chip" aria-current={kind === k} onClick={() => { setKind(k); setCur(0); setSel(new Set()) }}>
            {k ? KIND_LABEL[k] : 'Tất cả'}
            {k && data?.counts[k] ? ` (${data.counts[k]})` : ''}
          </button>
        ))}
      </div>
      <div className="filters">
        <label className="fld" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          Trạng thái
          <select value={status} onChange={(e) => { setStatus(e.target.value); setCur(0) }}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <form role="search" onSubmit={(e) => { e.preventDefault(); setQ(qLive.trim()); setCur(0) }} style={{ display: 'flex', gap: 6 }}>
          <input type="search" aria-label="Tìm theo tên, nội dung" placeholder="Tìm tên, nội dung…" value={qLive} onChange={(e) => setQLive(e.target.value)} />
          <button className="chip" type="submit">Tìm</button>
        </form>
        <label className="check"><input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} /> Chỉ mục có cờ cảnh báo</label>
        <span className="meta">Phím tắt: J/K chuyển · A duyệt · R từ chối · X chọn · Shift+A duyệt đã chọn</span>
      </div>
      <div role="status" aria-live="polite">{msg && <p className={msg.ok ? 'okmsg' : 'errmsg'}>{msg.text}</p>}</div>

      {!data ? (
        <p className="meta">Đang tải…</p>
      ) : !data.docs.length ? (
        <p className="notice">Không có mục nào. Hàng chờ tự làm mới mỗi 20 giây.</p>
      ) : (
        <div className="mod-grid">
          <div>
            <div className="filters" style={{ margin: '0 0 8px' }}>
              <label className="check"><input type="checkbox" checked={sel.size === allIds.length} onChange={(e) => setSel(e.target.checked ? new Set(allIds) : new Set())} /> Chọn tất cả ({data.total})</label>
              {sel.size > 0 && status === 'pending' && (
                <>
                  <button className="btn" disabled={busy} onClick={() => act('approve', [...sel])}>Duyệt {sel.size}</button>
                  <button className="btn ghost" disabled={busy} onClick={() => act('reject', [...sel])}>Từ chối {sel.size}</button>
                </>
              )}
            </div>
            <ul className="mod-list" ref={listRef}>
              {data.docs.map((d, i) => (
                <li key={d.id} aria-current={i === cur}>
                  <input type="checkbox" aria-label={`Chọn mục của ${d.name}`} checked={sel.has(d.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n })} />
                  <button type="button" onClick={() => setCur(i)}>
                    <b>{d.name}</b> <span className="tag">{KIND_LABEL[d.kind]}</span>
                    {d.flags.length > 0 && <span className="tag flag">⚑ {d.flags.join(', ')}</span>}
                    <span className="meta mod-snip">{d.payload?.title || d.message || d.city?.name || vnd(d.payload?.amount)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {item && (
            <article className="box mod-detail" aria-label="Chi tiết mục đang chọn">
              <p className="meta">
                #{item.id} · {KIND_LABEL[item.kind]} · {new Date(item.createdAt).toLocaleString('vi-VN')} · {STATUS_LABEL[item.status]}
              </p>
              <h2 style={{ marginBottom: 4 }}>{item.name}</h2>
              <p className="meta">{[item.cohort, item.contact && `Liên hệ: ${item.contact}`].filter(Boolean).join(' · ')}</p>
              {item.flags.length > 0 && <p className="notice" style={{ borderColor: 'var(--danger)' }}>Cần xem kỹ: {item.flags.join(', ')}</p>}
              {item.tributeTo && <p>Gửi tới: <b>{item.tributeTo.title}</b></p>}
              {item.city && <p>Thành phố: <b>{item.city.name}</b>, {item.city.country}{item.payload?.workplace ? ` · ${item.payload.workplace}` : ''}</p>}
              {item.payload?.title && <p>Kỷ vật: <b>{item.payload.title}</b> ({item.payload.type}{item.payload.year ? `, ${item.payload.year}` : ''})</p>}
              {item.kind === 'donation' && <p>Số tiền báo: <b>{vnd(item.payload?.amount)}</b>{item.payload?.anonymous ? ' · muốn ẩn danh' : ''}</p>}
              {item.message && <p className="prose mod-msg">{item.message}</p>}
              {item.files.length > 0 && (
                <div className="mod-files">
                  {item.files.map((f) => (
                    <button key={f.id} type="button" onClick={() => setBig(f.url || null)} aria-label="Xem ảnh lớn">
                      <img src={f.thumb || f.url || ''} alt="" />
                    </button>
                  ))}
                </div>
              )}
              {item.rejectReason && <p className="meta">Lý do: {item.rejectReason}</p>}

              {status === 'pending' ? (
                <div className="form" style={{ marginTop: 14 }}>
                  {needsZone && (
                    <div className="row2">
                      <div className="fld">
                        <label htmlFor="mz">Đưa vào khu</label>
                        <select id="mz" value={zone} onChange={(e) => setZone(e.target.value ? Number(e.target.value) : '')}>
                          <option value="">— Chọn khu —</option>
                          {data.zones.filter((z) => ['memories', 'gallery', 'campus'].includes(z.type)).map((z) => <option key={z.id} value={z.id}>{z.title}</option>)}
                        </select>
                      </div>
                      <div className="fld">
                        <label htmlFor="mt">Tiêu đề khi đăng</label>
                        <input id="mt" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {item.kind === 'donation' && (
                    <div className="fld">
                      <label htmlFor="ma">Số tiền theo sao kê (đ)</label>
                      <input id="ma" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                  )}
                  <div className="filters">
                    <button className="btn" disabled={busy || (needsZone && !zone)} onClick={() => act('approve')}>{item.kind === 'donation' ? 'Xác nhận (A)' : 'Duyệt (A)'}</button>
                    <select aria-label="Lý do từ chối" value={reason} onChange={(e) => setReason(e.target.value)}>
                      {REASONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <button className="btn ghost" disabled={busy} onClick={() => act('reject')}>Từ chối (R)</button>
                  </div>
                </div>
              ) : (
                <div className="filters" style={{ marginTop: 14 }}>
                  {item.status === 'approved' && <button className="btn ghost" disabled={busy} onClick={() => act('hide')}>Gỡ khỏi trang</button>}
                  {item.status !== 'approved' && <button className="btn ghost" disabled={busy} onClick={() => act('restore')}>Đưa về chờ duyệt</button>}
                </div>
              )}
            </article>
          )}
        </div>
      )}

      {big && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Ảnh lớn" onClick={() => setBig(null)}>
          <img src={big} alt="" />
          <button className="btn" onClick={() => setBig(null)}>Đóng</button>
        </div>
      )}
    </div>
  )
}
