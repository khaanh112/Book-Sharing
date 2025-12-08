import os
import random
import time
from locust import HttpUser, task, between, SequentialTaskSet, events


TEST_EMAIL = os.getenv('LOCUST_USER_EMAIL')
TEST_PASSWORD = os.getenv('LOCUST_USER_PASSWORD')
BACKEND_HOST = os.getenv('LOCUST_HOST') or os.getenv('BACKEND_HOST') or 'http://localhost:3000'

# Store created resources for cleanup
created_books = []
created_borrows = []

# Metrics tracking
cache_hits = 0
cache_misses = 0


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Reset metrics when test starts"""
    global cache_hits, cache_misses, created_books, created_borrows
    cache_hits = 0
    cache_misses = 0
    created_books = []
    created_borrows = []
    print("🚀 Load test started")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Print summary when test stops"""
    total = cache_hits + cache_misses
    hit_rate = (cache_hits / total * 100) if total > 0 else 0
    print(f"\n📊 Test Summary:")
    print(f"  Cache Hits: {cache_hits}")
    print(f"  Cache Misses: {cache_misses}")
    print(f"  Hit Rate: {hit_rate:.2f}%")
    print(f"  Books Created: {len(created_books)}")
    print(f"  Borrows Created: {len(created_borrows)}")


class UserBehavior(SequentialTaskSet):
    """Comprehensive user behavior simulation"""
    
    def on_start(self):
        """Login and setup"""
        if not TEST_EMAIL or not TEST_PASSWORD:
            print('❌ LOCUST_USER_EMAIL and LOCUST_USER_PASSWORD must be set')
            return
        
        # Randomized delay to avoid thundering herd
        time.sleep(random.uniform(0, 2))

        # Check existing cookie
        existing = self.client.cookies.get('accessToken')
        if existing:
            self.token = existing
            self.auth_headers = {}
            return
        
        # Login with retry
        resp = self.client.post('/auth/login', json={
            'email': TEST_EMAIL, 
            'password': TEST_PASSWORD
        }, name="[Auth] Login")
        
        attempts = 0
        while attempts < 3:
            attempts += 1
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get('accessToken')
                if self.token:
                    try:
                        self.client.cookies.set('accessToken', self.token)
                    except Exception:
                        self.client.cookies['accessToken'] = self.token
                    self.auth_headers = {'Authorization': f'Bearer {self.token}'}
                print(f"✅ User logged in successfully")
                break
            elif resp.status_code == 429:
                try:
                    body = resp.json()
                    retry = int(body.get('retryAfter', 1))
                except Exception:
                    retry = 1
                time.sleep(retry)
                resp = self.client.post('/auth/login', json={
                    'email': TEST_EMAIL,
                    'password': TEST_PASSWORD
                }, name="[Auth] Login Retry")
                continue
            else:
                print(f'❌ Login failed: {resp.status_code}')
                self.token = None
                self.auth_headers = {}
                break

        time.sleep(0.5)

    # ==================== BOOKS ENDPOINTS ====================
    
    @task(10)
    def list_books(self):
        """Test: Get all books (Redis cache)"""
        with self.client.get('/books', headers=self.auth_headers, 
                           catch_response=True, name="[Books] List All") as resp:
            if resp.status_code == 200:
                books = resp.json()
                # Track cache performance
                if resp.elapsed.total_seconds() < 0.05:  # <50ms = likely cached
                    global cache_hits
                    cache_hits += 1
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(5)
    def view_book_by_id(self):
        """Test: Get book by ID (Redis cache)"""
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200:
            books = r.json() or []
            if books:
                book = random.choice(books)
                with self.client.get(f"/books/{book.get('_id')}", 
                                   headers=self.auth_headers,
                                   catch_response=True,
                                   name="[Books] Get By ID") as resp:
                    if resp.status_code == 200:
                        resp.success()
                    else:
                        resp.failure(f"Failed: {resp.status_code}")

    @task(3)
    def search_books(self):
        """Test: Search books via Google Books API"""
        queries = ['javascript', 'node', 'react', 'python', 'docker', 'clean code', 'design patterns']
        q = random.choice(queries)
        with self.client.get(f'/books/search?q={q}', 
                           headers=self.auth_headers,
                           catch_response=True,
                           name="[Books] Search") as resp:
            if resp.status_code == 200:
                results = resp.json()
                resp.success()
            else:
                resp.failure(f"Search failed: {resp.status_code}")

    @task(2)
    def get_my_books(self):
        """Test: Get user's own books"""
        with self.client.get('/books/my', 
                           headers=self.auth_headers,
                           catch_response=True,
                           name="[Books] My Books") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(1)
    def create_book(self):
        """Test: Create new book (MongoDB write)"""
        book_titles = [
            'The Pragmatic Programmer',
            'Clean Code',
            'Design Patterns',
            'Refactoring',
            'Domain-Driven Design',
            'Building Microservices',
            'Site Reliability Engineering',
            'The Phoenix Project'
        ]
        
        payload = {
            'title': random.choice(book_titles) + f' {random.randint(1, 1000)}',
            'authors': ['Test Author'],
            'description': 'Load test book',
            'categories': ['Programming', 'Software Engineering']
        }
        
        with self.client.post('/books', 
                            json=payload,
                            headers=self.auth_headers,
                            catch_response=True,
                            name="[Books] Create") as resp:
            if resp.status_code == 201:
                book = resp.json()
                created_books.append(book['_id'])
                resp.success()
            else:
                resp.failure(f"Create failed: {resp.status_code}")

    @task(1)
    def update_book(self):
        """Test: Update book (MongoDB write + Redis sync)"""
        if not created_books:
            return
        
        book_id = random.choice(created_books)
        payload = {
            'description': f'Updated at {time.time()}'
        }
        
        with self.client.patch(f'/books/{book_id}',
                             json=payload,
                             headers=self.auth_headers,
                             catch_response=True,
                             name="[Books] Update") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Update failed: {resp.status_code}")

    # ==================== BORROW ENDPOINTS ====================
    
    @task(3)
    def list_borrows(self):
        """Test: Get all borrows"""
        with self.client.get('/borrows', 
                           headers=self.auth_headers,
                           catch_response=True,
                           name="[Borrows] List All") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(2)
    def get_my_borrows(self):
        """Test: Get user's borrows"""
        with self.client.get('/borrows/my', 
                           headers=self.auth_headers,
                           catch_response=True,
                           name="[Borrows] My Borrows") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(1)
    def create_borrow_request(self):
        """Test: Create borrow request"""
        # Get available books
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200:
            books = r.json() or []
            available_books = [b for b in books if b.get('available')]
            
            if available_books:
                book = random.choice(available_books)
                payload = {
                    'bookId': book['_id'],
                    'startDate': time.strftime('%Y-%m-%d'),
                    'endDate': time.strftime('%Y-%m-%d', time.localtime(time.time() + 7*24*3600))
                }
                
                with self.client.post('/borrows',
                                    json=payload,
                                    headers=self.auth_headers,
                                    catch_response=True,
                                    name="[Borrows] Create Request") as resp:
                    if resp.status_code == 201:
                        borrow = resp.json()
                        created_borrows.append(borrow['_id'])
                        resp.success()
                    elif resp.status_code == 400:
                        # Expected if book not available
                        resp.success()
                    else:
                        resp.failure(f"Failed: {resp.status_code}")

    @task(1)
    def approve_borrow(self):
        """Test: Approve borrow request (owner action)"""
        if not created_borrows:
            return
        
        borrow_id = random.choice(created_borrows)
        
        with self.client.patch(f'/borrows/{borrow_id}/approve',
                             headers=self.auth_headers,
                             catch_response=True,
                             name="[Borrows] Approve") as resp:
            if resp.status_code in [200, 403, 404]:
                # 403 = not owner, 404 = not found, both OK in load test
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(1)
    def return_book(self):
        """Test: Return borrowed book"""
        if not created_borrows:
            return
        
        borrow_id = random.choice(created_borrows)
        
        with self.client.patch(f'/borrows/{borrow_id}/return',
                             headers=self.auth_headers,
                             catch_response=True,
                             name="[Borrows] Return") as resp:
            if resp.status_code in [200, 400, 404]:
                # 400 = not approved yet, 404 = not found, both OK
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    # ==================== NOTIFICATION ENDPOINTS ====================
    
    @task(4)
    def list_notifications(self):
        """Test: Get notifications"""
        with self.client.get('/notifications', 
                           headers=self.auth_headers,
                           catch_response=True,
                           name="[Notifications] List") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(2)
    def mark_notification_read(self):
        """Test: Mark notification as read"""
        # Get notifications first
        r = self.client.get('/notifications', headers=self.auth_headers)
        if r.status_code == 200:
            notifs = r.json() or []
            unread = [n for n in notifs if not n.get('isRead')]
            
            if unread:
                notif = random.choice(unread)
                with self.client.patch(f"/notifications/{notif['_id']}/read",
                                     headers=self.auth_headers,
                                     catch_response=True,
                                     name="[Notifications] Mark Read") as resp:
                    if resp.status_code == 200:
                        resp.success()
                    else:
                        resp.failure(f"Failed: {resp.status_code}")

    @task(1)
    def delete_notification(self):
        """Test: Delete notification"""
        r = self.client.get('/notifications', headers=self.auth_headers)
        if r.status_code == 200:
            notifs = r.json() or []
            
            if notifs:
                notif = random.choice(notifs)
                with self.client.delete(f"/notifications/{notif['_id']}",
                                      headers=self.auth_headers,
                                      catch_response=True,
                                      name="[Notifications] Delete") as resp:
                    if resp.status_code == 200:
                        resp.success()
                    else:
                        resp.failure(f"Failed: {resp.status_code}")

    # ==================== USER ENDPOINTS ====================
    
    @task(2)
    def get_profile(self):
        """Test: Get user profile"""
        with self.client.get('/users/profile', 
                           headers=self.auth_headers,
                           catch_response=True,
                           name="[Users] Get Profile") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    @task(1)
    def update_profile(self):
        """Test: Update user profile"""
        payload = {
            'name': f'Test User {random.randint(1, 1000)}'
        }
        
        with self.client.patch('/users/profile',
                             json=payload,
                             headers=self.auth_headers,
                             catch_response=True,
                             name="[Users] Update Profile") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Failed: {resp.status_code}")

    # ==================== HEALTH & METRICS ====================
    
    @task(1)
    def health_check(self):
        """Test: Health check endpoint"""
        with self.client.get('/health',
                           catch_response=True,
                           name="[System] Health Check") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Health check failed: {resp.status_code}")


class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(0.1, 0.5)  # Faster requests to stress test cache
    host = BACKEND_HOST
