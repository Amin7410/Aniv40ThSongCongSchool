'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Thanh tab các khu (giống prototype): mục đang xem tô vàng và tự cuộn vào giữa trên điện thoại. */
export function ZoneTabs({ zones }: { zones: Array<{ slug: string; short: string }> }) {
  const path = usePathname()
  const nav = useRef<HTMLElement>(null)
  const items = [{ href: '/', label: 'Gian trung tâm' }, ...zones.map((z) => ({ href: `/khu/${z.slug}`, label: z.short })), { href: '/dai-le', label: 'Đại lễ 40 năm' }]
  useEffect(() => {
    const t = nav.current
    const a = t?.querySelector<HTMLElement>('[aria-current="page"]')
    if (t && a) t.scrollLeft = a.offsetLeft - t.clientWidth / 2 + a.offsetWidth / 2
  }, [path])
  return (
    <div className="tabs-wrap">
      <nav className="tabs" ref={nav} aria-label="Các khu trưng bày">
        {items.map((i) => {
          const cur = i.href === '/' ? path === '/' : path.startsWith(i.href)
          return (
            <Link key={i.href} href={i.href} aria-current={cur ? 'page' : undefined}>
              {i.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
