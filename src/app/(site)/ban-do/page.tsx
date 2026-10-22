import { redirect } from 'next/navigation'
import { getZones } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** Bản đồ cựu học sinh nằm trong khu Cựu học sinh (như prototype); giữ đường dẫn cũ. */
export default async function MapPage() {
  const z = (await getZones()).find((x) => x.type === 'alumni')
  redirect(z ? `/khu/${z.slug}#ban-do` : '/')
}
