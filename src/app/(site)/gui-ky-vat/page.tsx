import Link from 'next/link'
import type { Metadata } from 'next'
import { getEvent } from '@/lib/data'
import { SubmitForm } from '@/components/SubmitForm'
import { MEMORY_TYPES } from '@/lib/schemas'
import { KHOAS } from '@/lib/cohorts'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Gửi kỷ vật – Hiến tư liệu' }

export default async function SendMemory() {
  const ev = await getEvent()
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
  return (
    <>
      <section className="zone-hero">
        <div className="zone-hero-in">
          <Link className="back" href="/">‹ Về gian trung tâm</Link>
          <h1>Gửi kỷ vật – Hiến tư liệu</h1>
          <p>Chiến dịch {fmt(ev.campaignStart)} – {fmt(ev.campaignEnd)}. Ảnh cũ, lưu bút, báo tường, giấy khen, đồng phục… sẽ được nhà trường duyệt và xếp vào Góc ký ức theo thế hệ.</p>
        </div>
      </section>
      <div className="section"><div className="ev-grid">
        <section className="card">
          <h2>Kỷ vật kèm câu chuyện</h2>
          <SubmitForm
            kind="memory"
            closed={ev.submissionsOpen === false}
            submitLabel="Gửi kỷ vật"
            successText="Cảm ơn bạn đã gửi kỷ vật. Nhà trường sẽ duyệt và liên hệ nếu cần thêm thông tin."
            fields={[
              { name: 'name', label: 'Người gửi', required: true, max: 80, half: true },
              { name: 'cohort', label: 'Khóa học', type: 'select', options: KHOAS, required: true, placeholder: 'Chọn khóa học…', half: true },
              { name: 'title', label: 'Tên kỷ vật', required: true, max: 100, half: true },
              { name: 'type', label: 'Loại kỷ vật', type: 'select', options: [...MEMORY_TYPES], required: true, half: true },
              { name: 'year', label: 'Năm (ước đoán)', type: 'number', half: true },
              { name: 'contact', label: 'SĐT/Email (không công khai)', max: 120, half: true, hint: 'Để nhà trường liên hệ khi cần mượn hiện vật gốc.' },
              { name: 'message', label: 'Câu chuyện', type: 'textarea', required: true, max: 1200 },
              { name: 'files', label: 'Ảnh (tối đa 5)', type: 'files', maxFiles: 5, hint: 'JPG, PNG hoặc ảnh iPhone. Ảnh được tự nén và xóa thông tin vị trí.' },
            ]}
          />
        </section>
        <section className="card">
          <h2>Chỉ gửi ảnh hoạt động</h2>
          <p className="lead">Ảnh hoạt động Đoàn, phong trào, cơ sở vật chất qua các thời kỳ.</p>
          <SubmitForm
            kind="photo"
            closed={ev.submissionsOpen === false}
            submitLabel="Gửi ảnh"
            successText="Cảm ơn bạn. Ảnh sẽ được duyệt trước khi đưa vào khu trưng bày."
            fields={[
              { name: 'name', label: 'Người gửi', required: true, max: 80, half: true },
              { name: 'cohort', label: 'Khóa học', type: 'select', options: KHOAS, placeholder: 'Chọn khóa học…', half: true },
              { name: 'year', label: 'Năm chụp', type: 'number', half: true },
              { name: 'contact', label: 'SĐT/Email (không công khai)', max: 120, half: true },
              { name: 'message', label: 'Chú thích ảnh', type: 'textarea', required: true, max: 400 },
              { name: 'files', label: 'Ảnh', type: 'files', maxFiles: 5 },
            ]}
          />
          <p className="note" style={{ marginTop: 14 }}>Vui lòng không gửi ảnh cá nhân của học sinh đang theo học khi chưa có sự đồng ý của cha mẹ.</p>
        </section>
      </div></div>
    </>
  )
}
