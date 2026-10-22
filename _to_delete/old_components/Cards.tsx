import Link from 'next/link'
import { firstMedia, imgUrl, type ExhibitDoc, type ZoneDoc } from '@/lib/data'

const LAND = new Set(['gallery', 'campus', 'memories', 'awards'])
const AWARD_ICON: Record<string, string> = { medal: '🎖', flag: '🚩', cup: '🏆', cert: '📜' }

export function subtitleOf(e: ExhibitDoc, z: ZoneDoc): string {
  if (z.type === 'staff') {
    const st = e.staffStatus === 'retired' ? 'Nghỉ hưu' : e.staffStatus === 'moved' ? 'Chuyển công tác' : e.staffStatus === 'current' ? 'Đang công tác' : ''
    return [e.subtitle, st, e.yearStart ? `${e.yearStart} – ${e.yearEnd || 'nay'}` : ''].filter(Boolean).join(' · ')
  }
  if (z.type === 'leaders') return [e.category, e.subtitle].filter(Boolean).join(', ')
  if (z.type === 'awards') return [e.awardedBy, e.year].filter(Boolean).join(', ')
  if (z.type === 'gallery' || z.type === 'campus') return [e.year, e.category].filter(Boolean).join(', ')
  if (z.type === 'memories') return [e.memoryType, e.cohort].filter(Boolean).join(' · ')
  return [e.subtitle, e.category].filter(Boolean).join(' · ')
}

export function ExhibitCard({ e, z }: { e: ExhibitDoc; z: ZoneDoc }) {
  const m = firstMedia(e)
  const src = imgUrl(m, 'card')
  return (
    <Link className={`card${LAND.has(z.type) ? ' land' : ''}`} href={`/khu/${z.slug}/${e.id}`}>
      <span className="ph">
        {src ? <img src={src} alt="" loading="lazy" className={m?.isHistorical ? 'old' : undefined} /> : <span className="ph-empty" aria-hidden="true">{z.type === 'awards' ? AWARD_ICON[e.awardKind || 'cert'] : e.title.trim().charAt(0)}</span>}
      </span>
      <span className="body">
        <b>{e.title}</b>
        <small>{subtitleOf(e, z)}</small>
      </span>
    </Link>
  )
}
