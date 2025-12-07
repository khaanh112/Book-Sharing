# 🚀 CẢI TIẾN KIẾN TRÚC HỆ THỐNG BOOK-SHARING
## Modular Monolithic + CQRS + Event-Driven + Load Balancing

---

## 📑 MỤC LỤC (17 SLIDES)

**PHẦN 1: TỔNG QUAN (3 slides)**
1. Tổng quan hệ thống
2. Kiến trúc ban đầu
3. Kiến trúc sau cải tiến

**PHẦN 2: CÁC CẢI TIẾN (8 slides)**
4. Modular Monolithic Architecture
5. CQRS Pattern
6. Event-Driven Architecture
7. Load Balancing với Nginx
8. Docker Containerization
9. Redis Read Model (True CQRS)
10. Monitoring & Metrics
11. Tổng hợp các cải tiến

**PHẦN 3: KẾT QUẢ (4 slides)**
12. Lý do chọn giải pháp
13. So sánh performance
14. Bài học kinh nghiệm
15. Demo thực tế

**PHẦN 4: KẾT LUẬN (2 slides)**
16. Tóm tắt đóng góp
17. Q&A

---

## SLIDE 1: TỔNG QUAN HỆ THỐNG 📚

### Book-Sharing Platform
**Hệ thống chia sẻ sách trực tuyến**

#### Tính năng chính
- 👤 Đăng ký/Đăng nhập người dùng
- 📖 Quản lý sách cá nhân  
- 🤝 Mượn/Cho mượn sách
- 🔔 Thông báo real-time
- 🔍 Tìm kiếm Google Books API

#### Tech Stack
- **Backend**: Node.js 20, Express 5, MongoDB 7, Redis 7
- **Frontend**: React 18, Vite 7, Tailwind CSS
- **DevOps**: Docker, Nginx, Prometheus, Grafana

#### Mục tiêu cải tiến
✅ **Scalability** - Tăng khả năng mở rộng  
✅ **Performance** - Cải thiện hiệu suất (28x faster)  
✅ **Maintainability** - Dễ bảo trì, phát triển  
✅ **Reliability** - High availability

---

## SLIDE 2: KIẾN TRÚC BAN ĐẦU ❌

### Sơ đồ
```
Browser
   ↓ HTTP
Backend (Single Instance)
   ├─ Controllers
   ├─ Routes  
   ├─ Models
   └─ Utils
   ↓
MongoDB (No cache)
```

### Vấn đề
❌ **Single Point of Failure** - Server die → Toàn bộ hệ thống down  
❌ **No Scalability** - Không thể scale horizontal  
❌ **Slow Performance** - Read books: ~140ms (MongoDB)  
❌ **Tight Coupling** - Logic nghiệp vụ lẫn lộn  
❌ **Hard to Maintain** - Code khó đọc, test, mở rộng

### Performance
| Metric | Giá Trị |
|--------|---------|
| Response Time | 800-1200ms |
| Read Books | ~140ms/query |
| Concurrent Users | 50-100 users |
| Availability | ~95% |

---

## SLIDE 3: KIẾN TRÚC SAU CẢI TIẾN ✅

### Sơ đồ tổng thể
```
Browser
   ↓ HTTP
Nginx Load Balancer (Round Robin)
   ↓
┌─────────────┬─────────────┬─────────────┐
│ Backend #1  │ Backend #2  │ Backend #3  │
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │  CQRS   │ │ │  CQRS   │ │ │  CQRS   │ │
│ │ Events  │ │ │ Events  │ │ │ Events  │ │
│ │ Modules │ │ │ Modules │ │ │ Modules │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │
└─────────────┴─────────────┴─────────────┘
   ↓                    ↓                ↓
Redis (Read DB)    MongoDB (Write DB)   Prometheus
```

### 5 cải tiến chính

1. **🏗️ Modular Monolithic** - Tách modules độc lập (Auth, Books, Borrowing, Users)
2. **⚡ CQRS Pattern** - Tách Command/Query, Redis Read Model
3. **📡 Event-Driven** - EventBus + Listeners (async processing)
4. **⚖️ Load Balancing** - Nginx + 3 Backend replicas (high availability)
5. **🐳 Docker** - Containerization + orchestration

---

## SLIDE 4: MODULAR MONOLITHIC 🏗️

### Tại sao không Microservices?
- ❌ **Overkill** cho dự án vừa/nhỏ
- ❌ **Phức tạp** về deployment, debugging
- ❌ **Chi phí cao** infrastructure

✅ **Modular Monolithic = Best of both worlds**

### Cấu trúc modules
```
backend/modules/
├── auth/           # Authentication & Authorization
├── books/          # Book management  
├── borrowing/      # Borrow logic
├── users/          # User profiles
└── notifications/  # Notification system

Mỗi module:
├── domain/         # Entities, Value Objects
├── application/    # Use cases, handlers
├── infrastructure/ # DB, external APIs
└── interface/      # Controllers, routes
```

### Lợi ích
✅ **Tách biệt rõ ràng** - Mỗi module độc lập  
✅ **Dễ test** - Test từng module riêng  
✅ **Team collaboration** - Nhiều dev cùng làm  
✅ **Deploy đơn giản** - Vẫn là 1 app

---

## SLIDE 5: CQRS PATTERN ⚡

### Command Query Responsibility Segregation

```
┌─────────────┐         ┌──────────────┐
│  COMMANDS   │         │   QUERIES    │
│  (Writes)   │         │   (Reads)    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       ↓                       ↓
  CommandBus              QueryBus
       │                       │
       ↓                       ↓
  Command Handlers        Query Handlers
       │                       │
       ↓                       ↓
   MongoDB (Write)        Redis (Read)
```

### Ví dụ code
```javascript
// Command: Create Book
await commandBus.execute(
  new CreateBookCommand(bookData)
);

// Query: Get Book
const book = await queryBus.execute(
  new GetBookByIdQuery(bookId)
);
```

### TRUE CQRS với Redis Read Model
- **Write** → MongoDB (source of truth)
- **Read** → Redis (optimized for speed)
- **Sync** → Event-driven (ReadModelSyncListener)

### Kết quả
🚀 **28x faster** reads: 140ms → 2-5ms

---

## SLIDE 6: EVENT-DRIVEN ARCHITECTURE 📡

### Flow diagram
```
User Action
    ↓
Controller emits Event
    ↓
EventBus broadcasts
    ↓
┌────────────┬──────────────┬─────────────────┐
│ Listener 1 │  Listener 2  │   Listener 3    │
│ Notify     │  Send Email  │  Clear Cache    │
└────────────┴──────────────┴─────────────────┘
```

### Events
```javascript
// Book Events
- book.created
- book.updated
- book.deleted
- book.borrowed
- book.returned

// Borrow Events  
- borrow.created
- borrow.approved
- borrow.rejected
- borrow.returned
- borrow.cancelled
```

### Listeners
1. **NotificationListener** - Tạo thông báo cho users
2. **EmailListener** - Gửi email async
3. **CacheInvalidationListener** - Xóa cache tự động
4. **ReadModelSyncListener** - Đồng bộ Redis read model

### Lợi ích
✅ **Decoupling** - Components độc lập  
✅ **Async processing** - Non-blocking  
✅ **Easy to extend** - Thêm listener mới dễ dàng  
✅ **Auto cache invalidation** - Không cần manual clear

---

## SLIDE 7: LOAD BALANCING VỚI NGINX ⚖️

### Nginx Reverse Proxy
```nginx
upstream backend_nodes {
    server backend:3000;  # Docker DNS auto-resolve
}

server {
    listen 80;
    location / {
        proxy_pass http://backend_nodes;
    }
}
```

### Docker Compose Scale
```yaml
backend:
  deploy:
    replicas: 3              # 3 instances
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
  healthcheck:
    test: ["CMD", "wget", "http://localhost:3000/health"]
    interval: 30s
```

### Round Robin Algorithm
```
Request 1 → Backend #1
Request 2 → Backend #2  
Request 3 → Backend #3
Request 4 → Backend #1 (repeat)
```

### Lợi ích
✅ **High Availability** - 1 backend down → 2 còn hoạt động  
✅ **Load Distribution** - Phân tải đều  
✅ **Auto failover** - Health check tự động  
✅ **Easy scaling** - Tăng replicas dễ dàng

---

## SLIDE 8: DOCKER CONTAINERIZATION 🐳

### Multi-container setup
```yaml
services:
  mongodb:     # Write DB
  redis:       # Read DB + Cache
  backend:     # x3 replicas
  nginx:       # Load balancer
  frontend:    # React app
  prometheus:  # Metrics
  locust:      # Load testing
```

### Resource allocation
| Service | CPU | RAM | Purpose |
|---------|-----|-----|---------|
| MongoDB | 1.0 | 1GB | Write database |
| Redis | 0.5 | 600MB | Read model + cache |
| Backend (each) | 1.0 | 512MB | Application logic |
| Nginx | 0.5 | 256MB | Load balancer |

### Lợi ích
✅ **Isolated environments** - Mỗi service độc lập  
✅ **Easy deployment** - `docker-compose up`  
✅ **Resource control** - Limits & reservations  
✅ **Portable** - Chạy mọi nơi có Docker

---

## SLIDE 9: REDIS READ MODEL (TRUE CQRS) 💾

### Write vs Read flow
```
WRITE:
User → Backend → MongoDB → Event → ReadModelSyncListener → Redis

READ:
User → Backend → Redis (2-5ms) ✅
```

### Sync mechanism
```javascript
// On server start: Full sync
await bookReadModel.rebuildFromSource();

// Runtime: Event-driven sync
eventBus.on('book.created', async (data) => {
  await readModel.saveBook(data);
});

eventBus.on('book.updated', async (data) => {
  await readModel.updateBook(data);
});
```

### Redis keys
```
readmodel:book:{bookId}      # Single book
readmodel:books:all          # All books list
```

### Performance impact
- **Before**: MongoDB query ~140ms
- **After**: Redis query ~2-5ms
- **Result**: **28x faster** ⚡

---

## SLIDE 10: MONITORING & METRICS 📊

### Prometheus Integration
```javascript
// Expose /metrics endpoint
import promClient from 'prom-client';
promClient.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency'
});
```

### Health checks
```javascript
// Backend health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoStatus,
    redis: redisStatus,
    uptime: process.uptime()
  });
});
```

### Metrics tracked
- 📈 Request rate (req/s)
- ⏱️ Response time (p50, p95, p99)
- 💾 Memory usage
- 🔄 Cache hit ratio
- 🚨 Error rate

### Lợi ích
✅ **Observability** - Biết hệ thống đang làm gì  
✅ **Debug nhanh** - Phát hiện bottleneck  
✅ **Optimize** - Data-driven decisions

---

## SLIDE 11: TỔNG HỢP CÁC CẢI TIẾN 🎯

### So sánh Before vs After

| Tiêu chí | Before ❌ | After ✅ |
|----------|----------|----------|
| **Architecture** | Monolithic flat | Modular Monolithic |
| **Pattern** | MVC basic | CQRS + Event-Driven |
| **Scalability** | Single instance | 3 replicas + LB |
| **Read performance** | 140ms | 2-5ms (28x) |
| **Availability** | ~95% (SPOF) | ~99.9% (HA) |
| **Cache** | Manual | Event-driven auto |
| **Deployment** | Manual | Docker orchestration |
| **Monitoring** | None | Prometheus + Grafana |

### Tech stack evolution
```
Before:
- Express + MongoDB
- No cache
- Single server

After:
- Modular architecture
- CQRS (MongoDB + Redis)
- Event-driven
- Load balancing (Nginx)
- Docker containers
- Monitoring
```

---

## SLIDE 12: LÝ DO CHỌN GIẢI PHÁP 💡

### 1. Tại sao Modular Monolithic, không phải Microservices?

| Microservices ❌ | Modular Monolithic ✅ |
|------------------|----------------------|
| Phức tạp deployment | Deploy đơn giản |
| Network latency | In-process call (nhanh) |
| Chi phí infrastructure cao | 1 codebase, dễ quản lý |
| Distributed transactions | ACID transactions |
| Overkill cho dự án nhỏ | Phù hợp quy mô vừa |

➡️ **Kết luận**: Modular Monolithic = 80% lợi ích Microservices, 20% độ phức tạp

---

### 2. Tại sao CQRS + Redis Read Model?

**Vấn đề**: 90% requests là READ, chỉ 10% là WRITE

**Giải pháp**:
- ✅ Tách READ/WRITE operations
- ✅ Optimize READ với Redis (in-memory)
- ✅ WRITE vẫn dùng MongoDB (durable)
- ✅ Event-driven sync đảm bảo consistency

**Kết quả**: 28x faster reads (140ms → 2-5ms)

---

### 3. Tại sao Event-Driven?

**Vấn đề trước**:
```javascript
// Tight coupling
await book.save();
await sendEmail();
await createNotification();
await clearCache();
// Nếu 1 thao tác fail → rollback phức tạp
```

**Sau khi dùng Events**:
```javascript
// Loosely coupled
await book.save();
eventBus.emit('book.created', book);
// Listeners xử lý độc lập, async
```

✅ **Decoupling** - Dễ maintain  
✅ **Async** - Non-blocking  
✅ **Extensible** - Thêm listener mới dễ dàng

---

### 4. Tại sao Load Balancing?

**Vấn đề**: Single Point of Failure

**Giải pháp**: Nginx + 3 Backend replicas

```
Backend #1 down → Nginx route to #2, #3
99.9% availability
```

✅ **High Availability**  
✅ **Load Distribution**  
✅ **Easy Scaling** (tăng replicas)

---

## SLIDE 13: SO SÁNH PERFORMANCE 📈

#### Before:
\\\ash
# Chạy manual
node index.js
mongod --dbpath /data/db
redis-server
\\\

#### After:
\\\yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:7
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
  
  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 600M
    command: redis-server --maxmemory 500mb --maxmemory-policy allkeys-lru
  
  backend:
    build: ./backend
    deploy:
      mode: replicated
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
  
  nginx:
    image: nginx:latest
    ports:
      - "3000:80"
\\\

**Lợi ích:**
 Consistent environment (dev = prod)
 Easy deployment (\docker-compose up -d\)
 Resource isolation & limits
 Portable across machines

### 4.2. Nginx Load Balancer

#### Configuration:
\\\
ginx
# nginx/nginx.conf
http {
    upstream backend_nodes {
        server backend:3000;  # Docker DNS resolves to all 3 replicas
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://backend_nodes;
            proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost;
            proxy_set_header X-Real-IP \;
            proxy_set_header X-Forwarded-For \;
        }
    }
}
\\\

**Lợi ích:**
 Load distribution (Round Robin)
 High availability (nếu 1 backend die, 2 backend còn lại tiếp tục hoạt động)
 SSL termination (có thể thêm HTTPS)
 Request buffering & compression

### 4.3. Modular Monolithic Architecture

#### Before (Flat Structure):
\\\
backend/
   Controllers/
      AuthController.js
      BookController.js
      BorrowController.js
   models/
      User.model.js
      Book.model.js
      Borrow.model.js
   routes/
       index.js
\\\

#### After (Modular Structure):
\\\
backend/
   modules/
       auth/
          domain/         # Business logic
          infrastructure/ # Data access
          interface/      # HTTP routes
       books/
          application/    # CQRS handlers
             commands/
             queries/
          domain/
          infrastructure/
          interface/
       borrowing/
           domain/
           infrastructure/
           interface/
\\\

**Lợi ích:**
 **High Cohesion**: Code liên quan nằm gần nhau
 **Low Coupling**: Modules độc lập, dễ thay thế
 **Scalability**: Dễ tách thành microservices sau này
 **Testability**: Test từng module riêng biệt

### 4.4. CQRS Pattern (Command Query Responsibility Segregation)

#### Architecture:
\\\javascript
// cqrs/bootstrap.js
function initializeCQRS() {
  // Command Handlers (Write)
  commandBus.register('CreateBookCommand', new CreateBookHandler());
  commandBus.register('UpdateBookCommand', new UpdateBookHandler());
  commandBus.register('DeleteBookCommand', new DeleteBookHandler());

  // Query Handlers (Read)
  queryBus.register('GetAllBooksQuery', new GetAllBooksHandler());
  queryBus.register('SearchBooksQuery', new SearchBooksHandler());
  queryBus.register('GetBookByIdQuery', new GetBookByIdHandler());
}
\\\

#### Usage Example:
\\\javascript
// Before (Controller làm tất cả)
export const createBook = async (req, res) => {
  const book = new Book(req.body);
  await book.save();
  await cache.invalidate('books:all');
  eventBus.emit('BookCreated', book);
  res.json(book);
};

// After (CQRS - separation of concerns)
export const createBook = async (req, res) => {
  const command = new CreateBookCommand(req.body);
  const book = await commandBus.execute(command);
  res.json(book);
};

// Handler lo hết logic
class CreateBookHandler {
  async handle(command) {
    const book = await Book.create(command.data);
    await cache.invalidate('books:all');
    eventBus.emit('BookCreated', book);
    return book;
  }
}
\\\

**Lợi ích:**
 **Separation of Concerns**: Read và Write tách biệt
 **Single Responsibility**: Mỗi handler làm 1 việc
 **Testability**: Test handler độc lập
 **Scalability**: Có thể scale read/write khác nhau
 **Caching**: Dễ cache queries
 **Optimization**: Optimize read/write riêng biệt

### 4.5. Event-Driven Architecture

#### EventBus Implementation:
\\\javascript
// shared/events/EventBus.js
class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(eventType, listener) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener);
  }

  emit(eventType, data) {
    const listeners = this.listeners[eventType] || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(\Error in listener for \:\, error);
      }
    });
  }
}
\\\

#### Event Flow Example:
\\\
User borrows book:
  1. BorrowController.createBorrow()
  2. EventBus.emit('BorrowRequestCreated', { borrow, book, borrower })
  3. Listeners automatically triggered:
      NotificationListener  Create notification in DB
      EmailListener  Send email to book owner
      CacheInvalidationListener  Clear cache keys
\\\

**Lợi ích:**
 **Decoupling**: Controllers không cần biết về notifications, email, cache
 **Extensibility**: Thêm listener mới không cần sửa code cũ
 **Async Processing**: Events xử lý async, không block main flow
 **Maintainability**: Logic rõ ràng, dễ theo dõi


### 4.8. Health Check System

#### Implementation:
\\\javascript
// backend/index.js
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    redis: 'Unknown',
    database: 'Unknown'
  };

  try {
    // Check Redis
    await redisClient.ping();
    health.redis = 'Connected';

    // Check MongoDB
    const dbState = mongoose.connection.readyState;
    health.database = dbState === 1 ? 'Connected' : 'Disconnected';
    
    if (health.redis !== 'Connected' || health.database !== 'Connected') {
      health.status = 'Degraded';
    }

    const httpCode = health.status === 'OK' ? 200 : 503;
    res.status(httpCode).json(health);
  } catch (error) {
    health.status = 'Error';
    health.error = error.message;
    res.status(503).json(health);
  }
});
\\\

#### Docker Health Check:
\\\yaml
backend:
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 15s
\\\

**Lợi ích:**
 Monitoring có thể check service status
 Docker tự động restart unhealthy containers
 Load balancer có thể remove unhealthy backends


---

## 5. LÝ DO LỰA CHỌN GIẢI PHÁP

### 5.1. Tại Sao Chọn Modular Monolithic Thay Vì Microservices?

#### So Sánh:

| Tiêu Chí | Microservices | Modular Monolithic |
|----------|---------------|-------------------|
| **Deployment Complexity** | Rất cao (10+ services) | Thấp (1 app, 3 replicas) |
| **Development Speed** | Chậm (setup infra) | Nhanh (focus vào logic) |
| **Testing** | Phức tạp (integration) | Đơn giản (unit + e2e) |
| **Team Size Required** | 5-10+ devs | 1-3 devs |
| **Infrastructure Cost** | Cao (nhiều containers) | Thấp (3 containers) |
| **Network Latency** | Cao (inter-service calls) | Không có (in-process) |
| **Data Consistency** | Eventual consistency | Strong consistency |
| **Debugging** | Khó (distributed tracing) | Dễ (single process) |
| **Scalability** | Cao (scale từng service) | Trung bình (scale toàn bộ) |

#### Quyết Định:

**Chọn Modular Monolithic vì:**

1. **Team Size**: Dự án nhỏ, 1-3 developers
2. **Time to Market**: Cần ship nhanh, không có thời gian setup microservices infrastructure
3. **Traffic Pattern**: 300-500 concurrent users, không cần scale phức tạp
4. **Domain Simplicity**: Business logic không phức tạp, không cần distribute
6. **Maintainability**: Dễ maintain, debug, deploy

**Khi Nào Chuyển Sang Microservices:**
- Traffic > 10,000 concurrent users
- Team size > 5 developers
- Cần scale độc lập từng module (VD: Books service quá tải)
- Cần deploy độc lập (VD: Auth thay đổi không ảnh hưởng Books)

### 5.2. Tại Sao Chọn CQRS?

**Ưu điểm:**
 Tách biệt read/write logic  dễ optimize riêng
 Queries có thể cache hiệu quả (immutable)
 Commands có thể queue, retry
 Dễ implement event sourcing sau này
 Code clean hơn, dễ test

**Nhược điểm:**
 Complexity tăng (CommandBus, QueryBus)
 Boilerplate code nhiều hơn

**Trade-off:** Đánh đổi complexity để đạt được maintainability và scalability

### 5.3. Tại Sao Chọn Event-Driven?

**Ưu điểm:**
 Decoupling: Modules không phụ thuộc lẫn nhau
 Extensibility: Thêm feature không sửa code cũ
 Async processing: Không block main flow
 Audit log: Track mọi event trong hệ thống

**Nhược điểm:**
 Debugging khó hơn (event flow)
 Testing phức tạp hơn (mock events)

**Trade-off:** Đánh đổi debug complexity để đạt được decoupling



### 5.5. Tại Sao Chọn Nginx?

**Alternatives:**
- HAProxy: Chuyên cho TCP, phức tạp hơn
- Traefik: Tốt cho Kubernetes, overkill cho Docker Compose
- AWS ALB: Cloud-only, cost cao
- Nginx:  Simple,  Popular,  Fast

**Lý do:**
1. **Simplicity**: 20 dòng config
2. **Performance**: 10,000+ RPS
3. **Features**: Load balancing, SSL, caching, compression
4. **Community**: Documentation nhiều

---

## 6. KẾT QUẢ ĐO LƯỜNG

## 8. KẾT LUẬN

### 8.1. Tóm Tắt Cải Tiến

| Cải Tiến | Before | After | Impact |
|----------|--------|-------|--------|
| **Architecture** | Flat MVC | Modular Monolithic | Maintainability  |
| **Patterns** | None | CQRS + Events | Code Quality  |
| **Scalability** | 1 instance | 3 replicas + Nginx | Availability  |
| **Response Time** | 800-1200ms | **120ms** | **85-90% faster** |
| **Concurrent Users** | 50-100 | **400** | **4-8x capacity** |

### 8.2. Lessons Learned

####  What Worked Well:
1. **Modular Monolithic**: Đủ scale cho 300-500 users, dễ maintain
2. **CQRS Pattern**: Code clean, dễ test, dễ optimize
3. **Event-Driven**: Decoupling tốt, extensible
4. **Docker**: Deployment đơn giản, consistent
5. **Nginx**: Load balancing hiệu quả
