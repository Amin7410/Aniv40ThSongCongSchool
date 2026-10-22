/** Tạo file Excel mẫu gửi nhà trường: `pnpm excel:template [đường-dẫn.xlsx]` */
import ExcelJS from 'exceljs'
import { SHEETS } from './excel-spec'

const out = process.argv[2] || 'docs/Mau_thu_thap_tu_lieu.xlsx'

async function main() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'THD CyberSecurity'
  const guide = wb.addWorksheet('Huong_dan')
  guide.columns = [{ width: 110 }]
  const lines = [
    'MẪU THU THẬP TƯ LIỆU – PHÒNG TRUYỀN THỐNG TRỰC TUYẾN TRƯỜNG THPT SÔNG CÔNG (1986 – 2026)',
    '',
    '1. Mỗi trang tính (tab phía dưới) ứng với một khu trưng bày. Dòng 2 (chữ nghiêng, nền vàng) là VÍ DỤ — hãy ghi đè hoặc xóa.',
    '2. Cột có dấu * là bắt buộc. Cột có mũi tên chọn: hãy chọn trong danh sách, không gõ tay.',
    '3. Năm ghi 4 chữ số (VD: 1996). Khóa học ghi dạng "Khóa 1990 – 1993".',
    '4. Ảnh: đặt tất cả ảnh vào MỘT thư mục, ghi đúng tên tệp vào cột "Tệp ảnh" (VD: hieu-truong-01.jpg). Ảnh JPG/PNG, cạnh dài ≥ 1200px nếu có.',
    '5. Ảnh có học sinh đang theo học: chỉ dùng ảnh tập thể và phải có sự đồng ý theo quy định của nhà trường.',
    '6. Thông tin lịch sử (số Quyết định, năm nhận Huân chương…) cần đối chiếu văn bản gốc trước khi gửi.',
    '7. Gửi lại file này kèm thư mục ảnh (nén .zip) cho THD. THD chạy kiểm tra tự động và báo lại các dòng thiếu/sai trước khi nhập.',
  ]
  // Ghi chú từng cột (không dùng "comment" của Excel: một số phần mềm đọc/ghi lỗi)
  lines.push('', 'GHI CHÚ TỪNG TRANG:')
  for (const s of SHEETS) {
    lines.push(`• ${s.name} — ${s.title}`)
    for (const c of s.cols) if (c.note) lines.push(`    – ${c.header.replace(' *', '')}: ${c.note}`)
  }
  lines.forEach((t, i) => {
    const r = guide.addRow([t])
    if (i === 0) r.font = { bold: true, size: 14, color: { argb: 'FF8E1418' } }
    r.alignment = { wrapText: true }
  })

  // Danh mục cho ô chọn (đặt ở sheet ẩn vì giá trị có dấu phẩy, không dùng được danh sách nội tuyến)
  const lists = wb.addWorksheet('Danh_muc', { state: 'veryHidden' })
  const ranges = new Map<string, string>()
  let colNo = 0
  for (const s of SHEETS)
    for (const c of s.cols)
      if (c.list && !ranges.has(c.list.join('|'))) {
        colNo++
        c.list.forEach((v, i) => (lists.getCell(i + 1, colNo).value = v))
        const L = lists.getColumn(colNo).letter
        ranges.set(c.list.join('|'), `Danh_muc!$${L}$1:$${L}$${c.list.length}`)
      }

  for (const s of SHEETS) {
    const ws = wb.addWorksheet(s.name, { views: [{ state: 'frozen', ySplit: 1 }] })
    ws.columns = s.cols.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }))
    const h = ws.getRow(1)
    h.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5C0A0E' } }
    h.alignment = { vertical: 'middle', wrapText: true }
    h.height = 32
    const ex = ws.addRow(s.cols.map((c) => s.example[c.key] ?? ''))
    ex.font = { italic: true, color: { argb: 'FF6A5241' } }
    ex.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5D6' } }
    // Kiểm tra dữ liệu cho 500 dòng
    s.cols.forEach((c, i) => {
      const col = ws.getColumn(i + 1)
      for (let r = 2; r <= 501; r++) {
        const cell = ws.getCell(r, col.number)
        if (c.list) cell.dataValidation = { type: 'list', allowBlank: !c.req, formulae: [ranges.get(c.list.join('|'))!], showErrorMessage: true, errorTitle: 'Giá trị không hợp lệ', error: 'Hãy chọn trong danh sách.' }
        else if (c.kind === 'year') cell.dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [1900, 2100], showErrorMessage: true, error: 'Năm gồm 4 chữ số.' }
        if (c.kind === 'long') cell.alignment = { wrapText: true, vertical: 'top' }
      }
    })
  }
  await wb.xlsx.writeFile(out)
  console.log('Đã tạo', out)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
