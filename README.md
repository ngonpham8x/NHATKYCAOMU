# Sổ tay cạo mủ

Ứng dụng web/PWA để ghi nhật ký cạo mủ, tính tiền theo mủ nước/mủ chén/mủ tạp, tổng hợp theo chu kỳ và xuất báo cáo Excel hoặc PDF.

## Chức năng chính

- Nhập, sửa, xóa nhật ký cạo mủ hằng ngày.
- Tính doanh thu tự động và tổng hợp theo chu kỳ, tháng, năm.
- Báo cáo biểu đồ, xuất Excel/PDF và chia sẻ báo cáo.
- Đăng nhập Google, phân quyền email và đồng bộ Firestore.
- PWA hoạt động với dữ liệu cục bộ khi mất kết nối.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Điền cấu hình Firebase của bạn vào `.env.local`. Không đưa `.env.local` lên Git.

## Kiểm tra trước khi phát hành

```bash
npm run lint
npm run build
```

## Phát hành trên Vercel

`vercel.json` đã chứa cấu hình build, SPA rewrite và các header cơ bản. Khi import repository vào Vercel, thêm các biến môi trường Production sau trong **Project Settings → Environment Variables**:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FIRESTORE_DATABASE_ID   # chỉ cần khi không dùng database (default)
```

Sau lần deploy đầu tiên, thêm tên miền Vercel vào Firebase Authentication → Settings → Authorized domains. Đồng thời xuất bản nội dung của `firestore.rules` trong Firebase Console hoặc Firebase CLI trước khi mời người dùng thật.

## Bảo mật

- Mọi hồ sơ và workspace chỉ được mở sau khi Firebase xác thực thành công.
- Firestore Rules giới hạn dữ liệu theo chủ sở hữu, admin được cấp quyền, hoặc email được ủy quyền xem.
- Các tệp `.env*` bị loại khỏi Git; cấu hình mẫu nằm trong `.env.example`.
- Firebase Web API key là định danh ứng dụng phía trình duyệt, không phải khóa bí mật. Vẫn cần giới hạn API key theo domain trong Google Cloud Console.
