type ZoneType = 'leaders' | 'staff' | 'alumni' | 'awards' | 'gallery' | 'campus' | 'memories'

export const ZONES: Array<{ slug: string; title: string; shortTitle: string; type: ZoneType; description: string; order: number; categories?: string[] }> = [
  { slug: 'lanh-dao', title: 'Lãnh đạo qua các thời kỳ', shortTitle: 'Lãnh đạo', type: 'leaders', order: 1, categories: ['Hiệu trưởng', 'Phó Hiệu trưởng'], description: 'Các thế hệ Ban Giám hiệu đã dẫn dắt nhà trường qua 40 năm. Chạm vào từng thẻ để đọc hồ sơ và gửi lời tri ân.' },
  { slug: 'can-bo', title: 'Cán bộ, giáo viên, nhân viên', shortTitle: 'CBGV, NV', type: 'staff', order: 2, categories: ['Ban Giám hiệu', 'Toán – Tin', 'Ngữ văn', 'Ngoại ngữ', 'Khoa học tự nhiên', 'Khoa học xã hội', 'GDTC – QPAN', 'Văn phòng'], description: 'Thầy cô đang công tác và các thế hệ đã nghỉ hưu, chuyển công tác, xếp theo tổ chuyên môn và thời kỳ.' },
  { slug: 'cuu-hoc-sinh', title: 'Cựu học sinh tiêu biểu', shortTitle: 'Cựu học sinh', type: 'alumni', order: 3, categories: ['Khoa học', 'Y tế', 'Giáo dục', 'Quân đội – Công an', 'Kinh doanh', 'Văn hóa – Thể thao', 'Lãnh đạo – Quản lý'], description: 'Những gương mặt trưởng thành từ mái trường, cùng bản đồ cựu học sinh trên khắp thế giới.' },
  { slug: 'bang-khen', title: 'Bằng khen, giấy khen', shortTitle: 'Khen thưởng', type: 'awards', order: 4, description: 'Tủ kính số hóa trưng bày huân chương, cờ thi đua, cúp và bằng khen của nhà trường.' },
  { slug: 'dang-bo', title: 'Hoạt động của Đảng bộ', shortTitle: 'Đảng bộ', type: 'gallery', order: 5, categories: ['Đại hội', 'Sinh hoạt chính trị', 'Công tác đảng viên'], description: 'Hình ảnh hoạt động của Chi bộ, Đảng bộ nhà trường qua các thập niên.' },
  { slug: 'doan', title: 'Hoạt động Đoàn, phong trào', shortTitle: 'Đoàn, phong trào', type: 'gallery', order: 6, categories: ['Đoàn Thanh niên', 'Phong trào thi đua', 'Hoạt động nhà trường'], description: 'Đoàn Thanh niên, các phong trào thi đua và những sự kiện lớn của nhà trường qua các thập niên.' },
  { slug: 'co-so-vat-chat', title: 'Xây dựng cơ sở vật chất', shortTitle: 'Cơ sở vật chất', type: 'campus', order: 7, description: 'Kéo thanh trượt Ngày ấy – Bây giờ để thấy diện mạo nhà trường thay đổi qua 40 năm.' },
  { slug: 'goc-ky-uc', title: 'Góc ký ức của các Thế hệ', shortTitle: 'Góc ký ức', type: 'memories', order: 8, description: 'Kỷ vật, tấm ảnh và câu chuyện do chính các thế hệ học trò gửi về trong chiến dịch Gửi kỷ vật – Hiến tư liệu, xếp theo từng thế hệ.' },
]

export const CITIES = [
  ['song-cong', 'Sông Công', 'Việt Nam', 21.47, 105.84], ['thai-nguyen', 'Thái Nguyên', 'Việt Nam', 21.59, 105.85], ['ha-noi', 'Hà Nội', 'Việt Nam', 21.03, 105.85],
  ['bac-ninh', 'Bắc Ninh', 'Việt Nam', 21.19, 106.08], ['hai-phong', 'Hải Phòng', 'Việt Nam', 20.86, 106.68], ['ha-long', 'Hạ Long', 'Việt Nam', 20.95, 107.08],
  ['vinh-phuc', 'Vĩnh Yên', 'Việt Nam', 21.31, 105.6], ['lao-cai', 'Lào Cai', 'Việt Nam', 22.48, 103.97], ['tuyen-quang', 'Tuyên Quang', 'Việt Nam', 21.82, 105.21],
  ['lang-son', 'Lạng Sơn', 'Việt Nam', 21.85, 106.76], ['thanh-hoa', 'Thanh Hóa', 'Việt Nam', 19.81, 105.78], ['vinh', 'Vinh', 'Việt Nam', 18.68, 105.68],
  ['hue', 'Huế', 'Việt Nam', 16.46, 107.59], ['da-nang', 'Đà Nẵng', 'Việt Nam', 16.05, 108.2], ['nha-trang', 'Nha Trang', 'Việt Nam', 12.24, 109.19],
  ['buon-ma-thuot', 'Buôn Ma Thuột', 'Việt Nam', 12.67, 108.04], ['da-lat', 'Đà Lạt', 'Việt Nam', 11.94, 108.44], ['tp-hcm', 'TP. Hồ Chí Minh', 'Việt Nam', 10.78, 106.7],
  ['binh-duong', 'Thủ Dầu Một', 'Việt Nam', 10.98, 106.65], ['vung-tau', 'Vũng Tàu', 'Việt Nam', 10.35, 107.08], ['can-tho', 'Cần Thơ', 'Việt Nam', 10.03, 105.78],
  ['vientiane', 'Viêng Chăn', 'Lào', 17.97, 102.6], ['phnom-penh', 'Phnôm Pênh', 'Campuchia', 11.56, 104.92], ['bangkok', 'Bangkok', 'Thái Lan', 13.76, 100.5],
  ['singapore', 'Singapore', 'Singapore', 1.35, 103.82], ['kuala-lumpur', 'Kuala Lumpur', 'Malaysia', 3.14, 101.69], ['dai-bac', 'Đài Bắc', 'Đài Loan (TQ)', 25.03, 121.57],
  ['bac-kinh', 'Bắc Kinh', 'Trung Quốc', 39.9, 116.4], ['thuong-hai', 'Thượng Hải', 'Trung Quốc', 31.23, 121.47], ['seoul', 'Seoul', 'Hàn Quốc', 37.57, 126.98],
  ['tokyo', 'Tokyo', 'Nhật Bản', 35.68, 139.69], ['osaka', 'Osaka', 'Nhật Bản', 34.69, 135.5], ['nagoya', 'Nagoya', 'Nhật Bản', 35.18, 136.91],
  ['sydney', 'Sydney', 'Úc', -33.87, 151.21], ['melbourne', 'Melbourne', 'Úc', -37.81, 144.96], ['auckland', 'Auckland', 'New Zealand', -36.85, 174.76],
  ['dubai', 'Dubai', 'UAE', 25.2, 55.27], ['moskva', 'Moskva', 'Nga', 55.76, 37.62], ['warszawa', 'Warszawa', 'Ba Lan', 52.23, 21.01],
  ['praha', 'Praha', 'Séc', 50.08, 14.44], ['berlin', 'Berlin', 'Đức', 52.52, 13.4], ['paris', 'Paris', 'Pháp', 48.86, 2.35],
  ['london', 'London', 'Anh', 51.51, -0.13], ['amsterdam', 'Amsterdam', 'Hà Lan', 52.37, 4.9], ['toronto', 'Toronto', 'Canada', 43.65, -79.38],
  ['new-york', 'New York', 'Hoa Kỳ', 40.71, -74.01], ['houston', 'Houston', 'Hoa Kỳ', 29.76, -95.37], ['san-francisco', 'San Francisco', 'Hoa Kỳ', 37.77, -122.42],
  ['los-angeles', 'Los Angeles', 'Hoa Kỳ', 34.05, -118.24], ['seattle', 'Seattle', 'Hoa Kỳ', 47.61, -122.33],
].map(([code, name, country, lat, lng]) => ({ code: code as string, name: name as string, country: country as string, lat: lat as number, lng: lng as number }))

/** Dữ liệu MINH HỌA (tên giả, chuyển nguyên từ bản prototype) — chỉ phục vụ demo và kiểm thử E2E. */
export { default as DEMO } from './demo.json'
