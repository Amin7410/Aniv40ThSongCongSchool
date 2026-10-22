/**
 * Đặc tả file Excel thu thập tư liệu — dùng chung cho tạo mẫu (template) và nhập dữ liệu (import).
 * Cột có dấu * là bắt buộc.
 */
export type Col = { key: string; header: string; req?: boolean; width?: number; list?: string[]; kind?: 'year' | 'int' | 'text' | 'long'; note?: string }
export type Sheet = { name: string; title: string; zone?: string; cols: Col[]; example: Record<string, string | number> }

const YEAR = { kind: 'year' as const, width: 12 }
const IMG: Col = { key: 'anh', header: 'Tệp ảnh', width: 26, note: 'Tên tệp trong thư mục ảnh gửi kèm, VD: hieu-truong-01.jpg. Nhiều ảnh: cách nhau dấu phẩy.' }

export const SHEETS: Sheet[] = [
  {
    name: 'Lanh_dao',
    title: 'Lãnh đạo qua các thời kỳ',
    zone: 'lanh-dao',
    cols: [
      { key: 'ten', header: 'Họ và tên *', req: true, width: 28 },
      { key: 'chucvu', header: 'Chức vụ *', req: true, width: 18, list: ['Hiệu trưởng', 'Phó Hiệu trưởng'] },
      { key: 'tu', header: 'Từ năm *', req: true, ...YEAR },
      { key: 'den', header: 'Đến năm', ...YEAR, note: 'Bỏ trống nếu đang đương nhiệm' },
      { key: 'tieusu', header: 'Tiểu sử, đóng góp', kind: 'long', width: 60 },
      IMG,
      { key: 'thutu', header: 'Thứ tự hiển thị', kind: 'int', width: 10 },
    ],
    example: { ten: 'Nguyễn Văn A', chucvu: 'Hiệu trưởng', tu: 1986, den: 1992, tieusu: 'Hiệu trưởng đầu tiên của trường…', anh: 'nguyen-van-a.jpg', thutu: 1 },
  },
  {
    name: 'Can_bo',
    title: 'Cán bộ, giáo viên, nhân viên',
    zone: 'can-bo',
    cols: [
      { key: 'ten', header: 'Họ và tên *', req: true, width: 28 },
      { key: 'to', header: 'Tổ chuyên môn *', req: true, width: 20, list: ['Ban Giám hiệu', 'Toán – Tin', 'Ngữ văn', 'Ngoại ngữ', 'Khoa học tự nhiên', 'Khoa học xã hội', 'GDTC – QPAN', 'Văn phòng'] },
      { key: 'chucdanh', header: 'Chức danh, bộ môn *', req: true, width: 26 },
      { key: 'tinhtrang', header: 'Tình trạng *', req: true, width: 18, list: ['Đang công tác', 'Nghỉ hưu', 'Chuyển công tác'] },
      { key: 'tu', header: 'Năm về trường *', req: true, ...YEAR },
      { key: 'den', header: 'Năm nghỉ / chuyển', ...YEAR },
      { key: 'ghichu', header: 'Ghi chú, thành tích', kind: 'long', width: 50 },
      IMG,
    ],
    example: { ten: 'Trần Thị B', to: 'Toán – Tin', chucdanh: 'Giáo viên Toán, Tổ trưởng', tinhtrang: 'Nghỉ hưu', tu: 1988, den: 2020, ghichu: '', anh: '' },
  },
  {
    name: 'Cuu_hoc_sinh',
    title: 'Cựu học sinh tiêu biểu',
    zone: 'cuu-hoc-sinh',
    cols: [
      { key: 'ten', header: 'Họ và tên *', req: true, width: 28 },
      { key: 'khoa', header: 'Khóa học *', req: true, width: 22, note: 'VD: Khóa 1986 – 1989' },
      { key: 'linhvuc', header: 'Lĩnh vực *', req: true, width: 22, list: ['Khoa học', 'Y tế', 'Giáo dục', 'Quân đội – Công an', 'Kinh doanh', 'Văn hóa – Thể thao', 'Lãnh đạo – Quản lý'] },
      { key: 'thanhtich', header: 'Thành tích, nơi công tác', kind: 'long', width: 60 },
      IMG,
    ],
    example: { ten: 'Lê Văn C', khoa: 'Khóa 1986 – 1989', linhvuc: 'Khoa học', thanhtich: 'Phó Giáo sư, Tiến sĩ…', anh: '' },
  },
  {
    name: 'Khen_thuong',
    title: 'Bằng khen, giấy khen',
    zone: 'bang-khen',
    cols: [
      { key: 'ten', header: 'Tên danh hiệu, phần thưởng *', req: true, width: 36 },
      { key: 'loai', header: 'Loại hiện vật *', req: true, width: 20, list: ['Huân chương', 'Cờ thi đua', 'Cúp', 'Bằng khen, giấy khen'] },
      { key: 'cap', header: 'Cấp khen tặng *', req: true, width: 26 },
      { key: 'nam', header: 'Năm *', req: true, ...YEAR },
      { key: 'noidung', header: 'Nội dung thành tích', kind: 'long', width: 50 },
      IMG,
    ],
    example: { ten: 'Huân chương Lao động hạng Ba', loai: 'Huân chương', cap: 'Chủ tịch nước', nam: 2006, noidung: '', anh: '' },
  },
  {
    name: 'Hoat_dong',
    title: 'Ảnh hoạt động (Đảng bộ, Đoàn, Cơ sở vật chất)',
    cols: [
      { key: 'khu', header: 'Khu *', req: true, width: 18, list: ['Đảng bộ', 'Đoàn, phong trào', 'Cơ sở vật chất'] },
      { key: 'ten', header: 'Tên hoạt động / công trình *', req: true, width: 36 },
      { key: 'nam', header: 'Năm *', req: true, ...YEAR },
      { key: 'phanloai', header: 'Phân loại', width: 20, note: 'VD: Hội trại, Văn nghệ, Đại hội…' },
      { key: 'nguoi', header: 'Người trong ảnh', width: 30, note: 'Cách nhau dấu phẩy' },
      { key: 'mota', header: 'Mô tả', kind: 'long', width: 50 },
      { ...IMG, header: 'Tệp ảnh *', req: true },
      { key: 'macap', header: 'Mã cặp Ngày ấy – Bây giờ', width: 18, note: 'Chỉ khu Cơ sở vật chất: 2 ảnh cùng mã sẽ thành thanh trượt' },
    ],
    example: { khu: 'Cơ sở vật chất', ten: 'Dãy nhà học hai tầng', nam: 1996, phanloai: '', nguoi: '', mota: '', anh: 'day-nha-1996.jpg', macap: 'nha-hoc-A' },
  },
  {
    name: 'Moc_lich_su',
    title: 'Dòng thời gian',
    cols: [
      { key: 'thoidiem', header: 'Thời điểm *', req: true, width: 16, note: 'VD: 05/07/1986 hoặc 1996' },
      { key: 'sukien', header: 'Sự kiện *', req: true, kind: 'long', width: 80 },
    ],
    example: { thoidiem: '05/07/1986', sukien: 'Thành lập trường theo Quyết định số …' },
  },
  {
    name: 'Cau_do',
    title: 'Câu đố 40 năm',
    cols: [
      { key: 'cauhoi', header: 'Câu hỏi *', req: true, width: 50 },
      { key: 'a', header: 'Phương án A *', req: true, width: 22 },
      { key: 'b', header: 'Phương án B *', req: true, width: 22 },
      { key: 'c', header: 'Phương án C', width: 22 },
      { key: 'd', header: 'Phương án D', width: 22 },
      { key: 'dung', header: 'Đáp án đúng *', req: true, width: 12, list: ['A', 'B', 'C', 'D'] },
      { key: 'giaithich', header: 'Giải thích', kind: 'long', width: 40 },
    ],
    example: { cauhoi: 'Trường được thành lập năm nào?', a: '1984', b: '1986', c: '1990', d: '1996', dung: 'B', giaithich: '' },
  },
]

export const ZONE_OF_ACTIVITY: Record<string, string> = { 'Đảng bộ': 'dang-bo', 'Đoàn, phong trào': 'doan', 'Cơ sở vật chất': 'co-so-vat-chat' }
export const STATUS_OF: Record<string, 'current' | 'retired' | 'moved'> = { 'Đang công tác': 'current', 'Nghỉ hưu': 'retired', 'Chuyển công tác': 'moved' }
export const AWARD_OF: Record<string, 'medal' | 'flag' | 'cup' | 'cert'> = { 'Huân chương': 'medal', 'Cờ thi đua': 'flag', Cúp: 'cup', 'Bằng khen, giấy khen': 'cert' }
