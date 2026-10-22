'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { REACTIONS, REACTION_ICON, liveState, type LiveState } from '@/lib/live'

type Ev = { startsAt?: string | null; liveMode?: string | null; liveHours?: number | null }

function useLiveState(ev: Ev): LiveState {
  const [s, setS] = useState<LiveState>(() => liveState(ev))
  useEffect(() => {
    const t = setInterval(() => setS(liveState(ev)), 5000)
    return () => clearInterval(t)
  }, [ev])
  return s
}

export function Countdown({ startsAt, title }: { startsAt?: string | null; title: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    const first = setTimeout(() => setNow(Date.now()), 0)
    return () => {
      clearInterval(t)
      clearTimeout(first)
    }
  }, [])
  const end = startsAt ? Date.parse(startsAt) : NaN
  if (Number.isNaN(end)) return null
  const ms = Math.max(0, end - (now ?? end))
  const parts: Array<[number, string]> = [
    [Math.floor(ms / 864e5), 'ngày'],
    [Math.floor(ms / 36e5) % 24, 'giờ'],
    [Math.floor(ms / 6e4) % 60, 'phút'],
    [Math.floor(ms / 1e3) % 60, 'giây'],
  ]
  const when = new Date(end).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  return (
    <section className="cd" aria-label="Đếm ngược đến Đại lễ">
      <div className="wrap">
        <h2>{title}</h2>
        <p className="lead" style={{ margin: '0 auto' }}>{when}</p>
        <div className="cd-nums" aria-hidden={now === null}>
          {parts.map(([v, l]) => (
            <div key={l}><b>{now === null ? '–' : String(v).padStart(2, '0')}</b><span>{l}</span></div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Khung phát trực tiếp + cảm xúc + số người xem qua SSE (tự chuyển polling khi máy chủ bận). */
export function LivePanel({ ev, embed, liveUrl }: { ev: Ev; embed: string | null; liveUrl?: string | null }) {
  const state = useLiveState(ev)
  const [viewers, setViewers] = useState<number | null>(null)
  const [floats, setFloats] = useState<Array<{ id: number; icon: string; left: number }>>([])
  const seq = useRef(0)

  const burst = useCallback((counts: Record<string, number>) => {
    const add: Array<{ id: number; icon: string; left: number }> = []
    for (const [k, n] of Object.entries(counts)) {
      const icon = REACTION_ICON[k as keyof typeof REACTION_ICON]
      if (!icon) continue
      for (let i = 0; i < Math.min(n, 8); i++) add.push({ id: ++seq.current, icon, left: 5 + Math.random() * 85 })
    }
    if (!add.length) return
    setFloats((f) => [...f.slice(-40), ...add])
    setTimeout(() => setFloats((f) => f.filter((x) => !add.includes(x))), 2800)
  }, [])

  useEffect(() => {
    if (state !== 'live') return
    let es: EventSource | null = new EventSource('/api/public/live/stream')
    es.addEventListener('viewers', (e) => setViewers(Number((e as MessageEvent).data)))
    es.addEventListener('hello', (e) => {
      const v = JSON.parse((e as MessageEvent).data).viewers
      if (v) setViewers(v)
    })
    es.addEventListener('rx', (e) => burst(JSON.parse((e as MessageEvent).data)))
    es.addEventListener('busy', () => {
      es?.close()
      es = null
    })
    return () => es?.close()
  }, [state, burst])

  const react = async (k: string) => {
    burst({ [k]: 1 })
    try {
      await fetch('/api/public/reactions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ k }) })
    } catch {}
  }

  return (
    <div>
      {state === 'live' ? (
        <div className="live">
          {embed ? (
            <iframe src={embed} title="Phát trực tiếp Đại lễ" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" />
          ) : (
            <div className="live-off" style={{ position: 'absolute', inset: 0 }}><p>Luồng phát chưa sẵn sàng.</p></div>
          )}
          <div className="rx" aria-hidden="true">
            {floats.map((f) => <span key={f.id} style={{ left: `${f.left}%` }}>{f.icon}</span>)}
          </div>
        </div>
      ) : (
        <p className="notice">{state === 'before' ? 'Luồng phát sẽ mở 30 phút trước giờ khai mạc. Trang tự chuyển sang chế độ xem trực tiếp, bạn không cần tải lại.' : 'Buổi lễ đã kết thúc. Cảm ơn bạn đã cùng hướng về trường.'}</p>
      )}
      {state === 'live' && (
        <div className="rx-bar">
          {REACTIONS.map((k) => (
            <button key={k} type="button" onClick={() => react(k)} aria-label={`Thả cảm xúc ${k}`}>{REACTION_ICON[k]}</button>
          ))}
          {viewers !== null && <span className="meta">· {viewers.toLocaleString('vi-VN')} người đang xem</span>}
          {liveUrl && <a className="chip" href={liveUrl} target="_blank" rel="noopener noreferrer">Mở trên YouTube/Facebook</a>}
        </div>
      )}
    </div>
  )
}

export function CandleBox() {
  const [st, setSt] = useState<{ total: number; lit: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    fetch('/api/public/candles', { cache: 'no-store' }).then((r) => r.json()).then(setSt).catch(() => {})
  }, [])
  const light = async () => {
    setBusy(true)
    setErr('')
    try {
      const r = await fetch('/api/public/candles', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) setErr(j.error || 'Chưa thắp được nến.')
      else setSt(j)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="candle">
      <div className={`flame${st?.lit ? '' : ' off'}`} aria-hidden="true" />
      <div className="bignum">{st ? st.total.toLocaleString('vi-VN') : '…'}</div>
      <p className="meta">ngọn nến đã được thắp</p>
      {st?.lit ? <p className="okmsg">Bạn đã thắp nến tri ân. Cảm ơn bạn.</p> : <button className="btn" onClick={light} disabled={busy}>Thắp nến tri ân</button>}
      {err && <p className="errmsg">{err}</p>}
    </div>
  )
}

type Fund = { name: string; goal: number; raised: number; count: number; donors: Array<{ name: string; cohort?: string; amount: number }>; bank: { bankName?: string; accountNo: string; accountName?: string; prefix?: string } | null; qr: string | null }

export function FundBox() {
  const [f, setF] = useState<Fund | null>(null)
  useEffect(() => {
    fetch('/api/public/fund').then((r) => r.json()).then(setF).catch(() => {})
  }, [])
  if (!f) return <p className="meta">Đang tải…</p>
  const pct = f.goal ? Math.min(100, (f.raised / f.goal) * 100) : 0
  const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ'
  return (
    <div className="form">
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
      <p><b>{vnd(f.raised)}</b> / {vnd(f.goal)} · {f.count} lượt đóng góp đã xác nhận</p>
      {f.bank ? (
        <div className="two-col" style={{ alignItems: 'center' }}>
          <div className="qr">{f.qr && <img src={f.qr} alt="Mã VietQR tài khoản quỹ" />}</div>
          <dl className="kv">
            <dt>Ngân hàng</dt><dd>{f.bank.bankName}</dd>
            <dt>Số tài khoản</dt><dd>{f.bank.accountNo}</dd>
            <dt>Chủ tài khoản</dt><dd>{f.bank.accountName}</dd>
            <dt>Nội dung</dt><dd>{f.bank.prefix} + họ tên + khóa</dd>
          </dl>
        </div>
      ) : (
        <p className="notice">Nhà trường đang cập nhật thông tin tài khoản quỹ.</p>
      )}
      <p className="notice">Chỉ chuyển khoản vào tài khoản mang tên chủ tài khoản ở trên. Nhà trường không bao giờ nhắn tin yêu cầu chuyển tiền vào tài khoản khác.</p>
      {f.donors.length > 0 && (
        <ul className="list">
          {f.donors.slice(0, 12).map((d, i) => <li key={i}><b>{d.name}</b>{d.cohort ? `, ${d.cohort}` : ''} — {vnd(d.amount)}</li>)}
        </ul>
      )}
    </div>
  )
}
