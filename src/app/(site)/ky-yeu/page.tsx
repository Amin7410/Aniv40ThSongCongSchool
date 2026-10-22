import type { Metadata } from 'next'
import Link from 'next/link'
import { payload, imgUrl, type MediaDoc } from '@/lib/data'
import { Flipbook } from '@/components/Flipbook'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Kỷ yếu số' }

export default async function YearbookPage() {
  const r = await (await payload()).find({ collection: 'yearbooks', where: { and: [{ published: { equals: true } }, { state: { equals: 'ready' } }] }, sort: 'order', depth: 1, limit: 10, overrideAccess: false })
  const books = r.docs.map((b) => ({
    id: b.id,
    title: b.title,
    pages: ((b.pages || []) as Array<number | MediaDoc>).map((m) => ({ src: imgUrl(m, 'full') || '', alt: typeof m === 'object' ? m.alt || '' : '' })).filter((p) => p.src),
  }))
  return (
    <>
      <section className="zone-hero">
        <div className="zone-hero-in">
          <Link className="back" href="/">‹ Về gian trung tâm</Link>
          <h1>Kỷ yếu 40 năm</h1>
          <p>Lật từng trang kỷ yếu số. Dùng phím ← → hoặc vuốt ngang trên điện thoại.</p>
        </div>
      </section>
      <div className="section">
        <div className="book-wrap">
          {books.length ? books.map((b) => <Flipbook key={b.id} title={b.title} pages={b.pages} />) : <p className="note center" style={{ color: '#f0dcb4' }}>Kỷ yếu 40 năm đang được hoàn thiện và sẽ ra mắt dịp Đại lễ.</p>}
        </div>
      </div>
    </>
  )
}
