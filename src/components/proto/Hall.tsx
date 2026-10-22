'use client'
import { useState } from 'react'
import { Modal } from './Modal'

type Props = {
  decisionNo?: string | null
  decisionIssuer?: string | null
  founded: string // dd/mm/yyyy
  scan?: { src: string; alt: string } | null
  yearsLabel: string
  history: Array<{ date: string; text: string }>
}

/** Hai tấm bảng trong gian trung tâm (Quyết định thành lập, Hình thành và phát triển) — bấm để mở toàn văn. */
export function HallPanels({ decisionNo, decisionIssuer, founded, scan, yearsLabel, history, children }: Props & { children: React.ReactNode }) {
  const [open, setOpen] = useState<null | 'dec' | 'his'>(null)
  const [d, m, y] = founded.split('/')
  const issuer = (decisionIssuer || 'Ủy ban nhân dân tỉnh ……').toUpperCase()
  return (
    <>
      <div className="wall-grid">
        <button className="panel dec" onClick={() => setOpen('dec')}>
          <span className="ph2">Quyết định thành lập trường</span>
          <span className="psub">Số {decisionNo || '…'}, ngày {founded}</span>
          <span className="paper" aria-hidden="true">
            <b>Cộng hòa xã hội chủ nghĩa Việt Nam</b>
            <em>Độc lập – Tự do – Hạnh phúc</em>
            <strong>Quyết định</strong>
            <i /><i /><i className="s" /><i /><i /><i /><i className="s" />
          </span>
          <span className="plink">Đọc toàn văn</span>
        </button>
        {children}
        <button className="panel his" onClick={() => setOpen('his')}>
          <span className="ph2">Hình thành và phát triển</span>
          <span className="psub">{yearsLabel}</span>
          <ul className="hist">
            {history.slice(0, 6).map((h, i) => (
              <li key={i}><b>{String(h.date).slice(-4)}</b><span>{h.text}</span></li>
            ))}
          </ul>
          <span className="plink">Xem toàn bộ chặng đường</span>
        </button>
      </div>
      <Modal open={open === 'dec'} onClose={() => setOpen(null)} label="Quyết định thành lập trường">
        {scan ? (
          <div className="mv-img"><img src={scan.src} alt={scan.alt} /></div>
        ) : (
          <>
            <div className="doc">
              <div className="hdr">
                <div><b>{issuer}</b><u>&nbsp;</u><div style={{ marginTop: 6 }}>Số: {decisionNo || '…'}</div></div>
                <div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><u>Độc lập – Tự do – Hạnh phúc</u></div>
                <div className="date">……, ngày {d} tháng {+m || m} năm {y}</div>
              </div>
              <h3>QUYẾT ĐỊNH</h3>
              <p className="dsub">Về việc thành lập Trường Phổ thông trung học Sông Công</p>
              <p className="c">{issuer}</p>
              <p>Căn cứ yêu cầu phát triển sự nghiệp giáo dục phổ thông trên địa bàn;</p>
              <p>Xét đề nghị của Giám đốc Sở Giáo dục,</p>
              <p className="c">QUYẾT ĐỊNH:</p>
              <p><b>Điều 1.</b> Thành lập Trường Phổ thông trung học Sông Công, trực thuộc Sở Giáo dục.</p>
              <p><b>Điều 2.</b> Trường có nhiệm vụ giảng dạy, giáo dục học sinh bậc phổ thông trung học theo chương trình của Bộ Giáo dục.</p>
              <p><b>Điều 3.</b> Chánh Văn phòng Ủy ban nhân dân tỉnh, Giám đốc Sở Giáo dục và thủ trưởng các cơ quan có liên quan chịu trách nhiệm thi hành quyết định này.</p>
              <div className="sign">TM. ỦY BAN NHÂN DÂN<br />CHỦ TỊCH<span>(đã ký)</span></div>
            </div>
            <p className="note center">Văn bản minh họa. Ban quản trị thay bằng ảnh chụp quyết định gốc.</p>
          </>
        )}
      </Modal>
      <Modal open={open === 'his'} onClose={() => setOpen(null)} label="Hình thành và phát triển">
        <h2 className="m-title">Hình thành và phát triển</h2>
        <ul className="htl">
          {history.map((h, i) => (
            <li key={i}><b>{h.date}</b><span>{h.text}</span></li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
