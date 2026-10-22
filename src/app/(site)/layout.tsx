import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import './site.css'
// Font tự host từ gói @fontsource (tập con tiếng Việt + Latin) — không gọi Google Fonts.
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-500.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-500.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/cormorant-garamond/vietnamese-600.css'
import '@fontsource/cormorant-garamond/vietnamese-700.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-700.css'
import { getEvent, getSite, getZones, imgUrl, type MediaDoc } from '@/lib/data'
import { I, lotus } from '@/lib/proto-svg'
import { liveState } from '@/lib/live'
import { Raw } from '@/components/Raw'
import { ZoneTabs } from '@/components/ZoneTabs'
import { Player } from '@/components/proto/Player'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSite()
  const title = `Phòng truyền thống trực tuyến – ${s.schoolName} (1986 – 2026)`
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: title, template: `%s – ${s.schoolName}` },
    description: `Phòng truyền thống trực tuyến ${s.schoolName}: lãnh đạo, thầy cô, cựu học sinh, khen thưởng và Góc ký ức qua 40 năm (1986 – 2026).`,
    openGraph: { type: 'website', locale: 'vi_VN', siteName: title },
  }
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#5c0a0e' }

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, zones, ev, jar] = await Promise.all([getSite(), getZones(), getEvent(), cookies()])
  const staff = !!jar.get('payload-token')
  const live = liveState(ev) === 'live' && !ev.staticFallback
  const music = s.music && typeof s.music === 'object' ? imgUrl(s.music as MediaDoc) : null
  return (
    <html lang="vi">
      <body>
        <a className="skip" href="#app">Bỏ qua thanh điều hướng</a>
        <header className="top">
          <div className="top-row">
            <Link className="brand" href="/" aria-label="Về gian trung tâm">
              <Raw html={lotus} />
              <span>
                <b>{s.schoolName}</b>
                <span>Phòng truyền thống trực tuyến, 1986 – 2026</span>
              </span>
            </Link>
            <Link className="tlink hl hide-sm" href="/dai-le"><span className="lbl">Đại lễ 40 năm</span></Link>
            {s.tour3dUrl && (
              <a className="tlink" href={s.tour3dUrl} target="_blank" rel="noopener noreferrer" aria-label="Tham quan 3D">
                <Raw html={I.cube} />
                <span className="lbl">Tham quan 3D</span>
              </a>
            )}
            {staff && (
              <Link className="tlink" href="/quan-tri" aria-label="Quản trị">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
                <span className="lbl">Quản trị</span>
              </Link>
            )}
          </div>
        </header>
        <ZoneTabs zones={zones.map((z) => ({ slug: z.slug, short: z.shortTitle }))} />
        {live && (
          <div className="live-strip">
            <div className="in">
              <b><span className="onair"><i />Trực tiếp</span>{ev.title || 'Lễ kỷ niệm 40 năm thành lập trường'} đang diễn ra</b>
              <Link href="/dai-le">Xem trực tiếp</Link>
            </div>
          </div>
        )}
        <main id="app">{children}</main>
        <footer className="foot">
          <p>Phòng truyền thống trực tuyến – {s.schoolName}.</p>
          <p>Tư liệu thuộc quyền sở hữu của nhà trường và những người đóng góp. Nội dung khách gửi được nhà trường duyệt trước khi đăng.</p>
          <nav aria-label="Chân trang">
            <Link href="/gui-ky-vat">Gửi kỷ vật</Link>
            <Link href="/ban-do">Bản đồ cựu học sinh</Link>
            <Link href="/ky-yeu">Kỷ yếu số</Link>
            <Link href="/trang/chinh-sach-rieng-tu">Chính sách quyền riêng tư</Link>
            <Link href="/trang/dieu-khoan">Điều khoản gửi nội dung</Link>
            <Link href="/trang/lien-he">Liên hệ, yêu cầu gỡ nội dung</Link>
          </nav>
        </footer>
        <Player src={music} title={s.musicTitle || 'Bài ca truyền thống của trường'} />
      </body>
    </html>
  )
}
