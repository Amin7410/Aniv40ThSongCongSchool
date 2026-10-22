'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Modal } from './Modal'
import { SubmitForm } from '../SubmitForm'
import { MEMORY_TYPES } from '@/lib/schemas'
import { KHOAS } from '@/lib/cohorts'

type Props = {
  compact?: boolean
  start?: string | null
  end?: string | null
  items: number
  people: number
  gens: number
  closed?: boolean
}

const dstr = (d: Date) => d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

/** Thẻ chiến dịch "Gửi kỷ vật – Hiến tư liệu" (giống prototype) kèm biểu mẫu gửi kỷ vật trong hộp thoại. */
export function CampaignCard({ compact, start, end, items, people, gens, closed }: Props) {
  const [open, setOpen] = useState(false)
  const st = start ? new Date(start + 'T00:00:00+07:00') : null
  const en = end ? new Date(end + 'T23:59:59+07:00') : null
  const now = new Date()
  const state = !st || !en ? 'open' : now < st ? 'soon' : now > en ? 'closed' : 'open'
  const days = en ? Math.max(1, Math.ceil((en.getTime() - now.getTime()) / 864e5)) : 0
  const pill = state === 'open' ? (en ? `Đang mở đến ${dstr(en)}, còn ${days} ngày` : 'Đang mở') : state === 'soon' ? `Mở cổng từ ${dstr(st!)}` : `Đã khép lại ngày ${dstr(en!)}`
  return (
    <div className={`camp${compact ? ' compact' : ''}`}>
      <div>
        <span className="pill">{pill}</span>
        <h2>Gửi kỷ vật – Hiến tư liệu</h2>
        <p>Ảnh kỷ niệm, báo tường, áo đồng phục thế hệ đầu, lưu bút, giấy khen… Ban quản trị duyệt xong, kỷ vật tự động được xếp vào Góc ký ức của các Thế hệ theo khóa học của bạn.</p>
        <div className="acts2">
          <button className="btn gold" onClick={() => setOpen(true)} disabled={state !== 'open' || closed}>Gửi kỷ vật của bạn</button>
          {compact && <Link className="btn ghost-d" href="/khu/goc-ky-uc">Vào Góc ký ức</Link>}
        </div>
      </div>
      <div className="camp-stats">
        <div><b>{items}</b><span>kỷ vật đã trưng bày</span></div>
        <div><b>{people}</b><span>người gửi</span></div>
        <div><b>{gens}</b><span>thế hệ góp mặt</span></div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} narrow label="Gửi kỷ vật">
        <MemoryForm onCancel={() => setOpen(false)} closed={closed} />
      </Modal>
    </div>
  )
}

export function MemoryForm({ onCancel, closed }: { onCancel?: () => void; closed?: boolean }) {
  return (
    <>
      <h2 className="m-title">Gửi kỷ vật – Hiến tư liệu</h2>
      <p className="note">Kỷ vật được Ban quản trị duyệt rồi tự động xếp vào Góc ký ức của các Thế hệ, theo khóa học của bạn.</p>
      <SubmitForm
        kind="memory"
        closed={closed}
        onCancel={onCancel}
        submitLabel="Gửi kỷ vật"
        successText="Cảm ơn bạn đã gửi kỷ vật. Nhà trường sẽ duyệt và liên hệ nếu cần thêm thông tin."
        fields={[
          { name: 'name', label: 'Họ và tên', required: true, max: 80, placeholder: 'VD: Nguyễn Văn A', half: true },
          { name: 'cohort', label: 'Khóa học', type: 'select', options: KHOAS, required: true, half: true },
          { name: 'type', label: 'Loại kỷ vật', type: 'select', options: [...MEMORY_TYPES], required: true, half: true },
          { name: 'year', label: 'Năm (ước đoán)', type: 'number', placeholder: 'VD: 1995', half: true },
          { name: 'title', label: 'Tên kỷ vật', required: true, max: 100, placeholder: 'VD: Chiếc áo trắng ký tên cả lớp 12A' },
          { name: 'message', label: 'Câu chuyện của kỷ vật', type: 'textarea', required: true, max: 1200, placeholder: 'Kỷ vật gắn với kỷ niệm nào, những ai, năm nào…' },
          { name: 'files', label: 'Ảnh chụp kỷ vật, tối đa 5 ảnh', type: 'files', maxFiles: 5, hint: 'Báo tường, lưu bút, giấy khen nên chụp thẳng, đủ sáng, không lóa. Ảnh được tự nén và xóa thông tin vị trí.' },
          { name: 'contact', label: 'SĐT hoặc email (không công khai)', max: 120, hint: 'Để nhà trường liên hệ khi cần mượn hiện vật gốc.' },
        ]}
      />
    </>
  )
}
