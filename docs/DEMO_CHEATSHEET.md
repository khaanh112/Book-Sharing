# 🎯 DEMO CHEAT SHEET - Book-Sharing Architecture

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYSTEM                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐       ┌──────────┐       ┌──────────┐
│ Browser  │       │ Locust   │       │Prometheus│       ┌─────────┐
│  :5173   │       │  :8089   │       │  :9090   │       │ Grafana │
└────┬─────┘       └────┬─────┘       └────┬─────┘       │  :3001  │
     │                  │                   │             └─────────┘
     └──────────────────┴───────────────────┘
                        │
                        ↓
              ┌──────────────────┐
              │  Nginx :3000     │ ← External Port
              │  Load Balancer   │
              └────────┬─────────┘
                       │ Round-robin
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Backend#1│    │Backend#2│    │Backend#3│
   │  Node   │    │  Node   │    │  Node   │
   │ 512MB   │    │ 512MB   │    │ 512MB   │
   └────┬────┘    └────┬────┘    └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ↓                           ↓
    ┌─────────┐                ┌──────────┐
    │  Redis  │                │ MongoDB  │
    │  :6379  │←──── Sync ─────│  :27017  │
    │  600MB  │    (Events)    │   1GB    │
    └─────────┘                └──────────┘
    
    CQRS Pattern:
    Write → MongoDB (140ms) → Event → Redis (2-5ms)
    Read  → Redis (FAST! 28x faster)
```

## 🎭 Pre-Demo Checklist

`ash
# 1. Verify all containers running
docker ps

# Expected: 10 containers (mongodb, redis, 3x backend, nginx, frontend, locust, prometheus, grafana)

# 2. Check backend health
curl http://localhost:3000/health

# 3. Open browser tabs
- Frontend: http://localhost:5173
- Locust: http://localhost:8089
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
`

---

##  Demo Script (15 minutes)

### 1 Architecture Overview (2 min)
**Show slide 1-3**
- Before: Single backend, 140ms reads
- After: 3 replicas + CQRS + Events, 2-5ms reads

### 2 Modular Monolithic (2 min)
**Show code structure**
`ash
# Open in VS Code
code backend/modules/books
code backend/modules/borrowing

# Show separation
ls backend/modules/books/domain
ls backend/modules/books/application
ls backend/modules/books/infrastructure
`

**Key points:**
-  Clean separation (domain/application/infrastructure)
-  Zero cross-module imports
-  Event-based communication

### 3 CQRS Pattern (3 min)
**Show code**
`ash
# Commands (Write to MongoDB)
code backend/modules/books/application/commands/handlers/CreateBookHandler.js

# Queries (Read from Redis)
code backend/modules/books/application/queries/handlers/GetBooksHandler.js

# Compare response time
time curl http://localhost:3000/books  # Redis: 2-5ms
`

**Key points:**
-  Write  CommandBus  MongoDB
-  Read  QueryBus  Redis (28x faster)
-  Auto sync via events

### 4 Event-Driven Architecture (2 min)
**Show listeners**
`ash
# Cascade cleanup listener (shared)
code backend/shared/events/listeners/CascadeCleanupListener.js

# Module listener (books)
code backend/modules/books/infrastructure/BooksModuleListener.js

# Check event flow in logs
docker logs book-sharing-backend-1 --tail 50 | grep ""
`

**Key points:**
-  No cross-module imports
-  Async processing
-  Easy to extend

### 5 Load Balancing & High Availability (3 min)
**Demo HA**
`ash
# 1. Show 3 backends running
docker ps | grep backend

# 2. Make requests - note which backend handles
curl http://localhost:3000/health

# 3. Stop backend #1
docker stop book-sharing-backend-1

# 4. Still works! (Nginx routes to #2, #3)
curl http://localhost:3000/health

# 5. Check nginx logs - see failover
docker logs book-sharing-nginx-1 --tail 20

# 6. Restart
docker start book-sharing-backend-1
`

**Key points:**
-  Nginx round-robin
-  Auto failover
-  99.9% availability

### 6 Load Testing (3 min)
**Run Locust test**
`ash
# 1. Open Locust UI
# http://localhost:8089

# 2. Start test
# - Users: 100
# - Spawn rate: 5
# - Run for: 60s

# 3. Or run headless
docker exec booksharing-locust locust \
  -f /mnt/locust/locustfile.py \
  --headless -u 100 -r 5 -t 60s \
  --host http://nginx:80

# 4. Expected results
# - RPS: ~100
# - Success: >99%
# - Median: <50ms
# - P95: <120ms
`

**Show while running:**
- Backend logs (watch events fire)
- Prometheus metrics (http://localhost:9090)

### 7 Monitoring & Metrics (2 min)
**Prometheus queries**
`ash
# Open Prometheus: http://localhost:9090

# Queries to show:

# 1. Request rate
rate(http_requests_total[1m])

# 2. Response time P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 3. Cache hit ratio
redis_cache_hit_total / redis_cache_total * 100

# 4. Memory usage
process_resident_memory_bytes / 1024 / 1024  # MB
`

**Grafana (optional)**
`ash
# http://localhost:3001 (admin/admin)
# Import dashboard or create panels
`

---

##  Key Talking Points

### Performance
- **28x faster reads**: MongoDB 140ms  Redis 2-5ms
- **85%+ cache hit rate**: Most requests never hit DB
- **100 req/s sustained**: With 3 replicas

### Scalability
- **Horizontal scaling**: docker-compose up -d --scale backend=5
- **Modular**: Easy to extract module to microservice later
- **300-500 users**: Current capacity

### Reliability
- **99.9% availability**: Load balancer + health checks
- **Auto failover**: Nginx detects and routes around failures
- **Graceful degradation**: Redis down  fallback to MongoDB

### Code Quality
- **Zero coupling**: No cross-module imports
- **Event-driven**: Async, scalable, testable
- **CQRS**: Read/write optimized separately

---

##  Troubleshooting

### Container not starting?
`ash
docker logs <container-name>
docker-compose down
docker-compose up -d --build
`

### Locust login fails?
`ash
# Check env vars
docker exec booksharing-locust env | grep LOCUST

# Create test user
curl -X POST http://localhost:3000/auth/register \
  -H \"Content-Type: application/json\" \
  -d '{\"name\":\"Locust Test\",\"email\":\"locust-test@example.com\",\"password\":\"12345678\"}'
`

### Metrics not showing?
`ash
# Check metrics endpoint
curl http://localhost:3000/metrics

# Check Prometheus targets
# http://localhost:9090/targets (should be UP)
`

### Redis cache not working?
`ash
# Check Redis connection
docker exec booksharing-redis redis-cli ping  # Should return PONG

# Check cache keys
docker exec booksharing-redis redis-cli KEYS readmodel:*

# Trigger rebuild
docker restart book-sharing-backend-1
`

---

##  Expected Demo Results

### Load Test Output:
`
Type     Name           # Requests  Median  95%ile  99%ile  Avg    Min  Max
------------------------------------------------------------------------
POST     /auth/login       100       45ms    120ms   180ms   55ms   20   250
GET      /books           3000        5ms     15ms    25ms    8ms    2    50
POST     /borrows          500       80ms    180ms   280ms   95ms   40   350
GET      /notifications    800       12ms     35ms    65ms   18ms    5    90
------------------------------------------------------------------------
Aggregated               4400       15ms     95ms   200ms   32ms    2   350

Success rate: 99.8%
RPS: ~73
`

### Prometheus Metrics:
`
http_requests_total:               ~4400
http_request_duration_seconds_sum: ~141s
redis_cache_hit_total:             ~3500 (85% hit rate)
process_resident_memory_bytes:     ~400MB per backend
`

---

##  Q&A Preparation

### Technical Questions:
**Q: Why not Kafka for events?**  
A: EventEmitter đủ cho monolithic. In-process faster, simpler. Có thể migrate sau.

**Q: Redis single point of failure?**  
A: Có fallback về MongoDB. Production có thể dùng Redis Sentinel/Cluster.

**Q: Tại sao không tất cả modules dùng CQRS?**  
A: Only Books module (90% read traffic). Borrowing + Notifications ít requests hơn, không cần phức tạp.

**Q: Event ordering problem?**  
A: Add timestamp, EventBus synchronous (in-order), MongoDB transactions nếu cần.

### Architecture Questions:
**Q: Khi nào migrate sang Microservices?**  
A: Khi >1000 concurrent users, team >10 people, hoặc cần deploy modules độc lập.

**Q: Database bottleneck ở đâu?**  
A: MongoDB writes. Giải pháp: Sharding, replica sets, hoặc tách DB per module.

**Q: Frontend optimization?**  
A: React lazy loading, code splitting, CDN for static assets, service worker caching.

---

##  Demo Closing

### Summary Points:
1.  **28x faster** reads with CQRS + Redis
2.  **99.9% uptime** with load balancing
3.  **Clean code** with modular + event-driven
4.  **Production ready** with monitoring + testing
5.  **Easy to scale** from 100  500+ users

### Next Steps:
- [ ] Rate limiting (Redis-based)
- [ ] Database sharding
- [ ] Kubernetes migration
- [ ] Add more read models (Borrow)
- [ ] Event sourcing (optional)

**Thank you! Questions?** 
