import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getApproved, getEvent, getSite, getZone, payload } from '@/lib/data'
import { zoneItems, type Tribute } from '@/lib/view'
import { ZoneView } from '@/components/proto/ZoneView'
import type { Pin } from '@/components/proto/AlumniMap'

export const dynamic = 'force-dynamic'

type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const z = await getZone((await params).slug)
  return z ? { title: z.title, description: z.description || undefined } : {}
}

type City = { id: number; code: string; name: string; lat: number; lng: number }

export default async function ZonePage({ params }: P) {
  const { slug } = await params
  const z = await getZone(slug)
  if (!z) notFound()
  const [items, site, ev] = await Promise.all([zoneItems(z), getSite(), getEvent()])

  const tribs: Record<number, Tribute[]> = {}
  if (z.type === 'leaders' || z.type === 'staff') {
    const r = await getApproved('tribute', 2000)
    for (const d of r.docs as Array<{ id: number; name: string; cohort?: string | null; message?: string | null; createdAt: string; tributeTo?: number | { id: number } | null }>) {
      const id = typeof d.tributeTo === 'object' && d.tributeTo ? d.tributeTo.id : (d.tributeTo as number)
      if (id) (tribs[id] = tribs[id] || []).push({ id: d.id, name: d.name, cohort: d.cohort, text: d.message || '', at: d.createdAt })
    }
  }

  let pins: Pin[] = []
  let cities: Array<{ code: string; name: string }> = []
  if (z.type === 'alumni') {
    const [pr, cr] = await Promise.all([getApproved('pin', 2000), (await payload()).find({ collection: 'cities', limit: 500, sort: 'name', depth: 0 })])
    const cs = cr.docs as unknown as City[]
    cities = cs.map((c) => ({ code: c.code, name: c.name }))
    pins = (pr.docs as Array<{ id: number; name: string; cohort?: string | null; city?: number | City | null; payload?: unknown }>).flatMap((p) => {
      const c = typeof p.city === 'object' && p.city ? p.city : cs.find((x) => x.id === p.city)
      return c ? [{ id: p.id, name: p.name, khoa: p.cohort || '', work: (p.payload as { workplace?: string })?.workplace || '', city: c.name, lat: c.lat, lng: c.lng }] : []
    })
  }

  return (
    <>
      <section className="zone-hero">
        <div className="zone-hero-in">
          <Link className="back" href="/">‹ Về gian trung tâm</Link>
          <h1>{z.title}</h1>
          {z.description && <p>{z.description}</p>}
        </div>
      </section>
      <div className="section">
        <ZoneView
          zone={{ slug: z.slug, title: z.title, type: z.type, categories: z.categories || [] }}
          items={items}
          school={site.schoolName}
          tribs={tribs}
          pins={pins}
          cities={cities}
          campaign={{ start: ev.campaignStart as string, end: ev.campaignEnd as string, closed: ev.submissionsOpen === false }}
        />
      </div>
    </>
  )
}
