'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { shrinkImage, solvePow } from './pow-client'

export type Field =
  | { name: string; label: string; type?: 'text' | 'email' | 'number' | 'tel'; required?: boolean; max?: number; placeholder?: string; hint?: string; half?: boolean }
  | { name: string; label: string; type: 'textarea'; required?: boolean; max?: number; placeholder?: string; hint?: string }
  | { name: string; label: string; type: 'select'; options: readonly string[] | Array<string | { value: string; label: string }>; required?: boolean; placeholder?: string; hint?: string; half?: boolean }
  | { name: string; label: string; type: 'files'; maxFiles: number; hint?: string }
  | { name: string; label: string; type: 'checkbox'; hint?: string }

type Props = {
  kind: string
  fields: Field[]
  submitLabel: string
  successText: string
  hidden?: Record<string, string>
  closed?: boolean
  onCancel?: () => void
}

export function SubmitForm({ kind, fields, submitLabel, successText, hidden, closed, onCancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string; token?: string } | null>(null)
  const [picked, setPicked] = useState<string[]>([])

  if (closed) return <p className="warnmsg">Tạm dừng nhận nội dung. Xin hãy quay lại sau.</p>

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setErrors({})
    setMsg(null)
    const fd = new FormData(form)
    fd.set('kind', kind)
    for (const [k, v] of Object.entries(hidden || {})) fd.set(k, v)
    fd.set('consent', (form.elements.namedItem('consent') as HTMLInputElement)?.checked ? 'true' : 'false')
    try {
      const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
      fd.delete('files')
      if (files.length) {
        setBusy('Đang nén ảnh…')
        for (const f of files) fd.append('files', await shrinkImage(f), f.name.replace(/\.\w+$/, '') + '.jpg')
      }
      setBusy('Đang xác minh…')
      fd.set('pow', await solvePow())
      setBusy('Đang gửi…')
      const r = await fetch('/api/public/submissions', { method: 'POST', body: fd })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (j.fields) setErrors(j.fields)
        setMsg({ ok: false, text: j.error || 'Chưa gửi được. Hãy thử lại sau ít phút.' })
        return
      }
      try {
        const list = JSON.parse(localStorage.getItem('my-subs') || '[]')
        list.unshift({ token: j.token, kind, at: Date.now() })
        localStorage.setItem('my-subs', JSON.stringify(list.slice(0, 20)))
      } catch {}
      form.reset()
      setPicked([])
      setMsg({ ok: true, text: successText, token: j.token })
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message || 'Chưa gửi được.' })
    } finally {
      setBusy(null)
    }
  }

  const id = (n: string) => `${kind}-${n}`
  const render = (f: Field) => {
    const err = errors[f.name]
    const common = { id: id(f.name), name: f.name, 'aria-invalid': !!err || undefined }
    if (f.type === 'checkbox')
      return (
        <label key={f.name} className="fld chk">
          <input type="checkbox" name={f.name} value="true" />
          <span className="t">{f.label}</span>
        </label>
      )
    let input: React.ReactNode
    if (f.type === 'textarea') input = <textarea {...common} required={f.required} maxLength={f.max} placeholder={f.placeholder} rows={4} />
    else if (f.type === 'select')
      input = (
        <select {...common} required={f.required} defaultValue="">
          <option value="" disabled={f.required}>
            {f.placeholder || 'Chọn…'}
          </option>
          {f.options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      )
    else if (f.type === 'files')
      input = (
        <span className="drop">
          <input {...common} name="files" type="file" accept="image/*,.heic,.heif" multiple={f.maxFiles > 1} onChange={(e) => setPicked(Array.from(e.target.files || []).slice(0, f.maxFiles).map((x) => x.name))} />
          <span>{picked.length ? `Đã chọn ${picked.length} ảnh: ${picked.join(', ')}` : 'Chọn hoặc kéo thả ảnh vào đây'}</span>
        </span>
      )
    else input = <input {...common} type={f.type === 'number' ? 'text' : f.type || 'text'} required={f.required} maxLength={f.max} placeholder={f.placeholder} inputMode={f.type === 'number' ? 'numeric' : undefined} />
    return (
      <label key={f.name} className={`fld${err ? ' bad' : ''}`} htmlFor={id(f.name)}>
        {f.label}
        {input}
        {f.hint && <span className="hint">{f.hint}</span>}
        <span className="msg">{err}</span>
      </label>
    )
  }

  // Ghép các trường "half" liền nhau thành hàng 2 cột (.two như prototype)
  const blocks: React.ReactNode[] = []
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    const n = fields[i + 1]
    if ('half' in f && f.half && n && 'half' in n && n.half) {
      blocks.push(<div key={f.name + '-row'} className="two">{render(f)}{render(n)}</div>)
      i++
    } else blocks.push(render(f))
  }

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
      {blocks}
      <div className="hp" aria-hidden="true">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className={`fld chk${errors.consent ? ' bad' : ''}`}>
        <input type="checkbox" name="consent" required />
        <span className="t">
          Tôi đồng ý với <Link href="/trang/dieu-khoan" target="_blank">Điều khoản gửi nội dung</Link> và{' '}
          <Link href="/trang/chinh-sach-rieng-tu" target="_blank">Chính sách quyền riêng tư</Link>; nội dung sẽ được nhà trường duyệt trước khi đăng.
        </span>
        <span className="msg">{errors.consent}</span>
      </label>
      <div className="actions">
        {onCancel && <button className="btn ghost" type="button" onClick={onCancel}>Hủy</button>}
        <button className="btn" type="submit" disabled={!!busy}>{busy || submitLabel}</button>
      </div>
      <div role="status" aria-live="polite">
        {msg && (
          <p className={msg.ok ? 'okmsg' : 'errmsg'}>
            {msg.text}
            {msg.ok && msg.token && (
              <>
                {' '}
                <Link href={`/trang-thai?token=${encodeURIComponent(msg.token)}`}>Xem trạng thái bài gửi</Link>
              </>
            )}
          </p>
        )}
      </div>
    </form>
  )
}
