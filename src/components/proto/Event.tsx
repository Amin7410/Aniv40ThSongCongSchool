'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { REACTIONS, REACTION_ICON, liveState, type LiveState } from '@/lib/live'
import { I } from '@/lib/proto-svg'
import { Raw } from '../Raw'
import { CountdownTimer } from './Countdown'

type Ev = { startsAt?: string | null; liveMode?: string | null; liveHours?: number | null }
const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(+n || 0)) + ' đ'

function useLiveState(ev: Ev, initial: LiveState): LiveState {
  const [s, setS] = useState<LiveState>(initial)
  useEffect(() => {
    const t = setInterval(() => setS(liveState(ev)), 5000)
    return () => clearInterval(t)
  }, [ev])
  return s
}

/** Khung "Xem trực tiếp" của trang Đại lễ (lp / lp-fb + thanh cảm xúc), giống evLive() của prototype. */
export function LiveBlock({ ev, initial, embed, liveUrl, staticMode }: { ev: Ev; initial: LiveState; embed: string | null; liveUrl?: string | null; staticMode?: boolean }) {
  const state = useLiveState(ev, initial)
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
    if (state !== 'live' || staticMode) return
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
  }, [state, burst, staticMode])
  const react = async (k: string) => {
    burst({ [k]: 1 })
    try {
      await fetch('/api/public/reactions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ k }) })
    } catch {}
  }
  const start = ev.startsAt ? Date.parse(ev.startsAt) : NaN
  const o = Number.isNaN(start) ? null : new Date(start - 30 * 6e4)
  const layer = (
    <div className="rx-layer" aria-hidden="true">
      {floats.map((f) => <span key={f.id} className="rx" style={{ left: `${f.left}%` }}>{f.icon}</span>)}
    </div>
  )
  let player: React.ReactNode
  if (state === 'live' && embed && !staticMode)
    player = (
      <div className="lp">
        <iframe src={embed} title="Phát trực tiếp Đại lễ" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" />
        {layer}
      </div>
    )
  else if (state === 'live')
    player = (
      <div className="lp lp-fb">
        {layer}
        <div>
          <Raw html={I.live} />
          <p>{liveUrl ? 'Luồng phát mở trong tab mới. Bạn vẫn có thể quay lại đây để tham quan phòng truyền thống.' : 'Ban quản trị sẽ cập nhật đường dẫn phát trực tiếp tại đây.'}</p>
          {liveUrl && <a className="btn gold" href={liveUrl} target="_blank" rel="noopener noreferrer">Mở luồng phát trực tiếp</a>}
        </div>
      </div>
    )
  else if (state === 'after')
    player = (
      <div className="lp lp-fb">
        <div>
          <Raw html={I.live} />
          <p>Buổi lễ đã kết thúc. Cảm ơn các thế hệ thầy trò đã cùng hướng về trường.</p>
          {liveUrl && <a className="btn gold" href={liveUrl} target="_blank" rel="noopener noreferrer">Xem lại buổi lễ</a>}
        </div>
      </div>
    )
  else
    player = (
      <div className="lp lp-fb">
        <div>
          <Raw html={I.live} />
          <p>
            Khung phát trực tiếp tự mở{' '}
            {o
              ? `lúc ${o.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })} ngày ${o.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
              : 'vào ngày lễ'}
            , ở cả trang này và gian trung tâm.
          </p>
          <div style={{ marginTop: 16 }}>
            <CountdownTimer startsAt={ev.startsAt} />
          </div>
        </div>
      </div>
    )
  return (
    <>
      {player}
      {state === 'live' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <div className="rxbar" role="group" aria-label="Thả cảm xúc">
            {REACTIONS.map((k) => (
              <button key={k} type="button" onClick={() => react(k)} aria-label={`Thả cảm xúc ${k}`}>{REACTION_ICON[k]}</button>
            ))}
          </div>
          {viewers !== null && <p className="peers">{viewers.toLocaleString('vi-VN')} người đang xem trực tiếp</p>}
        </div>
      )}
    </>
  )
}

export function CandleCard({ staticMode }: { staticMode?: boolean }) {
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
    <>
      <div className={`candle${st?.lit ? '' : ' off'}`}><span className="wax" /><span className="wick" /><span className="flame" /></div>
      <div className="bignum">{st ? st.total.toLocaleString('vi-VN') : '…'}</div>
      <p className="note">ngọn nến đã được thắp</p>
      {staticMode ? (
        <p className="note">Tạm dừng trong chế độ giảm tải.</p>
      ) : st?.lit ? (
        <p className="okmsg">Bạn đã thắp nến tri ân. Cảm ơn bạn.</p>
      ) : (
        <button className="btn" onClick={light} disabled={busy}>Thắp nến tri ân</button>
      )}
      {err && <p className="errmsg">{err}</p>}
    </>
  )
}

type Fund = { name: string; goal: number; raised: number; count: number; bank: { bankName?: string; accountNo: string; accountName?: string; prefix?: string } | null; qr: string | null }

export function FundCard({ initial }: { initial: { raised: number; goal: number; count: number } }) {
  const [f, setF] = useState<Fund | null>(null)
  useEffect(() => {
    fetch('/api/public/fund').then((r) => r.json()).then(setF).catch(() => {})
  }, [])
  const raised = f?.raised ?? initial.raised, goal = f?.goal ?? initial.goal, count = f?.count ?? initial.count
  return (
    <>
      <div className="fund">
        <div className="qr">{f?.qr ? <img src={f.qr} alt="Mã VietQR tài khoản quỹ" /> : 'Nhà trường đang cập nhật mã QR của tài khoản quỹ'}</div>
        <p className="kv">
          {f?.bank ? (
            <>
              <b>Ngân hàng:</b> {f.bank.bankName}<br />
              <b>Số tài khoản:</b> {f.bank.accountNo}<br />
              <b>Chủ tài khoản:</b> {f.bank.accountName}<br />
              <b>Nội dung:</b> {f.bank.prefix} + họ tên + khóa
            </>
          ) : (
            <span className="note">Thông tin tài khoản quỹ chưa được cập nhật.</span>
          )}
        </p>
      </div>
      <div style={{ margin: '16px 0 6px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <b>{vnd(raised)}</b>
        <span className="note">Mục tiêu {vnd(goal)}</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.min(100, (raised / (goal || 1)) * 100).toFixed(1)}%` }} /></div>
      <p className="note">{count} lượt đóng góp đã xác nhận. Nhà trường không bao giờ nhắn tin yêu cầu chuyển tiền vào tài khoản khác.</p>
    </>
  )
}

export type QuizQ = { q: string; a: string[]; c: number; e: string }

export function QuizCard({ qs }: { qs: QuizQ[] }) {
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  if (!qs.length) return <p className="note">Câu đố đang được chuẩn bị.</p>
  if (i >= qs.length) {
    const p = score / qs.length
    return (
      <div className="center">
        <div className="bignum">{score}/{qs.length}</div>
        <p>{p === 1 ? 'Xuất sắc! Bạn hiểu rõ lịch sử nhà trường.' : p >= 0.6 ? 'Rất tốt! Bạn nắm khá chắc truyền thống của trường.' : 'Hãy dạo một vòng các khu trưng bày rồi thử lại nhé.'}</p>
        <button className="btn" onClick={() => { setI(0); setScore(0); setPick(null) }}>Chơi lại</button>
      </div>
    )
  }
  const q = qs[i]
  return (
    <div role="group" aria-live="polite">
      <p className="note">Câu {i + 1}/{qs.length}, điểm: {score}</p>
      <p className="quiz-q">{q.q}</p>
      <div className="quiz-opts">
        {q.a.map((a, k) => (
          <button
            key={k}
            disabled={pick !== null}
            className={pick !== null ? (k === q.c ? 'ok' : k === pick ? 'no' : '') : ''}
            onClick={() => {
              setPick(k)
              if (k === q.c) setScore((s) => s + 1)
            }}
          >
            {a}
          </button>
        ))}
      </div>
      {pick !== null && (
        <>
          <p className="note" style={{ marginTop: 10 }}>{pick === q.c ? 'Chính xác! ' : 'Chưa đúng. '}{q.e}</p>
          <div className="quiz-foot">
            <span />
            <button className="btn" onClick={() => { setI(i + 1); setPick(null) }}>{i + 1 < qs.length ? 'Câu tiếp theo' : 'Xem kết quả'}</button>
          </div>
        </>
      )}
    </div>
  )
}
