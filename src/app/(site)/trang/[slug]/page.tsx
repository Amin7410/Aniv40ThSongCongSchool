import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSite } from '@/lib/data'

export const dynamic = 'force-dynamic'

/**
 * Văn bản pháp lý mẫu — NHÀ TRƯỜNG VÀ PHÁP CHẾ PHẢI RÀ SOÁT trước khi go-live
 * (Luật BVDLCN 91/2025/QH15, Nghị định 356/2025/NĐ-CP).
 */
const PAGES: Record<string, { title: string; body: (s: { schoolName: string; contactEmail?: string | null }) => string[] }> = {
  'chinh-sach-rieng-tu': {
    title: 'Chính sách quyền riêng tư',
    body: (s) => [
      `${s.schoolName} là bên kiểm soát dữ liệu cá nhân thu thập qua trang Phòng truyền thống trực tuyến. Đơn vị kỹ thuật (THD CyberSecurity) xử lý dữ liệu theo hợp đồng với nhà trường.`,
      'Dữ liệu thu thập: họ tên, khóa học/lớp, nội dung bạn gửi (lời chúc, câu chuyện, ảnh), thông tin liên hệ nếu bạn tự nguyện cung cấp, thành phố khi thả ghim bản đồ. Chúng tôi không thu số định danh cá nhân, địa chỉ nhà hay vị trí chính xác.',
      'Mục đích: kiểm duyệt và trưng bày tư liệu, liên hệ lại về kỷ vật, xác nhận đóng góp quỹ học bổng, biên soạn kỷ yếu 40 năm.',
      'Thông tin kỹ thuật: địa chỉ IP chỉ được lưu dưới dạng mã băm một chiều để chống spam và tự xóa sau 90 ngày. Ảnh tải lên được xóa toàn bộ siêu dữ liệu (kể cả vị trí GPS). Trang không dùng cookie quảng cáo hay theo dõi; thống kê truy cập không định danh cá nhân.',
      'Thông tin liên hệ bạn cung cấp không bao giờ được công khai. Nội dung không được duyệt bị xóa sau 180 ngày.',
      'Toàn bộ dữ liệu và bản sao lưu được lưu trữ tại Việt Nam.',
      `Bạn có quyền yêu cầu xem, sửa, xóa dữ liệu hoặc rút lại sự đồng ý bằng cách liên hệ ${s.contactEmail || 'nhà trường'}. Bài còn chờ duyệt có thể tự rút lại tại trang “Trạng thái bài gửi”.`,
    ],
  },
  'dieu-khoan': {
    title: 'Điều khoản gửi nội dung',
    body: () => [
      'Mọi nội dung gửi lên được nhà trường duyệt trước khi hiển thị. Nhà trường có quyền biên tập (sửa lỗi chính tả, cắt ngắn) hoặc không đăng.',
      'Bạn cam kết là tác giả hoặc có quyền chia sẻ hình ảnh, câu chuyện đã gửi, và đồng ý cho nhà trường sử dụng chúng trong phòng truyền thống, kỷ yếu và các ấn phẩm kỷ niệm, có ghi tên người đóng góp.',
      'Không gửi nội dung xúc phạm, sai sự thật, vi phạm pháp luật, quảng cáo; không gửi ảnh cá nhân của học sinh đang theo học khi chưa có sự đồng ý của cha mẹ hoặc người giám hộ.',
      'Người xuất hiện trong ảnh có thể yêu cầu gỡ ảnh qua trang Liên hệ; nhà trường xử lý trong vòng 72 giờ.',
      'Thông tin “báo đóng góp” chỉ được công nhận sau khi kế toán nhà trường đối chiếu sao kê. Nhà trường không bao giờ nhắn tin yêu cầu chuyển tiền vào tài khoản khác với tài khoản công bố trên trang.',
    ],
  },
  'lien-he': {
    title: 'Liên hệ, yêu cầu gỡ nội dung',
    body: (s) => [
      `Mọi góp ý, bổ sung tư liệu, yêu cầu chỉnh sửa hoặc gỡ nội dung, xin gửi về: ${s.contactEmail || '(nhà trường cập nhật email liên hệ)'}.`,
      'Khi yêu cầu gỡ, vui lòng ghi rõ đường dẫn trang và lý do. Nhà trường phản hồi trong vòng 72 giờ.',
    ],
  },
}

type P = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = PAGES[(await params).slug]
  return p ? { title: p.title } : {}
}

export default async function StaticPage({ params }: P) {
  const p = PAGES[(await params).slug]
  if (!p) notFound()
  const s = await getSite()
  return (
    <div className="wrap section" style={{ maxWidth: 820 }}>
      <h1>{p.title}</h1>
      {p.body(s).map((t, i) => <p key={i}>{t}</p>)}
    </div>
  )
}
