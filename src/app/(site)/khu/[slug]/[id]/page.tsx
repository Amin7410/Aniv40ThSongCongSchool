import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getExhibit, getSite, getZone, imgUrl, type MediaDoc } from '@/lib/data'
import { tributesOf, zoneItems } from '@/lib/view'
import { ItemView } from '@/components/proto/ItemView'

export const dynamic = 'force-dynamic'

type P = { params: Promise<{ slug: string; id: string }> }

async function load(p: P) {
  const { slug, id } = await p.params
  const z = await getZone(slug)
  const n = Number(id)
  if (!z || !Number.isInteger(n)) return null
  const e = await getExhibit(n)
  if (!e) return null
  const zid = typeof e.zone === 'object' ? e.zone.id : e.zone
  if (zid !== z.id) return null
  return { z, e }
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const r = await load(p)
  if (!r) return {}
  const m = (r.e.media || []).find((x) => typeof x === 'object') as MediaDoc | undefined
  const img = imgUrl(m, 'card')
  return { title: r.e.title, description: r.e.description?.slice(0, 160) || r.z.title, openGraph: img ? { images: [img] } : undefined }
}

export default async function ExhibitPage(p: P) {
  const r = await load(p)
  if (!r) notFound()
  const { z, e } = r
  const [items, site] = await Promise.all([zoneItems(z), getSite()])
  const i = items.findIndex((x) => x.id === e.id)
  const it = items[i]
  if (!it) notFound()
  const tribs = z.type === 'leaders' || z.type === 'staff' ? await tributesOf(e.id) : undefined
  const prev = i > 0 ? items[i - 1] : null
  const next = i < items.length - 1 ? items[i + 1] : null
  return (
    <>
      <section className="zone-hero">
        <div className="zone-hero-in">
          <Link className="back" href={`/khu/${z.slug}`}>‹ {z.title}</Link>
        </div>
      </section>
      <div className="section">
        <div className="card" style={{ padding: 'clamp(16px,3vw,28px)' }}>
          <ItemView zoneType={z.type} zoneTitle={z.title} it={it} school={site.schoolName} tribs={tribs} />
        </div>
        <div className="m-nav" style={{ marginTop: 16 }}>
          {prev ? <Link className="btn ghost" href={`/khu/${z.slug}/${prev.id}`}>‹ {prev.title}</Link> : <span />}
          {next ? <Link className="btn ghost" href={`/khu/${z.slug}/${next.id}`}>{next.title} ›</Link> : <span />}
        </div>
      </div>
    </>
  )
}
