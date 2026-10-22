import type { Metadata } from 'next'
import Link from 'next/link'
import { getEvent, payload } from '@/lib/data'
import { embedURL, liveState } from '@/lib/live'
import { dstr, fundSummary, guestbook, guestbookCount } from '@/lib/home'
import { zoneItems } from '@/lib/view'
import { getZones } from '@/lib/data'
import { SubmitForm } from '@/components/SubmitForm'
import { CampaignCard } from '@/components/proto/Campaign'
import { CandleCard, FundCard, LiveBlock } from '@/components/proto/Event'
import { WishesSection } from '@/components/proto/WishesSection'
import { KHOAS } from '@/lib/cohorts'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Đại lễ 40 năm (1986 – 2026)' }

export default async function EventPage() {
  const [ev, fund, gb, zones, gbTotal] = await Promise.all([
    getEvent(),
    fundSummary(),
    guestbook(30),
    getZones(),
    guestbookCount(),
  ])
  const st = liveState(ev)
  const closed = ev.submissionsOpen === false
  const memZ = zones.find((z) => z.type === 'memories')
  const mem = memZ ? await zoneItems(memZ) : []
  const people = new Set(mem.map((m) => m.by).filter(Boolean)).size
  const gens = new Set(mem.map((m) => Math.min(3, Math.max(0, Math.floor((+(/\d{4}/.exec(m.khoa)?.[0] || m.year || 0) - 1986) / 10))))).size

  return (
    <>
      <section className="zone-hero">
        <div className="zone-hero-in">
          <Link className="back" href="/">‹ Về gian trung tâm</Link>
          <h1>Đại lễ 40 năm (1986 – 2026)</h1>
          <p>Cùng hướng về {String(ev.title || 'lễ kỷ niệm').toLowerCase()}: gửi lời chúc, thắp nến tri ân, gửi kỷ vật và chung tay xây dựng {fund.name}.</p>
        </div>
      </section>
      <div className="section">
        <div className="ev-grid">
          <div style={{ gridColumn: '1/-1' }}>
            <CampaignCard compact start={ev.campaignStart as string} end={ev.campaignEnd as string} items={mem.length} people={people} gens={gens} closed={closed} />
          </div>
          <div className="card wide">
            <h2>Xem trực tiếp</h2>
            <p className="lead">Cựu học sinh ở xa cùng hướng về trường: xem buổi lễ, thả cảm xúc, và quay lại tham quan phòng truyền thống bất cứ lúc nào.</p>
            <LiveBlock ev={{ startsAt: ev.startsAt, liveMode: ev.liveMode, liveHours: ev.liveHours }} initial={st} embed={embedURL(ev.liveUrl as string)} liveUrl={ev.liveUrl as string} staticMode={!!ev.staticFallback} />
          </div>
          <div className="card" id="so-loi-chuc">
            <span id="so-luu-niem" style={{ display: 'none' }} />
            <h2>Sổ lời chúc</h2>
            <p className="lead">Lời chúc được Ban quản trị duyệt trước khi hiển thị.</p>
            <SubmitForm
              kind="guestbook"
              closed={closed}
              submitLabel="Gửi lời chúc"
              successText="Đã gửi lời chúc. Lời chúc sẽ hiển thị sau khi được duyệt."
              fields={[
                { name: 'name', label: 'Họ và tên', required: true, max: 80, placeholder: 'VD: Nguyễn Văn A', half: true },
                { name: 'cohort', label: 'Khóa học, đơn vị', type: 'select', options: KHOAS, placeholder: 'Chọn khóa học (K1 – K40)…', half: true },
                { name: 'contact', label: 'Email liên hệ (không bắt buộc)', type: 'email', max: 120, placeholder: 'VD: email@example.com', hint: 'Để nhà trường và ban liên lạc gửi lời cảm ơn / kết nối khi cần (không công khai).' },
                { name: 'message', label: 'Lời chúc', type: 'textarea', required: true, max: 600, placeholder: 'Viết lời chúc gửi nhà trường…' },
              ]}
            />
            <WishesSection initialList={gb} totalCount={gbTotal} />
          </div>
          <div className="card center">
            <h2>Thắp nến tri ân</h2>
            <p className="lead">Mỗi người thắp một ngọn nến tri ân các thế hệ thầy cô đã cống hiến cho nhà trường.</p>
            <CandleCard staticMode={!!ev.staticFallback} />
          </div>
          <div className="card">
            <h2>{fund.name}</h2>
            <p className="lead">Quét mã QR để chuyển khoản, sau đó báo đóng góp để Ban quản trị xác nhận.</p>
            <FundCard initial={fund} />
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Báo đóng góp của tôi</summary>
              <div style={{ marginTop: 12 }}>
                <SubmitForm
                  kind="donation"
                  closed={closed}
                  submitLabel="Gửi thông tin đóng góp"
                  successText="Đã gửi thông tin đóng góp. Ban quản trị sẽ xác nhận sau khi đối chiếu."
                  fields={[
                    { name: 'name', label: 'Tên hiển thị', max: 80, placeholder: 'VD: Lớp 12A1 khóa 2010 – 2013, hoặc Ẩn danh', half: true },
                    { name: 'amount', label: 'Số tiền (đồng)', type: 'number', required: true, placeholder: 'VD: 500000', half: true },
                    { name: 'cohort', label: 'Khóa học', type: 'select', options: KHOAS, placeholder: 'Chọn khóa học…', half: true },
                    { name: 'contact', label: 'SĐT/Email để xác nhận (không công khai)', max: 120, half: true },
                    { name: 'message', label: 'Ghi chú cho Ban quản trị', max: 200, placeholder: 'VD: Chuyển khoản lúc 9:00 ngày 10/11', hint: 'Ban quản trị đối chiếu sao kê rồi mới xác nhận.' },
                    { name: 'anonymous', label: 'Không công khai tên tôi', type: 'checkbox' },
                  ]}
                />
              </div>
            </details>
          </div>
        </div>
      </div>
    </>
  )
}
