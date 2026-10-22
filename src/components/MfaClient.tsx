'use client'
import { useEffect, useState } from 'react'

type St = { email: string; enrolled: boolean; verified: boolean }

function nextUrl() {
  const n = new URLSearchParams(location.search).get('next') || '/admin'
  return n.startsWith('/admin') ? n : '/admin' // chỉ chuyển trong trang quản trị (chống open redirect)
}

export function MfaClient() {
  const [st, setSt] = useState<St | null | 'anon'>(null)
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/staff/mfa', { cache: 'no-store' }).then(async (r) => setSt(r.ok ? await r.json() : 'anon'))
  }, [])

  const post = async (body: Record<string, string>) => {
    setBusy(true)
    setErr('')
    try {
      const r = await fetch('/api/staff/mfa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json()
      if (!r.ok) setErr(j.error || 'Có lỗi xảy ra.')
      return r.ok ? j : null
    } finally {
      setBusy(false)
    }
  }

  if (st === null) return <p className="meta">Đang tải…</p>
  if (st === 'anon')
    return (
      <p className="notice">
        {/* Trang quản trị thuộc root layout khác → cần tải lại toàn trang, không dùng <Link> */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        Bạn chưa đăng nhập. <a href="/admin/login">Đăng nhập trang quản trị</a>
      </p>
    )
  if (st.verified && !codes) {
    if (typeof window !== 'undefined') location.replace(nextUrl())
    return <p className="okmsg">Đã xác thực. Đang chuyển…</p>
  }

  if (codes)
    return (
      <div className="box form">
        <h2>Lưu mã khôi phục</h2>
        <p>Mỗi mã dùng được <b>một lần</b> khi bạn mất điện thoại. Hãy in ra hoặc lưu ở nơi an toàn — trang này sẽ không hiển thị lại.</p>
        <pre style={{ fontSize: 18, lineHeight: 1.8 }}>{codes.join('\n')}</pre>
        <a className="btn" href={nextUrl()}>Tôi đã lưu, vào trang quản trị</a>
      </div>
    )

  if (!st.enrolled)
    return (
      <div className="box form">
        <p>Tài khoản <b>{st.email}</b> cần bật xác thực hai bước trước khi vào trang quản trị.</p>
        {!setup ? (
          <button className="btn" disabled={busy} onClick={async () => { const j = await post({ action: 'setup' }); if (j) setSetup(j) }}>Bắt đầu đăng ký</button>
        ) : (
          <>
            <ol>
              <li>Cài ứng dụng xác thực (Google Authenticator, Microsoft Authenticator, 2FAS…).</li>
              <li>Quét mã QR dưới đây, hoặc nhập khóa: <code style={{ wordBreak: 'break-all' }}>{setup.secret}</code></li>
              <li>Nhập mã 6 số ứng dụng hiển thị.</li>
            </ol>
            <img src={setup.qr} alt="Mã QR đăng ký xác thực hai bước" width={240} height={240} style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
            <form className="form" onSubmit={async (e) => { e.preventDefault(); const j = await post({ action: 'enable', code }); if (j) setCodes(j.recoveryCodes) }}>
              <div className="fld"><label htmlFor="c">Mã 6 số</label><input id="c" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></div>
              <button className="btn" disabled={busy || code.length !== 6}>Xác nhận</button>
            </form>
          </>
        )}
        {err && <p className="errmsg" role="alert">{err}</p>}
      </div>
    )

  return (
    <div className="box form">
      <p>Nhập mã 6 số trong ứng dụng xác thực của <b>{st.email}</b>.</p>
      <form className="form" onSubmit={async (e) => { e.preventDefault(); const j = await post(useRecovery ? { action: 'verify', recovery: code } : { action: 'verify', code }); if (j) location.replace(nextUrl()) }}>
        <div className="fld">
          <label htmlFor="c">{useRecovery ? 'Mã khôi phục (xxxx-xxxx)' : 'Mã 6 số'}</label>
          <input id="c" autoFocus inputMode={useRecovery ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={useRecovery ? 9 : 6} value={code} onChange={(e) => setCode(useRecovery ? e.target.value : e.target.value.replace(/\D/g, ''))} required />
        </div>
        <button className="btn" disabled={busy}>Xác thực</button>
      </form>
      <button className="chip" type="button" onClick={() => { setUseRecovery(!useRecovery); setCode('') }}>{useRecovery ? 'Dùng mã 6 số' : 'Mất điện thoại? Dùng mã khôi phục'}</button>
      {err && <p className="errmsg" role="alert">{err}</p>}
    </div>
  )
}
