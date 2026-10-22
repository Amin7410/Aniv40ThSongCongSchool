import type { Metadata } from 'next'
import Link from 'next/link'
import { payload } from '@/lib/data'
import { QuizCard } from '@/components/proto/Event'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Câu đố 40 năm' }

export default async function QuizPage() {
  const r = await (await payload()).find({ collection: 'quiz-questions', limit: 50, sort: 'order', depth: 0 })
  const qs = r.docs.map((q) => ({ q: q.question, a: q.options || [], c: q.correctIndex, e: q.explanation || '' }))
  return (
    <>
      <section className="zone-hero">
        <div className="zone-hero-in">
          <Link className="back" href="/dai-le">‹ Đại lễ 40 năm</Link>
          <h1>Minigame lịch sử trường</h1>
          <p>Trắc nghiệm vui {qs.length} câu về chặng đường 40 năm.</p>
        </div>
      </section>
      <div className="section"><div className="card" style={{ maxWidth: 760, margin: '0 auto' }}><QuizCard qs={qs} /></div></div>
    </>
  )
}
