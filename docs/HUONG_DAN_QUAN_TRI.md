# Hướng dẫn sử dụng cho cán bộ nhà trường

Phòng truyền thống trực tuyến – Trường THPT Sông Công. Tài liệu dành cho Ban Giám hiệu, biên tập viên, kiểm duyệt viên và kế toán.

## 1. Đăng nhập lần đầu

1. Mở `https://<tên miền>/admin` và đăng nhập bằng email và mật khẩu được cấp.
2. Hệ thống chuyển sang trang **Xác thực hai bước**.
   - Cài một ứng dụng xác thực trên điện thoại: Google Authenticator, Microsoft Authenticator hoặc 2FAS.
   - Bấm **Bắt đầu đăng ký**, quét mã QR, rồi nhập mã 6 số đang hiện trên ứng dụng.
3. **Lưu 8 mã khôi phục** (in ra hoặc chép vào nơi an toàn). Mỗi mã dùng được một lần khi bạn mất điện thoại.
4. Những lần đăng nhập sau: nhập mật khẩu, rồi nhập mã 6 số trên ứng dụng.

Nếu mất điện thoại và không còn mã khôi phục, hãy báo Quản trị trường. Họ sẽ mở hồ sơ của bạn, tích **Đặt lại 2FA**, và bạn đăng ký lại từ đầu.

## 2. Ai làm được gì

| Vai trò | Được làm |
|---|---|
| Quản trị trường (Ban Giám hiệu) | Mọi nội dung; cấu hình Đại lễ; quỹ học bổng; tài khoản; xuất dữ liệu |
| Biên tập viên khu | Thêm và sửa mục **chỉ trong các khu được giao** (ví dụ Văn phòng: Lãnh đạo, Cán bộ) |
| Kiểm duyệt viên | Duyệt lời chúc, kỷ vật, ảnh, lời tri ân, ghim bản đồ |
| Kế toán | Xác nhận các khoản **báo đóng góp** sau khi đối chiếu sao kê |

## 3. Kiểm duyệt nội dung khách gửi — `/quan-tri/kiem-duyet`

Mọi nội dung khách gửi chỉ hiện lên trang sau khi được duyệt. Hàng chờ tự làm mới mỗi 20 giây; mục gửi sớm nhất nằm trên cùng.

- **Chọn loại nội dung** bằng các nút phía trên. Con số trong ngoặc là số mục đang chờ.
- **Chỉ mục có cờ cảnh báo:** hiện những mục có từ ngữ cần chú ý, có nhiều đường link, hoặc gửi trùng. Hãy đọc kỹ các mục này.
- **Kỷ vật và ảnh:** chọn **Đưa vào khu** (ví dụ Góc ký ức, Đoàn, Cơ sở vật chất), sửa **Tiêu đề khi đăng** nếu cần, rồi bấm **Duyệt**. Hệ thống tự tạo mục trưng bày, ghi tên người gửi và xóa thông tin vị trí trong ảnh.
- **Báo đóng góp:** đối chiếu sao kê ngân hàng, nhập **số tiền theo sao kê**, rồi bấm **Xác nhận**. Tổng quỹ trên trang chỉ cộng các khoản đã xác nhận.
- **Từ chối:** chọn lý do rồi bấm **Từ chối**. Người gửi xem được lý do ở trang trạng thái bài gửi.
- **Gỡ bài đã đăng:** chọn trạng thái **Đã đăng**, mở mục, bấm **Gỡ khỏi trang**. Kỷ vật đã đưa vào khu cũng được ẩn theo.

**Phím tắt** (dùng nhiều nhất vào ngày lễ):

| Phím | Tác dụng |
|---|---|
| J / K | Mục tiếp theo / mục trước |
| A | Duyệt mục đang xem |
| R | Từ chối mục đang xem |
| X | Chọn hoặc bỏ chọn mục đang xem |
| Shift + A | Duyệt tất cả mục đã chọn |

## 4. Bảng điều hành — `/quan-tri`

- Hiển thị số mục đang chờ duyệt (chuyển **màu đỏ** khi có mục chờ quá 2 giờ), số nến tri ân, tổng quỹ đã xác nhận, và số nội dung gửi về trong 14 ngày.
- **Xuất CSV** (chỉ Quản trị trường): lời chúc, lời tri ân, kỷ vật, đóng góp. Tệp mở được bằng Excel.
  - Tệp có thông tin liên hệ của người gửi: chỉ lưu trên máy của nhà trường, không gửi ra ngoài.
  - Mỗi lần xuất đều được ghi vào nhật ký.

## 5. Thêm và sửa nội dung trưng bày — `/admin`

- **Nội dung → Mục trưng bày → Tạo mới.**
  - Chọn khu, nhập tên, nhiệm kỳ hoặc khóa học, mô tả, và ảnh (ảnh dọc tỉ lệ 4:5 cho chân dung).
  - Bấm **Lưu nháp** để lưu chưa công khai, hoặc **Xuất bản** để hiện lên trang.
- **Ngày ấy – Bây giờ** (khu Cơ sở vật chất): tạo hai mục cùng điền **Mã cặp** (ví dụ `nha-hoc-A`) và có năm khác nhau. Trang sẽ tự ghép thành thanh trượt.
- **Dòng thời gian, Câu đố:** trong nhóm **Nội dung**.
- **Kỷ yếu số:**
  1. Tải tệp PDF lên **Thư viện media**.
  2. Vào **Kỷ yếu số → Tạo mới** và chọn tệp PDF.
  3. Đợi trạng thái chuyển sang **Sẵn sàng**, rồi tích **Hiển thị công khai**.
- **Thông tin chung** (tên trường, Quyết định thành lập, nhạc nền, email liên hệ) và **Đại lễ** (giờ khai mạc, link phát trực tiếp): nằm trong nhóm **Cấu hình**.

## 6. Quỹ học bổng — đổi tài khoản nhận tiền

Vì lý do an toàn, **không ai sửa trực tiếp được số tài khoản quỹ**. Muốn đổi phải qua hai người:

1. Người thứ nhất vào **Cấu hình → Quỹ học bổng**, điền mục **Đề xuất thay đổi tài khoản**, rồi lưu.
2. Một Quản trị trường **khác** kiểm tra lại với ngân hàng, tích **Phê duyệt đề xuất**, rồi lưu.
3. Mọi quản trị đều nhận email cảnh báo. Nếu bạn nhận được cảnh báo mà không biết về việc thay đổi này, **báo THD ngay**.

## 7. Công tắc khẩn cấp — Cấu hình → Đại lễ & công tắc khẩn

- **Cho phép khách gửi nội dung:** bỏ tích khi bị spam hàng loạt.
- **Chế độ tĩnh:** bật khi trang chậm vào giờ cao điểm.

## 8. Gửi tư liệu số lượng lớn

Điền file `Mau_thu_thap_tu_lieu.xlsx` (mỗi khu một trang tính), đặt tất cả ảnh vào một thư mục, nén lại và gửi THD. THD sẽ chạy kiểm tra tự động, báo lại các dòng thiếu hoặc sai, rồi nhập dữ liệu dưới dạng **bản nháp** để nhà trường duyệt trước khi xuất bản.
