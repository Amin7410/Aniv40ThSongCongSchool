import { NextResponse, type NextRequest } from 'next/server'

/**
 * 1) CSP có nonce cho mọi trang HTML (Next.js tự gắn nonce vào script của nó khi thấy CSP trong request).
 *    Không còn 'unsafe-inline' cho script → XSS chèn được thẻ <script> cũng không chạy.
 * 2) Vào /admin khi đã đăng nhập bước 1 nhưng chưa qua bước 2 → chuyển tới /mfa.
 *    (Đây chỉ là điều hướng tiện dụng; quyền thực sự được kiểm tra ở máy chủ trong access/roles.ts.)
 */
const ADMIN_OPEN = /^\/admin\/(login|logout|forgot|reset|create-first-user)(\/|$)/

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname.startsWith('/admin') && !ADMIN_OPEN.test(pathname) && req.cookies.get('payload-token') && !req.cookies.get('mfa')) {
    const url = req.nextUrl.clone()
    url.pathname = '/mfa'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const dev = process.env.NODE_ENV !== 'production'
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? ' ws:' : ''}`,
    'frame-src https://www.youtube-nocookie.com https://www.facebook.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  const headers = new Headers(req.headers)
  headers.set('x-nonce', nonce)
  headers.set('content-security-policy', csp)
  const res = NextResponse.next({ request: { headers } })
  res.headers.set('content-security-policy', csp)
  return res
}

export const config = {
  // Bỏ qua API, tệp tĩnh, media — chỉ áp cho trang HTML.
  matcher: [{ source: '/((?!api|_next/static|_next/image|media|favicon.ico).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }] }],
}
