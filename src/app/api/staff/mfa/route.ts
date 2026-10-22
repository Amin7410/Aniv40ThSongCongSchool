import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import QRCode from 'qrcode'
import { hit } from '@/lib/ratelimit'
import { sameOrigin } from '@/lib/security'
import { issueMfaProof, mfaCookie, mfaSatisfied, MFA_COOKIE } from '@/lib/mfa'
import { hashRecovery, newRecoveryCodes, newTotpSecret, otpauthURI, seal, unseal, verifyTotp } from '@/lib/totp'
import { writeAudit } from '@/hooks/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Xác thực bước 2 cho tài khoản quản trị.
 *   GET                       → trạng thái {enrolled, verified}
 *   POST {action:'setup'}     → tạo bí mật chờ xác nhận, trả QR (chỉ khi chưa đăng ký)
 *   POST {action:'enable', code}  → xác nhận đăng ký, trả 8 mã khôi phục (hiện MỘT lần)
 *   POST {action:'verify', code | recovery} → cấp bằng chứng bước 2 cho phiên hiện tại
 */

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } })

async function ctx(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return { payload, user: null, full: null }
  const full = await payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true, depth: 0 })
  return { payload, user: user as typeof user & { _sid?: string }, full }
}

export async function GET(req: NextRequest) {
  const { user, full } = await ctx(req)
  if (!user || !full) return json({ error: 'Chưa đăng nhập.' }, 401)
  return json({ email: user.email, enrolled: !!full.totpEnabled, verified: mfaSatisfied({ user, headers: req.headers }) })
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req) && !req.headers.get('authorization')) return json({ error: 'Yêu cầu không hợp lệ.' }, 403)
  const { payload, user, full } = await ctx(req)
  if (!user || !full) return json({ error: 'Chưa đăng nhập.' }, 401)
  let body: { action?: string; code?: string; recovery?: string } = {}
  try {
    body = await req.json()
  } catch {}

  // Chống dò mã: 5 lần / 10 phút / tài khoản.
  if (body.action !== 'setup' && !(await hit(`mfa:${user.id}`, 5, 600)).ok) {
    await writeAudit({ payload, user } as never, 'mfa-throttled', 'users', user.id, null, null, user)
    return json({ error: 'Nhập sai quá nhiều lần. Hãy thử lại sau 10 phút.' }, 429)
  }

  if (body.action === 'setup') {
    if (full.totpEnabled) return json({ error: 'Tài khoản đã bật xác thực hai bước.' }, 409)
    const secret = newTotpSecret()
    await payload.update({ collection: 'users', id: user.id, data: { totpPendingEnc: seal(secret) }, overrideAccess: true })
    const uri = otpauthURI(secret, String(user.email))
    return json({ secret, uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) })
  }

  if (body.action === 'enable') {
    if (full.totpEnabled) return json({ error: 'Tài khoản đã bật xác thực hai bước.' }, 409)
    if (!full.totpPendingEnc) return json({ error: 'Hãy bắt đầu đăng ký lại.' }, 400)
    const secret = unseal(String(full.totpPendingEnc))
    const step = verifyTotp(secret, String(body.code || ''), 0)
    if (step === null) return json({ error: 'Mã không đúng. Kiểm tra giờ trên điện thoại và thử lại.' }, 400)
    const codes = newRecoveryCodes()
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { totpSecretEnc: seal(secret), totpPendingEnc: null, totpEnabled: true, totpLastStep: step, recoveryHashes: codes.map(hashRecovery) },
      overrideAccess: true,
    })
    await writeAudit({ payload, user } as never, 'mfa-enrolled', 'users', user.id, null, null, user)
    const proof = issueMfaProof(user.id, user._sid)
    return json({ ok: true, recoveryCodes: codes, proof }, 200, { 'set-cookie': mfaCookie(proof) })
  }

  if (body.action === 'verify') {
    if (!full.totpEnabled || !full.totpSecretEnc) return json({ error: 'Tài khoản chưa đăng ký xác thực hai bước.', enroll: true }, 400)
    let ok = false
    let how = 'totp'
    if (body.code) {
      const step = verifyTotp(unseal(String(full.totpSecretEnc)), String(body.code), Number(full.totpLastStep || 0))
      if (step !== null) {
        ok = true
        await payload.update({ collection: 'users', id: user.id, data: { totpLastStep: step }, overrideAccess: true })
      }
    } else if (body.recovery) {
      const list = (full.recoveryHashes as string[] | null) || []
      const h = hashRecovery(body.recovery)
      if (list.includes(h)) {
        ok = true
        how = 'recovery'
        await payload.update({ collection: 'users', id: user.id, data: { recoveryHashes: list.filter((x) => x !== h) }, overrideAccess: true })
      }
    }
    if (!ok) {
      await writeAudit({ payload, user } as never, 'mfa-failed', 'users', user.id, null, null, user)
      return json({ error: 'Mã không đúng hoặc đã được dùng.' }, 400)
    }
    await writeAudit({ payload, user } as never, how === 'recovery' ? 'mfa-recovery-used' : 'mfa-verified', 'users', user.id, null, null, user)
    const proof = issueMfaProof(user.id, user._sid)
    const left = how === 'recovery' ? ((full.recoveryHashes as string[]).length - 1) : undefined
    return json({ ok: true, proof, recoveryLeft: left }, 200, { 'set-cookie': mfaCookie(proof) })
  }

  if (body.action === 'logout') return json({ ok: true }, 200, { 'set-cookie': `${MFA_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict` })
  return json({ error: 'Thao tác không hợp lệ.' }, 400)
}
