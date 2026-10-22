'use client'

import { useState, useTransition, useEffect } from 'react'
import { Modal } from './Modal'
import { KHOAS } from '@/lib/cohorts'
import type { GB } from '@/lib/home'

const dstr = (t: string | Date) => new Date(t).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export function WishesSection({ initialList, totalCount }: { initialList: GB[]; totalCount: number }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [cohort, setCohort] = useState('')
  const [wishes, setWishes] = useState<GB[]>(initialList)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  // Khi mở modal lần đầu hoặc đổi bộ lọc, tải danh sách đầy đủ từ API
  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)

    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (cohort) params.set('cohort', cohort)

    const url = `/api/public/guestbook?${params.toString()}`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        startTransition(() => {
          if (Array.isArray(data.docs)) {
            setWishes(data.docs)
          }
        })
      })
      .catch(() => {
        // Nếu lỗi mạng thì dùng danh sách khởi tạo
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, search, cohort])

  return (
    <>
      {/* Danh sách xem trước trên trang gốc */}
      {initialList.length ? (
        <div className="gb-list">
          {initialList.slice(0, 10).map((g) => (
            <div key={g.id} className="gb">
              <p>{g.msg}</p>
              <small>
                {g.name}
                {g.khoa ? ', ' + g.khoa : ''}, {dstr(g.at)}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="note" style={{ marginTop: 14 }}>
          Chưa có lời chúc nào được đăng.
        </p>
      )}

      {/* Nút mở cửa sổ 75% xem đầy đủ */}
      <button
        type="button"
        className="btn gold"
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '11px 16px',
          fontWeight: 600,
          cursor: 'pointer',
          borderRadius: 6,
        }}
        aria-haspopup="dialog"
      >
        <span>Xem tất cả lời chúc</span>
        <span
          style={{
            fontSize: '12.5px',
            opacity: 0.9,
            background: 'rgba(0,0,0,0.18)',
            padding: '2px 8px',
            borderRadius: 12,
          }}
        >
          {totalCount || initialList.length} lời chúc
        </span>
      </button>

      {/* Cửa sổ Modal chiếm 75% khung hình, làm mờ trang gốc */}
      <Modal open={open} onClose={() => setOpen(false)} className="wishes-75" label="Sổ lời chúc đầy đủ">
        <div className="wishes-modal-content">
          <div className="wishes-modal-header">
            <div>
              <h3 className="m-title" style={{ margin: '0 0 4px', fontSize: '26px' }}>
                Sổ lời chúc mừng 40 năm
              </h3>
              <p className="meta" style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
                {loading ? 'Đang cập nhật danh sách...' : `Hiển thị ${wishes.length} lời chúc từ các thế hệ thầy cô và học sinh`}
              </p>
            </div>

            {/* Thanh công cụ tìm kiếm và lọc */}
            <div className="wishes-toolbar">
              <input
                type="search"
                className="wishes-search"
                placeholder="Tìm theo tên hoặc nội dung lời chúc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm kiếm lời chúc"
              />
              <select
                className="wishes-select"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                aria-label="Lọc theo khóa học"
              >
                <option value="">Tất cả các khóa / đơn vị</option>
                {KHOAS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lưới hiển thị thẻ lời chúc, cuộn thoải mái */}
          <div className="wishes-grid" role="feed" aria-busy={loading}>
            {wishes.map((w) => (
              <article key={w.id} className="wish-card">
                <div className="wish-quote" aria-hidden="true">“</div>
                <p className="wish-msg">{w.msg}</p>
                <div className="wish-footer">
                  <span className="wish-author">{w.name}</span>
                  {w.khoa && <span className="wish-cohort">{w.khoa}</span>}
                  <time className="wish-date">{dstr(w.at)}</time>
                </div>
              </article>
            ))}

            {!wishes.length && !loading && (
              <div className="wish-empty">
                <p>Không tìm thấy lời chúc nào phù hợp với bộ lọc.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
