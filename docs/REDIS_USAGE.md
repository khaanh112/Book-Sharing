# Redis — Hướng dẫn sử dụng trong dự án Book-Sharing

Phiên bản: 1.0.0

Tài liệu này mô tả cách Redis được triển khai trong repository, cách sử dụng trong code, các ví dụ, troubleshooting và các bước nâng cao cho môi trường production.

## Mục lục
- Tổng quan về triển khai
- Files liên quan
- Biến môi trường
- Ví dụ dùng trong code (get/set/del)
- Rate limiter (express-rate-limit + rate-limit-redis)
- Key naming và TTL
- Health check
- Debug / Troubleshoot
- Production checklist
- Next steps khuyến nghị

---

## 1) Tổng quan

- Redis được dùng cho:
  - Caching dữ liệu (ví dụ: danh sách sách `/books` không có filter).
  - Store cho rate limiter (khi dùng nhiều instance để có distributed rate limiting).

- Implementation hiện tại:
  - `ioredis` làm client Redis (đã thêm dependency vào `backend/package.json`).
  - `backend/utils/redisClient.js` xuất 1 singleton Redis client (ioredis). Mọi module import file này sẽ dùng cùng một kết nối.
  - `backend/index.js` truyền client đó vào `rate-limit-redis` store: `new RedisStore({ client: redisClient })`.
  - `backend/Controllers/BookController.js` dùng `redisClient.get/set/del` để cache/list invalidation.

## 2) Files chính (nơi đã thay đổi / nơi tích hợp)

- `backend/utils/redisClient.js` — singleton ioredis client, logs kết nối.
- `backend/index.js` — cấu hình rate limiter + truyền Redis store.
- `backend/Controllers/BookController.js` — caching cho GET /books và invalidation khi CRUD.
- `docker-compose.yml` — service `redis` và `REDIS_URL=redis://redis:6379` cho backend.

## 3) Biến môi trường

- `REDIS_URL` (khuyến nghị): ví dụ `redis://redis:6379` — docker-compose đã set sẵn.
- `REDIS_HOST`, `REDIS_PORT` (dự phòng) — code hỗ trợ fallback về `redis` host khi cần.

Trong Docker Compose backend service đã có:

```
environment:
  - REDIS_URL=redis://redis:6379
```

## 4) Ví dụ dùng trong code (ioredis)

- Import client singleton:

```js
import redisClient from '../utils/redisClient.js'
```

- Lấy cache:

```js
const cached = await redisClient.get('books:all')
if (cached) {
  const books = JSON.parse(cached)
}
```

- Set cache (ioredis):

```js
await redisClient.set('books:all', JSON.stringify(books), 'EX', 300) // TTL 300s
```

- Xóa key (invalidate):

```js
await redisClient.del('books:all')
```

Lưu ý: `ioredis` nhận tham số `EX`/`PX` như positional args (không phải object options như node-redis v4).

## 5) Rate limiter

- Middleware: `express-rate-limit` + `rate-limit-redis`.
- Cấu hình chính đã dùng (trong `index.js`):
  - windowMs = 15 phút (mặc định), limit = 100
  - headers: draft-6 (RateLimit-Policy / RateLimit-Limit / RateLimit-Remaining / RateLimit-Reset)
  - store: `new RedisStore({ client: redisClient })`

Ví dụ handler khi vượt giới hạn trả 429 JSON (đã có trong code).

## 6) Key naming & TTL (đề xuất)

- Quy tắc key cơ bản:
  - danh sách: `books:all` (hiện tại)
  - chi tiết: `books:id:<bookId>`
  - search/pagination: `books:list:q=<q>&page=<n>&size=<s>` hoặc slug-encode param
  - user-specific: `user:<userId>:books`

- TTL khuyến nghị:
  - danh sách tổng: 300s (5 phút)
  - chi tiết: 3600s (1 giờ) — nếu content ít thay đổi
  - search/pagination: 120s–300s tùy tần suất cập nhật

## 7) Health check (recommended)

Bạn có thể thêm route kiểm tra Redis:

```js
app.get('/health/redis', async (req, res) => {
  try {
    const pong = await redisClient.ping()
    return res.json({ redis: pong === 'PONG' ? 'ok' : 'fail' })
  } catch (err) {
    return res.status(500).json({ redis: 'error', error: err.message })
  }
})
```

## 8) Troubleshooting & debug nhanh

- Kiểm tra logs backend:
  - `docker-compose logs backend --tail=200`
  - Tìm dòng: `Redis client connected` / `Redis client ready`

- Kiểm tra service Redis:
  - `docker-compose ps`
  - `docker-compose logs redis --tail=200`
  - Bên trong container: `docker-compose exec redis redis-cli ping` => `PONG`

- Kiểm tra biến môi trường trong container backend:
  - `docker-compose exec backend printenv | findstr REDIS` (Windows)

- Nếu gặp `ECONNREFUSED 127.0.0.1:6379`:
  - Kiểm tra `REDIS_URL` của backend; trong Docker Compose phải trỏ tới `redis` (service name) chứ không phải `localhost`.

- Nếu get/set ném lỗi ở runtime, bọc các call Redis trong try/catch để tránh phá request path:

```js
try {
  await redisClient.set(key, value, 'EX', 300)
} catch (err) {
  console.warn('Redis set failed', err)
}
```

## 9) Production checklist

- Authentication & TLS: nếu Redis public hoặc managed, bật AUTH (password) và TLS.
- Persistence & memory policy: tùy nhu cầu bật RDB/AOF hoặc sử dụng managed Redis với snapshot/backup.
- Monitoring: thêm metrics (latency, memory, hits/misses). Có thể dùng `redis-cli info` hoặc agent (Prometheus exporters).
- Circuit breaker / fallback: tránh để Redis down làm sập app; fallback read-from-DB và log lỗi.
- Connection pooling / limits: đảm bảo connection count phù hợp với số instance.

## 10) Next steps khuyến nghị (tôi có thể làm giúp)

1. Hardening: bọc tất cả calls to Redis trong try/catch để không làm fail request nếu Redis lỗi.
2. Health endpoint `/health/redis` (tôi có thể thêm).
3. Mở rộng cache cho `GET /books/:id` và search/pagination.
4. Viết tests integration cho caching + invalidation.

---

Nếu bạn muốn tôi thực hiện một trong các bước tiếp theo (ví dụ: thêm health endpoint + hardening + viết docs nhỏ hơn trong `backend/`), chọn 1 trong các option sau và tôi bắt tay làm:

- A: Hardening (wrap redis calls) + health endpoint
- B: Thêm caching cho book detail + invalidation
- C: Chỉ generate docs (xong) — đã hoàn tất

Chọn A/B/C hoặc mô tả yêu cầu khác.
