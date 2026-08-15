# 🌳 ỨNG DỤNG TÍNH TIỀN MỦ CAO SU & QUẢN LÝ DOANH THU

Ứng dụng web/PWA hiện đại giúp chủ vườn cao su và nông dân quản lý nhật ký cạo mủ hàng ngày, tính tiền tự động theo hàm lượng DRC (TSC°), gộp chu kỳ 10 ngày/15 ngày thanh toán, cập nhật đơn giá mủ thị trường trực tuyến theo tỉnh thành GPS và gửi báo cáo doanh thu qua Zalo/Email.

---

## 🛡️ TÍNH NĂNG & BẢO MẬT HỆ THỐNG
1. **Xác thực Google Auth & Phân Quyền Email (Whitelist):**
   - Chỉ các Email đã được Admin cấp phép mới có thể đăng nhập.
   - Tài khoản lạ khi đăng nhập sẽ vào chế độ chờ duyệt và có nút gửi yêu cầu phê duyệt trực tiếp cho Admin.
2. **Phân quyền Chủ Vườn & Người Cạo (Read-Only):**
   - Chủ vườn (Admin): Toàn quyền thêm, sửa, xóa, duyệt thành viên.
   - Người xem phụ: Chỉ có quyền xem báo cáo, không thể can thiệp làm sai lệch dữ liệu.
3. **Bảo mật Firestore Security Rules 100%:**
   - Dữ liệu `harvest_records` được khóa chặt ở cấp Database: Người dùng chỉ có thể ghi/sửa dữ liệu chính chủ của họ.
4. **Offline Persistence (Lưu trữ ngoại tuyến IndexedDB):**
   - Hoạt động mượt mà ngoài vườn cao su không có sóng Wi-Fi/4G. Dữ liệu tự động lưu máy và đồng bộ lên Google Cloud Firestore khi có mạng.
5. **Đơn giá mủ GPS & Ticker Online:**
   - Cập nhật giá mủ nước, mủ chén khu vực Tây Ninh, Bình Phước, Bình Dương, Gia Lai... theo vị trí GPS.

---

## 🚀 HƯỚNG DẪN CẤU HÌNH ĐẨY LÊN GITHUB & DEPLOY THỰC TẾ

### 1. Đẩy mã nguồn lên GitHub
1. Mở terminal tại thư mục dự án và khởi tạo Git (nếu chưa có):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Rubber Latex Manager"
   ```
2. Tạo một Repository mới trên [GitHub](https://github.com/new).
3. Đẩy code lên GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```

---

### 2. Triển khai (Deploy) thực tế

#### Cách 1: Deploy lên Vercel / Netlify (Miễn phí & Cực nhanh)
1. Truy cập [Vercel](https://vercel.com) hoặc [Netlify](https://netlify.com) và đăng nhập bằng GitHub.
2. Chọn **Import Project** từ Repository GitHub bạn vừa đẩy lên.
3. Cấu hình Build Command: `npm run build`
4. Cấu hình Output Directory: `dist`
5. Nhấn **Deploy**. Sau 1 phút ứng dụng sẽ có tên miền truy cập chính thức.

#### Cách 2: Deploy lên Firebase Hosting
1. Cài đặt Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Đăng nhập Firebase:
   ```bash
   firebase login
   ```
3. Khởi tạo và Deploy:
   ```bash
   firebase init hosting
   # Chọn thư mục public là: dist
   # Chọn Configure as a single-page app: Yes
   npm run build
   firebase deploy --only hosting
   ```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion Animation.
- **Backend & Database:** Firebase Firestore Database, Firebase Authentication.
- **Báo cáo & Xuất file:** jsPDF, AutoTable, XLSX (Excel), html2canvas.
- **PWA:** Progressive Web App hỗ trợ cài đặt ra màn hình chính Android / iPhone.
