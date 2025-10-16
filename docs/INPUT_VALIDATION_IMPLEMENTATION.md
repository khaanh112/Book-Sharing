# Báo Cáo: Triển Khai Input Validation với Joi

**Ngày thực hiện:** 17/10/2025  
**Người thực hiện:** Backend Development Team  
**Phiên bản:** 1.0.0

---

##  Tổng Quan

Dự án Book-Sharing đã được nâng cấp với hệ thống xác thực đầu vào (input validation) toàn diện sử dụng thư viện **Joi** - một giải pháp validation mạnh mẽ và phổ biến trong hệ sinh thái Node.js/Express.

### Mục tiêu

-  Ngăn chặn dữ liệu không hợp lệ từ phía client
-  Tăng cường bảo mật API (chống injection, XSS, data tampering)
-  Cải thiện trải nghiệm người dùng với thông báo lỗi rõ ràng
-  Giảm tải cho database và business logic
-  Chuẩn hóa cấu trúc dữ liệu đầu vào

---

##  Công Nghệ Sử Dụng

| Thư viện | Phiên bản | Mục đích |
|----------|-----------|----------|
| **Joi** | ^18.0.1 | Schema validation cho request body/params/query |
| **Express** | ^5.1.0 | Web framework |

---

##  Kiến Trúc Triển Khai

### 1. Middleware Validation (Core)

**File:** `backend/middlewares/validateRequest.js`

Middleware generic có thể tái sử dụng với các tính năng:
- Hỗ trợ validate đồng thời body, params, query
- Tự động sanitize và strip unknown fields
- Trả về chi tiết lỗi đầy đủ (không dừng ở lỗi đầu tiên)
- Error response chuẩn hóa

**Options:**
- `abortEarly: false` - Thu thập tất cả lỗi
- `allowUnknown: true` - Cho phép field không khai báo
- `stripUnknown: true` - Loại bỏ field thừa

---

##  Validation Schemas Overview

Schemas được tổ chức theo domain trong folder `backend/validators/`:

###  `validators/auth.js` - Authentication

**Áp dụng cho:**
- `POST /auth/register` - Đăng ký (name: 2-100 chars, email hợp lệ, password: 6-128 chars)
- `POST /auth/login` - Đăng nhập
- `GET /auth/verify-email` - Xác thực email (query: token + user)

---

###  `validators/book.js` - Book Management

**Schemas:**
- `idParam` - MongoDB ObjectId (24 ký tự hex)
- `listQuery` - Filters: q, authors, category, available
- `searchQuery` - Tìm kiếm Google Books (q required)
- `createBody` - Tạo sách (title, authors required; description max 2000 chars)
- `updateBody` - Cập nhật sách

**Áp dụng cho:**
- `GET /books` - Danh sách với filters
- `GET /books/search` - Tìm kiếm
- `GET/POST/PUT/DELETE /books/:id` - CRUD operations

---

###  `validators/borrow.js` - Borrow Management

**Validation:**
- `bookId` - MongoDB ObjectId
- `dueDate` - Số ngày mượn (1-365 ngày)

**Áp dụng cho:**
- `POST /borrows` - Tạo yêu cầu
- `PUT /borrows/:id/accept|return|reject` - Actions
- `GET/DELETE /borrows/:id` - Chi tiết/Xóa

---

###  `validators/user.js` - User Management

**Schemas:**
- `changePasswordBody` - oldPassword + newPassword (6-128 chars, newPassword  oldPassword)
- `updateBody` - name (2-100 chars)

**Áp dụng cho:**
- `PUT /users/change-password`
- `PUT /users/update-user`

---

###  `validators/notification.js` - Notifications

**Validation:**
- `idParam` - MongoDB ObjectId
- `listQuery` - unreadOnly filter

**Áp dụng cho:**
- `GET /notifications` - Danh sách
- `PUT /notifications/:id/read` - Đánh dấu đã đọc
- `DELETE /notifications/:id` - Xóa

---

##  Coverage Summary

| Module | Endpoints | Body | Params | Query |
|--------|-----------|------|--------|-------|
| **Auth** | 3/3 (100%) |  | - |  |
| **Books** | 6/7 (86%) |  |  |  |
| **Borrows** | 6/10 (60%) |  |  | - |
| **Users** | 2/2 (100%) |  | - | - |
| **Notifications** | 3/6 (50%) | - |  |  |
| **TỔNG** | **20/28 (71%)** |  |  |  |

*Các endpoint không cần validation: refresh-token, current-user, logout, mark-all-read, etc.*

---

##  Tính Năng Bảo Mật

### 1. Chống Injection
- Regex validation cho MongoDB ObjectId (`/^[0-9a-fA-F]{24}$/`)
- Email validation theo chuẩn RFC
- String length limits

### 2. Data Sanitization
- `.trim()` - Loại bỏ khoảng trắng
- `.lowercase()` - Chuẩn hóa email
- `stripUnknown` - Loại bỏ fields thừa

### 3. Business Logic Validation
- Password length (6-128 chars)
- dueDate range (1-365 days)
- newPassword  oldPassword
- Description max 2000 chars

---

##  Error Response Format

Khi validation thất bại, API trả về:

```json
{
  "status": "error",
  "message": "Validation error",
  "details": [
    {
      "message": "\"email\" must be a valid email",
      "path": ["email"],
      "type": "string.email"
    }
  ]
}
```

**HTTP Status:** `400 Bad Request`

---

##  Cách Sử Dụng

### Ví dụ áp dụng trong route:

```javascript
import validateRequest from '../middlewares/validateRequest.js';
import { registerBody } from '../validators/auth.js';

router.post('/register', 
  validateRequest({ body: registerBody }), 
  registerUser
);

// Validate nhiều targets cùng lúc
router.put('/:id', 
  validateRequest({ params: idParam, body: updateBody }), 
  updateBook
);
```

---

##  Lợi Ích Đạt Được

### 1. Performance
-  Reject invalid requests sớm (trước khi hit database)
-  Giảm tải cho business logic layer
-  Cache validation schemas (compiled 1 lần)

### 2. Developer Experience
-  Schemas rõ ràng, dễ maintain
-  Tách biệt validation logic khỏi controller
-  Reusable middleware pattern
-  Error messages chi tiết giúp debug nhanh

### 3. Security
-  Ngăn chặn malformed data
-  Prevent NoSQL injection
-  Type safety tại runtime
-  Giảm attack surface

### 4. User Experience
-  Thông báo lỗi chi tiết, dễ hiểu
-  Validate tất cả fields cùng lúc (không dừng ở lỗi đầu tiên)
-  Response format nhất quán

---

##  Testing Examples

###  Valid Request
```bash
POST /auth/register
{
  "name": "Nguyễn Văn A",
  "email": "test@example.com",
  "password": "123456"
}
# 200 OK
```

###  Invalid Request
```bash
POST /auth/register
{
  "name": "A",  # Too short
  "email": "invalid"
}
# 400 Bad Request
# Details: name min 2 chars, email invalid, password required
```

---

##  Implementation Checklist

- [x] Cài đặt Joi package (^18.0.1)
- [x] Tạo generic validation middleware
- [x] Định nghĩa schemas cho Auth module
- [x] Định nghĩa schemas cho Book module
- [x] Định nghĩa schemas cho Borrow module
- [x] Định nghĩa schemas cho User module
- [x] Định nghĩa schemas cho Notification module
- [x] Tích hợp middleware vào routes
- [x] Test các trường hợp valid/invalid
- [ ] Thêm unit tests cho validators (tùy chọn)
- [ ] Quốc tế hóa error messages VN/EN (tùy chọn)

---

##  Các Bước Cải Tiến Tiếp Theo

### 1. Custom Error Messages (VN/EN)
```javascript
Joi.string().min(6).max(128).messages({
  'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
  'string.max': 'Mật khẩu không được vượt quá {#limit} ký tự',
})
```

### 2. Helper Functions
```javascript
// validators/helpers.js
export const objectId = () => 
  Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId');

export const paginationQuery = () => Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
```

### 3. Integration Tests
```javascript
// __tests__/auth.test.js
describe('POST /auth/register', () => {
  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test', email: 'invalid', password: '123456' });
    
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});
```

---

##  Tài Liệu Tham Khảo

- [Joi Documentation](https://joi.dev/api/)
- [Express Middleware Best Practices](https://expressjs.com/en/guide/using-middleware.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

##  Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 17/10/2025 | Initial implementation với Joi cho 20/28 endpoints |

---

##  Kết Luận

Hệ thống input validation với Joi đã được triển khai thành công, bao phủ 71% (20/28) endpoints quan trọng của API. Giải pháp này mang lại nhiều lợi ích về bảo mật, performance và developer experience.

**Files đã tạo/chỉnh sửa:**
- `backend/middlewares/validateRequest.js` - Core middleware
- `backend/validators/auth.js` - Auth schemas
- `backend/validators/book.js` - Book schemas  
- `backend/validators/borrow.js` - Borrow schemas
- `backend/validators/user.js` - User schemas
- `backend/validators/notification.js` - Notification schemas
- Tất cả route files đã được cập nhật

---

**Tài liệu này được tạo để báo cáo công việc triển khai Input Validation.**  
**Liên hệ:** Backend Development Team
