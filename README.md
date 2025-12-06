# 📚 Book-Sharing Application

A full-stack book sharing platform with modern architecture patterns — **Modular Monolith + CQRS + Event-Driven Architecture**.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                      │
│                    http://localhost:5173                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                   NGINX Load Balancer                           │
│                   http://localhost:3000                         │
└──────┬─────────────┬─────────────┬──────────────────────────────┘
       │             │             │
┌──────▼──────┐ ┌───▼──────┐ ┌────▼──────┐
│ Backend #1  │ │Backend #2│ │Backend #3 │  ← 3 Replicas
│  (Healthy)  │ │(Healthy) │ │(Healthy)  │
└──────┬──────┘ └────┬─────┘ └─────┬─────┘
       └─────────────┴─────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                        │
│                                                                 │
│  🎯 Modular Monolith (5 Modules)                               │
│  ├─ auth         → Authentication & Authorization              │
│  ├─ books        → Book management (CQRS implemented)         │
│  ├─ borrowing    → Borrow workflow (Event emitter)            │
│  ├─ users        → User management (Event emitter)            │
│  └─ notifications → Notification system (Event consumer)       │
│                                                                 │
│  ⚡ CQRS Pattern                                                │
│  ├─ Commands: Create, Update, Delete                          │
│  └─ Queries: GetAll, GetById, Search, GetMyBooks              │
│                                                                 │
│  📡 Event-Driven Architecture                                   │
│  ├─ EventBus (12 event types)                                 │
│  └─ 3 Listeners:                                               │
│      • NotificationListener → Create DB notifications          │
│      • EmailListener → Send emails                             │
│      • CacheInvalidationListener → Clear Redis cache           │
│                                                                 │
│  🛡️ Shared Kernel                                              │
│  ├─ Middlewares: auth, validation, upload, error handling     │
│  ├─ Validators: Joi schemas for all endpoints                 │
│  └─ Utils: cache, jwt, redis, metrics, cron jobs              │
└─────────────┬───────────────────┬───────────────────────────────┘
              │                   │
   ┌──────────▼──────┐   ┌────────▼────────┐
   │ Redis (Cache +  │   │ MongoDB Atlas   │
   │ Rate Limiting)  │   │   (Database)    │
   │  Port: 6379     │   │  Cloud Hosted   │
   └─────────────────┘   └─────────────────┘

🔧 External Services:
├─ Cloudinary (Image Storage)
├─ Google Books API (Search)
├─ Nodemailer (Email)
├─ Prometheus + Grafana (Monitoring)
└─ Locust (Load Testing)
```

## ✨ Architecture Highlights

### 🏛️ Clean Architecture Patterns

1. **Modular Monolith** - 5 independent modules with clear boundaries
2. **CQRS** - Separate read/write operations (7 handlers registered)
3. **Event-Driven** - Async communication via EventBus (3 listeners active)
4. **Repository Pattern** - Data access abstraction
5. **Domain-Driven Design** - Layered architecture (Interface → Application → Domain → Infrastructure)

### 📊 Performance & Scalability

- ⚡ **Redis Caching**: 45ms (cached), 180ms (uncached)
- 🔄 **Horizontal Scaling**: 3 backend replicas behind nginx
- 🛡️ **Rate Limiting**: Redis-backed (100 req/15min per IP)
- 💾 **Database**: MongoDB Atlas with indexing
- 📈 **Monitoring**: Prometheus + Grafana

## 🚀 Features

### User Management
- ✅ User registration with email verification
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Token blacklist on logout
- ✅ Profile management

### Book Management (CQRS Pattern)
- ✅ Add books manually or from Google Books API
- ✅ Upload book thumbnails (Cloudinary)
- ✅ Search books (local DB + external Google Books)
- ✅ View book details
- ✅ Update/Delete own books
- ✅ Cache-optimized queries

### Borrowing System (Event-Driven)
- ✅ Request to borrow books
- ✅ Accept/Reject borrow requests
- ✅ Mark books as returned
- ✅ Automatic notifications (in-app + email)
- ✅ Due date reminders (cron jobs)

### Notifications
- ✅ Real-time notification count
- ✅ Mark as read/unread
- ✅ Email notifications for key events
- ✅ Event-driven architecture (async processing)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express 5.1
- **Database**: MongoDB Atlas
- **Cache**: Redis 7
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Authentication**: JWT
- **Validation**: Joi
- **Monitoring**: Prometheus + Grafana

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 7
- **Routing**: React Router 7
- **State**: Context API
- **HTTP**: Axios
- **Styling**: Tailwind CSS
- **Notifications**: React Toastify

### DevOps
- **Containerization**: Docker + Docker Compose
- **Load Balancer**: Nginx
- **Scaling**: 3 backend replicas
- **Health Checks**: Automated monitoring
- **Load Testing**: Locust

## 📦 Quick Start with Docker

```bash
# Clone repository
git clone <your-repo-url>
cd Book-Sharing

# Start all services (backend x3, frontend, redis, nginx, monitoring)
docker-compose up -d

# Check health
docker ps
```

**Access URLs**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Locust: http://localhost:8089

## 🔧 Manual Installation (Local Development)

### 1) Clone Repository

```bash
git clone <your-repo-url>
cd Book-Sharing
```

### 2) Backend Setup

```bash
cd backend
npm install

# Create .env file with:
# MONGODB_URI=<your-mongodb-atlas-uri>
# PORT=3000
# REDIS_URL=redis://localhost:6379
# ACCESS_TOKEN_SECRET=<your-secret>
# REFRESH_TOKEN_SECRET=<your-secret>
# CLOUDINARY_NAME=<your-cloudinary-name>
# CLOUDINARY_API_KEY=<your-key>
# CLOUDINARY_API_SECRET=<your-secret>
# API_GOOGLEBOOK=<your-google-books-api-key>
# FRONTEND_URL=http://localhost:5173

npm run dev
```

Server backend chạy trên `http://localhost:3000`

### 3) Frontend Setup

```bash
cd frontend
npm install

# Create .env file with:
# VITE_API_URL=http://localhost:3000

npm run dev
```

Frontend chạy trên `http://localhost:5173`

## 📚 API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/verify/:token` - Email verification
- `GET /auth/refresh-token` - Refresh access token
- `GET /auth/current` - Get current user

### Books Endpoints (CQRS)
- `GET /books` - Get all books (Query)
- `GET /books/my-books` - Get user's books (Query)
- `GET /books/search?q=` - Search local DB (Query)
- `GET /books/google-search?q=` - Search Google Books API
- `GET /books/:id` - Get book by ID (Query)
- `POST /books` - Create book (Command)
- `PUT /books/:id` - Update book (Command)
- `DELETE /books/:id` - Delete book (Command)

### Borrowing Endpoints (Event-Driven)
- `GET /borrows/my-requests` - Get borrow requests
- `GET /borrows/my-borrows` - Get borrowed books
- `GET /borrows/pending-requests` - Get pending requests
- `POST /borrows` - Create borrow request (→ emits events)
- `PUT /borrows/:id/accept` - Accept request (→ emits events)
- `PUT /borrows/:id/reject` - Reject request (→ emits events)
- `PUT /borrows/:id/return` - Return book (→ emits events)

### Notifications Endpoints
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read

### System Endpoints
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## 🏗️ Architecture Details

For comprehensive architecture documentation, see [FINAL_ARCHITECTURE.md](./FINAL_ARCHITECTURE.md)

### Module Structure

```
backend/
├── config/              # Configuration (DB, Cloudinary)
├── cqrs/               # CQRS infrastructure
│   ├── CommandBus.js
│   ├── QueryBus.js
│   └── bootstrap.js
├── modules/            # 5 Business modules
│   ├── auth/
│   ├── books/          # Full CQRS + Events
│   ├── borrowing/      # Event emitter
│   ├── users/          # Event emitter
│   └── notifications/  # Event consumer
├── shared/             # Shared kernel
│   ├── events/         # Event-driven architecture
│   ├── middlewares/    # Auth, validation, upload
│   ├── validators/     # Joi schemas
│   └── utils/          # Cache, JWT, Redis, metrics
└── index.js            # Main entry point
```

### Event Flow Example

```
1. User creates borrow request
2. BorrowService.createBorrow() → Save to DB
3. Emit event: borrow.created { borrowId, bookId, ... }
4. EventBus triggers 3 listeners:
   a) NotificationListener → Create DB notification
   b) EmailListener → Send email to book owner
   c) CacheInvalidationListener → Clear cache
5. Response sent to client (non-blocking)
```

## 📊 Monitoring

### Prometheus Metrics
- Request duration histogram
- Request counter (by route, method, status)
- Rate limit metrics (allowed/blocked)
- Cache hit/miss ratio

### Grafana Dashboards
- Access http://localhost:3001
- Default credentials: admin/admin
- Pre-configured dashboards for backend metrics

## 🧪 Load Testing

```bash
# Start Locust
docker-compose up -d locust

# Access web UI
open http://localhost:8089

# Configure:
# - Number of users: 100
# - Spawn rate: 10/s
# - Host: http://nginx
```

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Token blacklist on logout
- ✅ Rate limiting (Redis-backed)
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Input validation (Joi)
- ✅ File upload validation
- ✅ SQL injection prevention (Mongoose)

## 🎯 Performance Optimizations

- ✅ Redis caching (3-5 min TTL)
- ✅ Cache invalidation on writes
- ✅ Database indexing
- ✅ Load balancing (3 replicas)
- ✅ Async event processing
- ✅ Connection pooling

## 📈 Scalability

Current setup supports:
- **3 backend replicas** (horizontal scaling)
- **Redis-backed rate limiting** (shared state)
- **Stateless architecture** (JWT-based)
- **Health checks** (automatic failover)
- **Load testing verified** (100+ concurrent users)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created with ❤️ using modern architecture patterns:
- Modular Monolith
- CQRS Pattern
- Event-Driven Architecture
- Domain-Driven Design

**Architecture Status**: ✅ Production Ready

---

**Last Updated**: December 4, 2025  
**Version**: 1.0.0

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
