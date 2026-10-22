import type { NextRequest } from 'next/server'
import { hub } from '@/lib/hub'
import { hit } from '@/lib/ratelimit'
import { ipHash } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_PER_REPLICA = Number(process.env.SSE_MAX_CONNECTIONS || 4000)
const g = globalThis as unknown as { __sseCount?: number }

/** SSE: số người xem, cảm xúc gộp theo giây, số nến. Quá tải → báo client chuyển sang polling. */
export async function GET(req: NextRequest) {
  g.__sseCount ||= 0
  const perIp = await hit(`sse:${ipHash(req)}`, 6, 60)
  if (g.__sseCount >= MAX_PER_REPLICA || !perIp.ok)
    return new Response('retry: 30000\nevent: busy\ndata: {}\n\n', { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } })

  const h = hub()
  const connId = crypto.randomUUID()
  const enc = new TextEncoder()
  let closed = false
  let cleanup = () => {}

  const stream = new ReadableStream({
    start(ctrl) {
      g.__sseCount!++
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          cleanup()
        }
      }
      const listener = (e: string, d: unknown) => send(e, d)
      h.listeners.add(listener)
      ctrl.enqueue(enc.encode('retry: 5000\n\n'))
      send('hello', { viewers: h.viewers })
      void h.heartbeat(connId)
      const beat = setInterval(() => {
        void h.heartbeat(connId)
        if (!closed) ctrl.enqueue(enc.encode(': ping\n\n'))
      }, 20_000)
      cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(beat)
        h.listeners.delete(listener)
        void h.leave(connId)
        g.__sseCount!--
        try {
          ctrl.close()
        } catch {}
      }
      req.signal.addEventListener('abort', () => cleanup())
    },
    cancel() {
      cleanup()
    },
  })
  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' },
  })
}
