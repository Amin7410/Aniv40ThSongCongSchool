import Link from 'next/link'
import { getEvent, getMilestones, getSite, getZones, imgUrl, type MediaDoc } from '@/lib/data'
import { zoneItems, type Item } from '@/lib/view'
import { candleCount, dstr, fundSummary, guestbook, vnd } from '@/lib/home'
import { embedURL, liveState } from '@/lib/live'
import { BUST, FLAGS, I, flowersSVG, lotus } from '@/lib/proto-svg'
import { Raw } from '@/components/Raw'
import { HallPanels } from '@/components/proto/Hall'
import { CountdownBand } from '@/components/proto/Countdown'
import { MemoryBox, type BoxItem } from '@/components/proto/MemoryBox'
import { CampaignCard } from '@/components/proto/Campaign'
import { MusicAct } from '@/components/proto/MusicAct'
import { Img } from '@/components/proto/Img'

export const dynamic = 'force-dynamic'

const ddmmyyyy = (d?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '05/07/1986'
}

export default async function Home() {
  const [s, ev, zones, ms] = await Promise.all([getSite(), getEvent(), getZones(), getMilestones()])
  const founded = ddmmyyyy(s.foundedDate as string)
  const fy = +founded.slice(-4)
  const nowY = new Date().getFullYear()
  const yrs = nowY - fy
  const state = liveState(ev)
  const all = await Promise.all(zones.map(async (z) => [z, await zoneItems(z)] as const))
  const memZ = all.find(([z]) => z.type === 'memories')
  const mem = memZ?.[1] || []
  const gal = all.find(([z]) => z.type === 'gallery')
  const [gb, candles, fund] = await Promise.all([guestbook(3), candleCount(), fundSummary()])

  const toBox = (zs: string, it: Item): BoxItem => ({
    id: it.id,
    y: it.year || it.start || +(/\d{4}/.exec(it.khoa)?.[0] || 0),
    title: it.title,
    story: it.desc,
    meta: [it.by, it.khoa].filter(Boolean).join(', '),
    img: it.img,
    art: it.art,
    old: it.old,
    href: `/khu/${zs}/${it.id}`,
  })
  const pool: BoxItem[] = [
    ...mem.map((it) => toBox(memZ![0].slug, it)),
    ...(gal ? gal[1].filter((it) => (it.year || 9999) < 2006).map((it) => toBox(gal[0].slug, it)) : []),
  ]
  const people = new Set(mem.map((m) => m.by).filter(Boolean)).size
  const gens = new Set(mem.map((m) => Math.min(3, Math.max(0, Math.floor(((+(/\d{4}/.exec(m.khoa)?.[0] || m.year || 0)) - 1986) / 10))))).size
  const scan = s.decisionScan && typeof s.decisionScan === 'object' ? (s.decisionScan as MediaDoc) : null
  const embed = embedURL(ev.liveUrl as string)

  return (
    <>
      {state === 'live' && (
        <section className="live-hero">
          <div className="lh-in">
            <div className="lh-head">
              <span className="onair"><i />Đang phát trực tiếp</span>
              <h2>{ev.title}</h2>
            </div>
            <div className="lh-grid">
              <div>
                <div className="lp">{embed ? <iframe src={embed} title="Phát trực tiếp Đại lễ" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : null}</div>
              </div>
              <aside className="lh-side">
                <p>Cựu học sinh ở xa vẫn có thể cùng xem buổi lễ và dạo quanh phòng truyền thống cùng lúc.</p>
                <Link className="btn gold" href="/dai-le">Xem tại trang Đại lễ</Link>
                <Link className="btn ghost-d" href="/dai-le#so-loi-chuc">Gửi lời chúc</Link>
              </aside>
            </div>
          </div>
        </section>
      )}

      <section className="hall" aria-label="Gian trung tâm">
        <div className="room first">
          <div className="ceiling" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="wall">
            <div className="banner">
              <Raw html={lotus} />
              <h1>{s.bannerText || 'Đảng Cộng sản Việt Nam quang vinh muôn năm'}</h1>
              <Raw html={lotus} />
            </div>
            <HallPanels
              decisionNo={s.decisionNo}
              decisionIssuer={s.decisionIssuer}
              founded={founded}
              scan={scan && imgUrl(scan, 'full') ? { src: imgUrl(scan, 'full')!, alt: scan.alt || 'Bản scan Quyết định thành lập' } : null}
              yearsLabel={`${yrs} năm xây dựng, ${fy} – ${nowY}`}
              history={ms.map((m) => ({ date: m.date, text: m.text }))}
            >
              <div className="altar">
                <div className="flags"><Raw html={FLAGS} /></div>
                <Raw html={BUST} />
                <Raw html={flowersSVG()} />
                <div className="pedestal" />
              </div>
            </HallPanels>
          </div>
          <div className="step" />
          <div className="floor" />
        </div>
      </section>

      {state !== 'live' && (
        <CountdownBand title={ev.title || 'Lễ kỷ niệm 40 năm thành lập trường'} startsAt={ev.startsAt} place={ev.place} liveUrl={ev.liveUrl as string} after={state === 'after'} />
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Hộp ký ức ngẫu nhiên</h2>
            <p>Mỗi lần bốc là một tấm ảnh tư liệu cũ kèm một câu chuyện học trò. Chọn thế hệ của bạn rồi săn lại những khoảnh khắc thanh xuân.</p>
          </div>
        </div>
        <div className="home-duo">
          <MemoryBox pool={pool} />
          <CampaignCard compact start={ev.campaignStart as string} end={ev.campaignEnd as string} items={mem.length} people={people} gens={gens} closed={ev.submissionsOpen === false} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 6 }}>
        <div className="acts">
          <MusicAct title={s.musicTitle || 'Bài ca truyền thống'} />
          <Link className="act" href="/ky-yeu"><Raw html={I.book} /><b>Kỷ yếu 40 năm</b><span>Lật từng trang kỷ yếu số</span></Link>
          {s.tour3dUrl && (
            <a className="act" href={s.tour3dUrl} target="_blank" rel="noopener noreferrer"><Raw html={I.cube} /><b>Tham quan 3D</b><span>Bước đi trong phòng truyền thống mô phỏng</span></a>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Bảy khu trưng bày</h2>
            <p>Chọn một khu để xem chân dung, hiện vật và hình ảnh qua {yrs} năm.</p>
          </div>
          {zones[0] && <Link className="btn" href={`/khu/${zones[0].slug}`}>Bắt đầu tham quan</Link>}
        </div>
        <div className="cabinets">
          {all.map(([z, items]) => {
            const objs = z.type === 'awards'
            const wide = z.type === 'gallery' || z.type === 'campus'
            return (
              <Link key={z.id} className={`cab${wide ? ' wide' : ''}${objs ? ' objs' : ''}`} href={`/khu/${z.slug}`}>
                <span className="plate">{z.title}</span>
                <span className="glass">
                  {items.slice(0, 3).map((it) => (
                    <Img key={it.id} src={it.img} art={objs ? null : it.art} award={objs ? { k: it.k || 'cert', title: it.title } : null} old={it.old && !objs} />
                  ))}
                </span>
                <span className="meta"><span>{items.length} {objs ? 'hiện vật' : wide ? 'ảnh, giai đoạn' : 'chân dung'}</span><span>Vào xem</span></span>
              </Link>
            )
          })}
        </div>
        {memZ && (
          <Link className="feature" href={`/khu/${memZ[0].slug}`}>
            <span className="fimgs">{mem.slice(0, 3).map((it) => <Img key={it.id} src={it.img} art={it.art} old={it.old} />)}</span>
            <span className="ftxt">
              <h3>Góc ký ức của các Thế hệ</h3>
              <p>{mem.length} kỷ vật, tấm ảnh và câu chuyện do chính các thế hệ học trò gửi về trong chiến dịch Gửi kỷ vật – Hiến tư liệu.</p>
              <span className="btn gold">Vào Góc ký ức</span>
            </span>
          </Link>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Hướng về đại lễ</h2>
            <p>Gửi lời chúc, thắp nến tri ân, gửi kỷ vật và chung tay xây dựng {fund.name}.</p>
          </div>
          <Link className="btn" href="/dai-le">Đến trang Đại lễ 40 năm</Link>
        </div>
        <div className="ev-grid">
          <div className="card center">
            <div className="candle"><span className="wax" /><span className="wick" /><span className="flame" /></div>
            <div className="bignum">{candles.toLocaleString('vi-VN')}</div>
            <p className="note">ngọn nến tri ân đã được thắp</p>
          </div>
          <div className="card">
            <h2>Lời chúc mới</h2>
            {gb.length ? (
              <div className="gb-list">
                {gb.map((g) => (
                  <div key={g.id} className="gb"><p>{g.msg}</p><small>{g.name}{g.khoa ? ', ' + g.khoa : ''}, {dstr(g.at)}</small></div>
                ))}
              </div>
            ) : (
              <p className="note">Chưa có lời chúc nào. Hãy là người đầu tiên.</p>
            )}
          </div>
          <div className="card">
            <h2>{fund.name}</h2>
            <p className="kv"><b>{vnd(fund.raised)}</b> từ {fund.count} lượt đóng góp</p>
            <div className="bar" style={{ margin: '12px 0' }}><i style={{ width: `${Math.min(100, (fund.raised / (fund.goal || 1)) * 100).toFixed(1)}%` }} /></div>
            <p className="note">Mục tiêu {vnd(fund.goal)}</p>
          </div>
        </div>
      </section>
    </>
  )
}
