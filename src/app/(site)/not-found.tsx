import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap section">
      <h1>Không tìm thấy trang</h1>
      <p>Trang bạn tìm có thể đã được di chuyển. <Link href="/">Về gian trung tâm</Link></p>
    </div>
  )
}
