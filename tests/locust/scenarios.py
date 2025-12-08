"""
Different Load Test Scenarios for Book-Sharing Platform
Usage: locust -f scenarios.py ScenarioClassName
"""

import os
import random
import time
from locust import HttpUser, task, between, constant, constant_pacing


TEST_EMAIL = os.getenv('LOCUST_USER_EMAIL', 'locust-test@example.com')
TEST_PASSWORD = os.getenv('LOCUST_USER_PASSWORD', '12345678')
BACKEND_HOST = os.getenv('LOCUST_HOST', 'http://localhost:3000')


class BaseUser(HttpUser):
    """Base user with common login logic"""
    
    def on_start(self):
        """Login before starting tasks"""
        resp = self.client.post('/auth/login', json={
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD
        })
        
        if resp.status_code == 200:
            data = resp.json()
            self.token = data.get('accessToken')
            try:
                self.client.cookies.set('accessToken', self.token)
            except Exception:
                self.client.cookies['accessToken'] = self.token
            self.auth_headers = {'Authorization': f'Bearer {self.token}'}
        else:
            print(f'Login failed: {resp.status_code}')
            self.auth_headers = {}


# ==================== SCENARIO 1: READ-HEAVY ====================
class ReadHeavyUser(BaseUser):
    \"\"\"
    Scenario: 95% reads, 5% writes
    Simulates typical user browsing books
    
    Usage:
    locust -f scenarios.py ReadHeavyUser --headless -u 100 -r 10 -t 5m
    \"\"\"
    wait_time = between(0.5, 2)
    host = BACKEND_HOST
    
    @task(50)
    def browse_books(self):
        self.client.get('/books', headers=self.auth_headers, name='Browse Books')
    
    @task(20)
    def view_book_details(self):
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            book = random.choice(r.json())
            self.client.get(f"/books/{book['_id']}", headers=self.auth_headers, 
                          name='View Book Details')
    
    @task(10)
    def search_books(self):
        q = random.choice(['python', 'javascript', 'java', 'docker'])
        self.client.get(f'/books/search?q={q}', headers=self.auth_headers,
                      name='Search Books')
    
    @task(5)
    def view_notifications(self):
        self.client.get('/notifications', headers=self.auth_headers,
                      name='View Notifications')
    
    @task(3)
    def view_borrows(self):
        self.client.get('/borrows/my', headers=self.auth_headers,
                      name='View My Borrows')
    
    @task(1)
    def create_book(self):
        self.client.post('/books', json={
            'title': f'Test Book {random.randint(1, 10000)}',
            'authors': ['Test Author']
        }, headers=self.auth_headers, name='Create Book')


# ==================== SCENARIO 2: WRITE-HEAVY ====================
class WriteHeavyUser(BaseUser):
    \"\"\"
    Scenario: 40% reads, 60% writes
    Simulates content creators and active borrowers
    
    Usage:
    locust -f scenarios.py WriteHeavyUser --headless -u 50 -r 5 -t 3m
    \"\"\"
    wait_time = between(1, 3)
    host = BACKEND_HOST
    
    @task(20)
    def create_books(self):
        titles = ['Clean Code', 'Design Patterns', 'Refactoring', 'TDD']
        self.client.post('/books', json={
            'title': f'{random.choice(titles)} {random.randint(1, 1000)}',
            'authors': ['Robert Martin'],
            'description': 'Load test book'
        }, headers=self.auth_headers, name='Create Book')
    
    @task(15)
    def update_books(self):
        r = self.client.get('/books/my', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            book = random.choice(r.json())
            self.client.patch(f"/books/{book['_id']}", json={
                'description': f'Updated {time.time()}'
            }, headers=self.auth_headers, name='Update Book')
    
    @task(15)
    def create_borrow_requests(self):
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            books = [b for b in r.json() if b.get('available')]
            if books:
                book = random.choice(books)
                self.client.post('/borrows', json={
                    'bookId': book['_id'],
                    'startDate': time.strftime('%Y-%m-%d'),
                    'endDate': time.strftime('%Y-%m-%d', 
                                           time.localtime(time.time() + 7*24*3600))
                }, headers=self.auth_headers, name='Create Borrow')
    
    @task(10)
    def approve_borrows(self):
        r = self.client.get('/borrows', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            pending = [b for b in r.json() if b.get('status') == 'pending']
            if pending:
                borrow = random.choice(pending)
                self.client.patch(f"/borrows/{borrow['_id']}/approve",
                                headers=self.auth_headers, name='Approve Borrow')
    
    @task(10)
    def browse_books(self):
        self.client.get('/books', headers=self.auth_headers, name='Browse Books')


# ==================== SCENARIO 3: CACHE STRESS TEST ====================
class CacheStressUser(BaseUser):
    \"\"\"
    Scenario: Hammer cache endpoints to test Redis performance
    Very high request rate, mostly GET /books
    
    Usage:
    locust -f scenarios.py CacheStressUser --headless -u 200 -r 20 -t 2m
    \"\"\"
    wait_time = between(0.1, 0.3)  # Very fast
    host = BACKEND_HOST
    
    @task(80)
    def get_all_books(self):
        # Should hit Redis cache
        self.client.get('/books', headers=self.auth_headers, name='[Cache] List Books')
    
    @task(15)
    def get_book_by_id(self):
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            book = random.choice(r.json())
            self.client.get(f"/books/{book['_id']}", headers=self.auth_headers,
                          name='[Cache] Get Book By ID')
    
    @task(5)
    def search_books(self):
        q = random.choice(['test', 'book', 'code'])
        self.client.get(f'/books/search?q={q}', headers=self.auth_headers,
                      name='[Cache] Search')


# ==================== SCENARIO 4: SPIKE TEST ====================
class SpikeUser(BaseUser):
    \"\"\"
    Scenario: Sudden traffic spike
    Use with: --spawn-rate 50 to create instant load
    
    Usage:
    locust -f scenarios.py SpikeUser --headless -u 500 -r 50 -t 1m
    \"\"\"
    wait_time = constant(1)  # Constant rate
    host = BACKEND_HOST
    
    @task
    def mixed_requests(self):
        endpoints = [
            ('GET', '/books', 'List Books'),
            ('GET', '/borrows', 'List Borrows'),
            ('GET', '/notifications', 'List Notifications'),
            ('GET', '/health', 'Health Check')
        ]
        
        method, path, name = random.choice(endpoints)
        if method == 'GET':
            self.client.get(path, headers=self.auth_headers, name=name)


# ==================== SCENARIO 5: SOAK TEST (ENDURANCE) ====================
class SoakTestUser(BaseUser):
    \"\"\"
    Scenario: Long-running stability test
    Moderate load for extended period
    
    Usage:
    locust -f scenarios.py SoakTestUser --headless -u 50 -r 5 -t 30m
    \"\"\"
    wait_time = between(2, 5)  # Slower, more realistic
    host = BACKEND_HOST
    
    @task(30)
    def browse_books(self):
        self.client.get('/books', headers=self.auth_headers, name='Browse')
    
    @task(10)
    def view_details(self):
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            book = random.choice(r.json())
            self.client.get(f"/books/{book['_id']}", headers=self.auth_headers,
                          name='Details')
            time.sleep(random.uniform(1, 3))  # Read time
    
    @task(5)
    def check_notifications(self):
        self.client.get('/notifications', headers=self.auth_headers,
                      name='Notifications')
    
    @task(3)
    def view_borrows(self):
        self.client.get('/borrows/my', headers=self.auth_headers,
                      name='My Borrows')
    
    @task(2)
    def create_borrow(self):
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200 and r.json():
            books = [b for b in r.json() if b.get('available')]
            if books:
                book = random.choice(books)
                self.client.post('/borrows', json={
                    'bookId': book['_id'],
                    'startDate': time.strftime('%Y-%m-%d'),
                    'endDate': time.strftime('%Y-%m-%d',
                                           time.localtime(time.time() + 14*24*3600))
                }, headers=self.auth_headers, name='Borrow Book')


# ==================== SCENARIO 6: API HEALTH MONITOR ====================
class HealthMonitorUser(BaseUser):
    \"\"\"
    Scenario: Continuous health monitoring
    Checks all critical endpoints at constant rate
    
    Usage:
    locust -f scenarios.py HealthMonitorUser --headless -u 5 -r 1 -t 60m
    \"\"\"
    wait_time = constant_pacing(10)  # Every 10 seconds
    host = BACKEND_HOST
    
    @task
    def check_health(self):
        self.client.get('/health', name='[Monitor] Health')
    
    @task
    def check_books_api(self):
        self.client.get('/books', headers=self.auth_headers, 
                      name='[Monitor] Books API')
    
    @task
    def check_borrows_api(self):
        self.client.get('/borrows', headers=self.auth_headers,
                      name='[Monitor] Borrows API')
    
    @task
    def check_notifications_api(self):
        self.client.get('/notifications', headers=self.auth_headers,
                      name='[Monitor] Notifications API')


# ==================== SCENARIO 7: STRESS TEST ====================
class StressTestUser(BaseUser):
    \"\"\"
    Scenario: Push system to limits
    Gradually increase until system breaks
    
    Usage:
    locust -f scenarios.py StressTestUser --headless -u 1000 -r 10 -t 10m
    \"\"\"
    wait_time = between(0.1, 0.5)
    host = BACKEND_HOST
    
    @task(10)
    def rapid_fire_reads(self):
        self.client.get('/books', headers=self.auth_headers, name='Rapid Read')
    
    @task(5)
    def concurrent_writes(self):
        self.client.post('/books', json={
            'title': f'Stress Test {time.time()}',
            'authors': ['Load Test']
        }, headers=self.auth_headers, name='Concurrent Write')
    
    @task(3)
    def search_load(self):
        q = random.choice(['a', 'b', 'c', 'd', 'e'])
        self.client.get(f'/books/search?q={q}', headers=self.auth_headers,
                      name='Search Load')


# ==================== SCENARIO 8: REALISTIC USER JOURNEY ====================
class RealisticUserJourney(BaseUser):
    \"\"\"
    Scenario: Simulates real user behavior with pauses
    
    Usage:
    locust -f scenarios.py RealisticUserJourney --headless -u 100 -r 5 -t 10m
    \"\"\"
    wait_time = between(3, 10)  # Think time
    host = BACKEND_HOST
    
    @task
    def complete_user_journey(self):
        # 1. Browse books
        r = self.client.get('/books', headers=self.auth_headers, 
                          name='1. Browse Books')
        time.sleep(random.uniform(2, 5))  # Reading time
        
        if r.status_code == 200 and r.json():
            # 2. View book details
            book = random.choice(r.json())
            self.client.get(f"/books/{book['_id']}", headers=self.auth_headers,
                          name='2. View Details')
            time.sleep(random.uniform(5, 10))  # Reading description
            
            # 3. Maybe borrow (30% chance)
            if random.random() < 0.3 and book.get('available'):
                self.client.post('/borrows', json={
                    'bookId': book['_id'],
                    'startDate': time.strftime('%Y-%m-%d'),
                    'endDate': time.strftime('%Y-%m-%d',
                                           time.localtime(time.time() + 7*24*3600))
                }, headers=self.auth_headers, name='3. Borrow Book')
                time.sleep(random.uniform(1, 2))
            
            # 4. Check notifications (50% chance)
            if random.random() < 0.5:
                self.client.get('/notifications', headers=self.auth_headers,
                              name='4. Check Notifications')
                time.sleep(random.uniform(1, 3))
            
            # 5. View my borrows (20% chance)
            if random.random() < 0.2:
                self.client.get('/borrows/my', headers=self.auth_headers,
                              name='5. My Borrows')


if __name__ == '__main__':
    print(\"\"\"
     Available Test Scenarios:
    
    1. ReadHeavyUser       - 95% reads, typical browsing
    2. WriteHeavyUser      - 60% writes, content creation
    3. CacheStressUser     - Hammer Redis cache
    4. SpikeUser           - Sudden traffic spike
    5. SoakTestUser        - Long-running stability test
    6. HealthMonitorUser   - Continuous health checks
    7. StressTestUser      - Push to breaking point
    8. RealisticUserJourney - Real user behavior
    
    Usage: locust -f scenarios.py <ScenarioName>
    \"\"\")
