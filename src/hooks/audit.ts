import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from 'payload'

const SENSITIVE = new Set(['password', 'hash', 'salt', 'resetPasswordToken', 'apiKey', 'contact', 'ipHash', 'editTokenHash', 'sessions', 'totpSecretEnc', 'totpPendingEnc', 'recoveryHashes', 'totpLastStep'])

function redact(v: unknown): unknown {
  if (!v || typeof v !== 'object') return v
  if (Array.isArray(v)) return v.map(redact)
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v)) out[k] = SENSITIVE.has(k) ? '[ẩn]' : redact(val)
  return out
}

/** Chỉ ghi các trường thay đổi để nhật ký gọn. */
function diff(before: Record<string, unknown> | undefined, after: Record<string, unknown>) {
  const b: Record<string, unknown> = {}
  const a: Record<string, unknown> = {}
  for (const k of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    if (k === 'updatedAt' || k === 'createdAt') continue
    if (JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k])) {
      b[k] = before?.[k]
      a[k] = after?.[k]
    }
  }
  return { before: redact(b), after: redact(a) }
}

export async function writeAudit(req: PayloadRequest, action: string, target: string, docId: string | number | null, before?: unknown, after?: unknown, actorOverride?: { id: string | number; email?: string }) {
  const actor = actorOverride || (req.user as { id: string | number; email?: string } | null)
  try {
    await req.payload.create({
      collection: 'audit-logs',
      data: {
        actor: actor ? (actor.id as number) : undefined,
        actorLabel: actor ? String(actor.email || actor.id) : 'khách',
        action,
        target,
        docId: docId == null ? '' : String(docId),
        before: before as Record<string, unknown>,
        after: after as Record<string, unknown>,
      },
      overrideAccess: true,
      // Chỉ chuyển tiếp req thật của Payload (để dùng chung transaction); gọi từ route riêng thì không.
      req: (req as { payloadAPI?: string }).payloadAPI ? req : undefined,
    })
  } catch (e) {
    req.payload.logger.error({ msg: 'audit log failed', err: e })
  }
}

export const auditAfterChange: CollectionAfterChangeHook = async ({ req, doc, previousDoc, operation, collection }) => {
  if (!req.user) return doc // thao tác của khách (gửi UGC) được ghi ở API riêng
  const { before, after } = diff(previousDoc, doc)
  await writeAudit(req, operation, collection.slug, doc.id, before, after)
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ req, doc, collection }) => {
  await writeAudit(req, 'delete', collection.slug, doc.id, redact(doc), null)
  return doc
}

export const auditGlobal: GlobalAfterChangeHook = async ({ req, doc, previousDoc, global }) => {
  const { before, after } = diff(previousDoc, doc)
  await writeAudit(req, 'update', `global:${global.slug}`, null, before, after)
  return doc
}
