import os
import random
import time
from locust import HttpUser, task, between, SequentialTaskSet


TEST_EMAIL = os.getenv('LOCUST_USER_EMAIL')
TEST_PASSWORD = os.getenv('LOCUST_USER_PASSWORD')
BACKEND_HOST = os.getenv('LOCUST_HOST') or os.getenv('BACKEND_HOST') or 'http://localhost:3000'


class UserBehavior(SequentialTaskSet):
    def on_start(self):
        # login once per simulated user
        if not TEST_EMAIL or not TEST_PASSWORD:
            print('LOCUST_USER_EMAIL and LOCUST_USER_PASSWORD must be set in environment')
            return
        # small randomized delay to avoid thundering herd on auth endpoint
        time.sleep(random.uniform(0, 2))

        # if cookie already present in session, reuse it (avoid hitting login endpoint repeatedly)
        existing = self.client.cookies.get('accessToken')
        if existing:
            self.token = existing
            self.auth_headers = {}
            return
        resp = self.client.post('/auth/login', json={'email': TEST_EMAIL, 'password': TEST_PASSWORD})
        # Retry logic for login to respect rate limiting
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
                    # also set Authorization header as a fallback (some test clients may not send secure cookies)
                    self.auth_headers = {'Authorization': f'Bearer {self.token}'}
                break
            elif resp.status_code == 429:
                try:
                    body = resp.json()
                    retry = int(body.get('retryAfter', 1))
                except Exception:
                    retry = 1
                time.sleep(retry)
                resp = self.client.post('/auth/login', json={'email': TEST_EMAIL, 'password': TEST_PASSWORD})
                continue
            else:
                print('Login failed for locust user', resp.status_code, getattr(resp, 'text', ''))
                self.token = None
                self.auth_headers = {}
                break

        # small warmup
        time.sleep(0.5)

    @task(10)
    def list_books(self):
        # FOCUS: Test cache heavily on this endpoint
        self.client.get('/books', headers=self.auth_headers)

    @task(1)
    def view_random_book(self):
        r = self.client.get('/books', headers=self.auth_headers)
        if r.status_code == 200:
            books = r.json() or []
            if books:
                book = random.choice(books)
                self.client.get(f"/books/{book.get('_id')}", headers=self.auth_headers)

    @task(1)
    def search_books(self):
        q = random.choice(['javascript', 'node', 'react', 'python', 'docker'])
        self.client.get(f'/books/search?q={q}', headers=self.auth_headers)


class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(0.1, 0.5)  # Faster requests to stress test cache
    host = BACKEND_HOST
