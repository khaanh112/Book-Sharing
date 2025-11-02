# Rate Limiter Load Test Guide

## 🎯 Overview

This guide shows how to test the rate limiter implementation with Locust and monitor metrics in real-time using Prometheus/Grafana.

## 📋 Prerequisites

1. **Backend running** with rate limiter **ENABLED**
2. **Prometheus** scraping metrics at http://localhost:3000/metrics
3. **Grafana** configured with Prometheus datasource
4. **Locust** container running

## 🔧 Setup

### 1. Enable Rate Limiter

Edit `docker-compose.yml` to enable rate limiter:

```yaml
backend:
  environment:
    - RATE_LIMIT_ENABLED=true  # Change from false to true
    - RATE_LIMIT_LIMIT=100     # 100 requests per window
    - RATE_LIMIT_WINDOW_MIN=15 # 15 minute window
```

Then restart backend:
```cmd
docker-compose up -d --no-deps backend
```

Verify rate limiter is enabled:
```cmd
docker-compose logs --tail 5 backend
```

Should see: `Rate limiter enabled: 100 requests per 900000ms`

### 2. Verify Metrics Endpoint

```powershell
(curl http://localhost:3000/metrics).Content | Select-String "rate_limit"
```

Should see:
- `rate_limit_blocked_total` 
- `rate_limit_allowed_total`

### 3. Check Prometheus Scraping

Open http://localhost:9090/targets - should show backend target as "UP"

### 4. Prepare Grafana Dashboard

Open http://localhost:3001 and create dashboard with these panels:

**Panel 1: Rate Limit Status**
```promql
rate(rate_limit_blocked_total[1m])
```

**Panel 2: Allowed Requests**
```promql
rate(rate_limit_allowed_total[1m])
```

**Panel 3: Block Rate by Route**
```promql
sum by (route) (rate(rate_limit_blocked_total[5m]))
```

## 🚀 Running Load Test

### Scenario 1: Light Load (Should NOT Trigger Rate Limit)

1. Open http://localhost:8089
2. Configure:
   - **Number of users**: 10
   - **Spawn rate**: 2
   - **Host**: http://backend:3000
3. Click "Start Swarm"
4. Watch for **5 minutes**
5. Expected: Zero `rate_limit_blocked_total` increments

### Scenario 2: Heavy Load (WILL Trigger Rate Limit)

1. Stop previous test
2. Configure:
   - **Number of users**: 50
   - **Spawn rate**: 10
   - **Host**: http://backend:3000
3. Click "Start Swarm"
4. Watch metrics in Grafana:
   - `rate_limit_blocked_total` should increase
   - `rate_limit_allowed_total` should plateau when limit hit
5. Check Locust UI for 429 responses

### Scenario 3: Sustained Load Test

1. Configure:
   - **Number of users**: 30
   - **Spawn rate**: 5
   - **Run time**: 30 minutes
2. Monitor:
   - Backend logs for rate limit messages
   - Prometheus for metric trends
   - Grafana for visualization

## 📊 Monitoring During Test

### Real-time Prometheus Queries

Open http://localhost:9090/graph and run:

**Total blocked requests:**
```promql
sum(rate_limit_blocked_total)
```

**Blocked requests rate (per second):**
```promql
rate(rate_limit_blocked_total[1m])
```

**Top blocked routes:**
```promql
topk(5, sum by (route) (rate_limit_blocked_total))
```

**Top blocked IPs:**
```promql
topk(10, sum by (ip) (rate_limit_blocked_total))
```

**Request success rate:**
```promql
sum(rate(rate_limit_allowed_total[5m])) / 
(sum(rate(rate_limit_allowed_total[5m])) + sum(rate(rate_limit_blocked_total[5m]))) * 100
```

### Backend Logs

```cmd
docker-compose logs -f backend | findstr "Rate limit"
```

Should see messages like:
```
Rate limit reached for IP: ::ffff:172.18.0.1, route: /books
```

## 🧪 Test Scenarios & Expected Results

### Test 1: Gradual Ramp Up

**Setup:**
- Start: 5 users
- Increment: +5 users every 2 minutes
- Max: 50 users
- Duration: 20 minutes

**Expected Metrics:**
- `rate_limit_allowed_total` increases linearly until threshold
- `rate_limit_blocked_total` starts at ~10-12 minute mark
- Redis memory usage remains stable

**Validation:**
```promql
# Should see step function increase
rate(rate_limit_blocked_total[1m])
```

### Test 2: Spike Load

**Setup:**
- Users: 0 → 100 users in 10 seconds
- Duration: 5 minutes

**Expected Metrics:**
- Immediate spike in `rate_limit_blocked_total`
- Backend response time increases
- Many 429 errors in Locust

**Validation:**
```promql
# Should see sharp spike
rate(rate_limit_blocked_total[30s])
```

### Test 3: Per-Route Analysis

**Setup:**
- Configure locustfile.py to hit specific routes with different weights
- Run 25 users for 10 minutes

**Expected Metrics:**
- Can identify which routes are most rate-limited:
```promql
sum by (route) (rate_limit_blocked_total)
```

## 📈 Success Criteria

✅ **Rate Limiter Working If:**
1. Metrics increase when load exceeds configured limit
2. 429 status codes appear in Locust
3. Backend logs show "Rate limit reached" messages
4. Redis connection stable throughout test
5. Frontend still functional (CORS headers present)

❌ **Issues to Investigate If:**
1. No metrics increase even under heavy load → Rate limiter disabled or bypassed
2. All requests blocked → Configuration too strict or Redis issue
3. Metrics not updating → Prometheus scraping failed
4. Inconsistent behavior → Redis store corruption or network issues

## 🔍 Debugging

### No Metrics After Heavy Load

```cmd
# Check if rate limiter enabled
docker-compose exec backend printenv RATE_LIMIT_ENABLED

# Should output nothing or "true" (not "false")
```

### Redis Connection Issues

```cmd
# Check Redis logs
docker-compose logs redis

# Check backend can reach Redis
docker-compose exec backend ping redis
```

### Prometheus Not Scraping

```cmd
# Check Prometheus config
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml

# Should see:
#   - targets: ['backend:3000']
```

### Metrics Not Incrementing

```cmd
# Manual test - should get 429 after 100 requests in 15 min window
for ($i=1; $i -le 150; $i++) { 
  curl http://localhost:3000/books -H "Authorization: Bearer YOUR_TOKEN"
  Write-Host "Request $i"
}

# Check metrics after
curl http://localhost:3000/metrics | Select-String "rate_limit_blocked_total"
```

## 🎯 Advanced Testing

### Custom Locust Scenario for Rate Limit Testing

Create `tests/locust/rate_limit_test.py`:

```python
from locust import HttpUser, task, constant, events
import os

class RateLimitTester(HttpUser):
    wait_time = constant(0)  # No wait - spam requests
    
    @task
    def spam_endpoint(self):
        """Intentionally trigger rate limit"""
        headers = {
            'Authorization': f'Bearer {os.getenv("LOCUST_USER_TOKEN")}'
        }
        with self.client.get('/books', headers=headers, catch_response=True) as response:
            if response.status_code == 429:
                response.success()  # Treat 429 as success for this test
                print(f"✓ Rate limit triggered as expected: {response.status_code}")
            elif response.status_code == 200:
                response.success()
                print(f"✓ Request allowed: {response.status_code}")
            else:
                response.failure(f"Unexpected status: {response.status_code}")

# Run with: locust -f rate_limit_test.py --headless -u 50 -r 10 --run-time 5m
```

### Metrics Validation Script

Create `tests/locust/validate_metrics.py`:

```python
import requests
import time
import sys

def check_metrics():
    """Verify rate limit metrics are being tracked"""
    try:
        resp = requests.get('http://localhost:3000/metrics', timeout=5)
        content = resp.text
        
        # Check for rate limit metrics
        has_blocked = 'rate_limit_blocked_total' in content
        has_allowed = 'rate_limit_allowed_total' in content
        
        if has_blocked and has_allowed:
            print("✅ Rate limit metrics found")
            
            # Extract values
            for line in content.split('\n'):
                if 'rate_limit_blocked_total' in line and not line.startswith('#'):
                    print(f"  Blocked: {line}")
                if 'rate_limit_allowed_total' in line and not line.startswith('#'):
                    print(f"  Allowed: {line}")
            return True
        else:
            print("❌ Rate limit metrics missing")
            return False
            
    except Exception as e:
        print(f"❌ Error fetching metrics: {e}")
        return False

if __name__ == '__main__':
    print("Checking rate limit metrics...")
    success = check_metrics()
    sys.exit(0 if success else 1)
```

Run validation:
```cmd
python tests\locust\validate_metrics.py
```

## 📚 References

- [express-rate-limit Documentation](https://express-rate-limit.github.io/)
- [Locust Documentation](https://docs.locust.io/)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Backend Rate Limit Implementation](../../docs/BACKEND_RATE_LIMIT_IMPLEMENTATION.md)

## 🎓 Next Steps

After successful load testing:

1. **Tune Configuration**: Adjust `RATE_LIMIT_LIMIT` and `RATE_LIMIT_WINDOW_MIN` based on results
2. **Add Alerts**: Create Prometheus alerts for high block rates
3. **Implement Route-Specific Limits**: Different limits for different endpoints
4. **Add IP Whitelist**: Exclude trusted IPs from rate limiting
5. **Monitor Production**: Set up continuous monitoring in production environment

---

**Happy Load Testing! 🚀**
