# Book Sharing

Một ứng dụng web chia sẻ sách (Fullstack) — backend bằng Node.js/Express và MongoDB, frontend bằng React (Vite).

## Demo ngắn

- Chức năng chính: đăng ký/đăng nhập, đăng sách, gửi/nhận yêu cầu mượn, quản lý sách cá nhân, thông báo.
- Kỹ thuật: REST API + JWT, upload ảnh qua Cloudinary, frontend SPA React.

## Kỹ thuật (Tech stack)

- Backend: Node.js, Express, Mongoose, MongoDB
- Frontend: React, Vite
- Lưu trữ ảnh: Cloudinary
- Xác thực: JWT
- Gửi email: (nodemailer)

## Tính năng nổi bật

- Đăng ký, đăng nhập và xác minh email
- Người dùng có thể đăng sách kèm ảnh
- Tìm kiếm và xem chi tiết sách
- Gửi yêu cầu mượn, quản lý trạng thái (chấp nhận/từ chối)
- Thông báo cho chủ sách và người mượn
- Đánh giá sách sau khi mượn

## Hướng dẫn cài đặt (local)

Lưu ý: ví dụ dưới dành cho Windows (cmd). Bạn có thể dùng Git Bash, PowerShell hoặc terminal khác.

1) Clone repo

```bash
git clone <your-repo-url>
cd "Book-Sharing"
```

2) Backend

```cmd
cd backend
npm install
rem Tạo file .env theo mẫu .env.example (nếu có)
npm run dev
```

Server backend mặc định sẽ chạy trên `http://localhost:3000` (kiểm tra `index.js` hoặc `package.json` nếu cần thay đổi).

3) Frontend

```cmd
cd frontend
npm install
npm run dev
```

Frontend (Vite) sẽ khởi chạy và thường mở tại `http://localhost:5173`.

## Biến môi trường (ví dụ mẫu)

Tạo file `.env` trong `backend/` với các biến như:

- MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/book-sharing
- PORT=5000
- JWT_SECRET=your_jwt_secret
- CLOUDINARY_CLOUD_NAME=your_cloud_name
- CLOUDINARY_API_KEY=your_api_key
- CLOUDINARY_API_SECRET=your_api_secret
- EMAIL_HOST=smtp.example.com
- EMAIL_USER=your_email@example.com
- EMAIL_PASS=your_email_password
- CLIENT_URL=http://localhost:5173

Gợi ý: đừng commit `.env` chứa secret lên GitHub. Thay vào đó có thể thêm `backend/.env.example` chứa tên biến và giá trị mẫu (không chứa secret).

## Cấu trúc dự án (tóm tắt)

- `backend/`
  - `index.js` — entry point server
  - `Controllers/` — xử lý logic cho mỗi route
  - `models/` — Mongoose schemas (User, Book, Borrow, Notification...)
  - `routes/` — tập hợp route
  - `config/` — DB connection, Cloudinary config
  - `middlewares/` — auth, upload, error handler
  - `utils/` — helper functions (jwt, email, cron jobs...)

- `frontend/`
  - `src/api/` — wrapper gọi REST API
  - `src/context/` — React Context để quản lý state (Auth, Book, Borrow, Notification)
  - `src/pages/`, `src/components/` — giao diện người dùng

## API (tổng quan)

- `AuthRoutes` — Đăng ký, đăng nhập, logout, verify email
- `BookRoutes` — Tạo/đọc/cập nhật/xóa sách, tìm kiếm, lấy chi tiết
- `BorrowRoutes` — Tạo/quản lý yêu cầu mượn, chấp nhận/từ chối
- `NotificationRoutes` — Lấy/đánh dấu thông báo
- `UserRoutes` — Cập nhật hồ sơ, lấy thông tin người dùng

Xem chi tiết endpoint trong `backend/routes/` và logic trong `backend/Controllers/`.

## Script hữu ích

- Backend (ở `backend/`):
  - `npm run dev` — chạy server ở chế độ phát triển (ví dụ dùng nodemon)
  - `npm start` — chạy production (nếu được cấu hình)

- Frontend (ở `frontend/`):
  - `npm run dev` — chạy Vite dev server
  - `npm run build` — build production
  - `npm start` — serve build (nếu cấu hình)

Kiểm tra `package.json` tương ứng để biết chính xác các script hiện có.
