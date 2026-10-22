/**
 * Khởi tạo dữ liệu nền: 8 khu trưng bày, danh mục thành phố, tài khoản Super Admin đầu tiên.
 *   pnpm seed                      → dữ liệu nền (an toàn chạy lại nhiều lần)
 *   pnpm seed --demo               → thêm dữ liệu MINH HỌA để demo/kiểm thử. KHÔNG chạy trên production.
 * Biến môi trường: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (bắt buộc lần đầu).
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { CITIES, DEMO, ZONES } from './data'

const demo = process.argv.includes('--demo')

async function main() {
  if (demo && process.env.NODE_ENV === 'production') throw new Error('Không nạp dữ liệu minh họa trên production.')
  const payload = await getPayload({ config })

  const zoneIds: Record<string, number> = {}
  for (const z of ZONES) {
    const found = await payload.find({ collection: 'zones', where: { slug: { equals: z.slug } }, limit: 1 })
    const doc = found.docs[0]
      ? await payload.update({ collection: 'zones', id: found.docs[0].id, data: z })
      : await payload.create({ collection: 'zones', data: z })
    zoneIds[z.slug] = doc.id as number
  }
  payload.logger.info(`Khu trưng bày: ${ZONES.length}`)

  for (const c of CITIES) {
    const found = await payload.find({ collection: 'cities', where: { code: { equals: c.code } }, limit: 1 })
    if (!found.docs[0]) await payload.create({ collection: 'cities', data: c })
  }
  payload.logger.info(`Thành phố: ${CITIES.length}`)

  const users = await payload.count({ collection: 'users' })
  if (!users.totalDocs) {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD
    if (!email || !password || password.length < 12) throw new Error('Đặt SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD (≥ 12 ký tự) để tạo Super Admin đầu tiên.')
    await payload.create({ collection: 'users', data: { email, password, name: 'Super Admin', role: 'super' } })
    payload.logger.info(`Đã tạo Super Admin: ${email}`)
  }

  if (demo) {
    const existing = await payload.count({ collection: 'exhibits' })
    if (!existing.totalDocs) {
      const created: Record<string, number[]> = {}
      for (const [slug, items] of Object.entries(DEMO.exhibits)) {
        created[slug] = []
        for (const [i, it] of (items as Array<Record<string, unknown>>).entries()) {
          const doc = await payload.create({ collection: 'exhibits', data: { ...it, zone: zoneIds[slug], sortOrder: i, _status: 'published' } as never })
          created[slug].push(doc.id as number)
        }
      }
      for (const [i, m] of DEMO.milestones.entries()) await payload.create({ collection: 'milestones', data: { ...m, order: i } })
      for (const [i, q] of DEMO.quiz.entries()) await payload.create({ collection: 'quiz-questions', data: { ...q, order: i } })
      const sub = (data: Record<string, unknown>) => payload.create({ collection: 'submissions', overrideAccess: true, data: { status: 'approved', consentVersion: 'demo', ...data } as never })
      for (const [name, cohort, message] of DEMO.guestbook) await sub({ kind: 'guestbook', name, cohort, message })
      for (const [zone, idx, name, cohort, message] of DEMO.tributes as Array<[string, number, string, string, string]>)
        await sub({ kind: 'tribute', name, cohort, message, tributeTo: created[zone][idx] })
      for (const [name, amount] of DEMO.donations as Array<[string, number]>) await sub({ kind: 'donation', name, payload: { amount }, confirmedAmount: amount })
      for (const [code, name, cohort, workplace] of DEMO.pins) {
        const c = await payload.find({ collection: 'cities', where: { code: { equals: code } }, limit: 1 })
        if (c.docs[0]) await sub({ kind: 'pin', name, cohort, city: c.docs[0].id, payload: { workplace } })
      }
      await payload.updateGlobal({ slug: 'site-settings', data: { decisionNo: '…/QĐ-UB', decisionIssuer: 'Ủy ban nhân dân tỉnh ……', contactEmail: 'lienhe@example.edu.vn' } })
      payload.logger.info('Đã nạp dữ liệu MINH HỌA.')
    }
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
