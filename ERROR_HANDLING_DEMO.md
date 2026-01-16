# 🛡️ ERROR HANDLING DEMONSTRATION

## Mục đích
Chứng minh hệ thống xử lý lỗi mượt mà với các HTTP status codes chuẩn.

---

## 📋 Test Cases cho Demo

### 1. 404 Not Found - Resource không tồn tại

**Scenario:** Truy cập khóa học không tồn tại

```bash
# Request
curl -X GET http://localhost:8080/api/courses/99999 \
  -H "Authorization: Bearer {token}"

# Response: 404 Not Found
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Khóa học với ID 99999 không tồn tại",
  "path": "/api/courses/99999"
}
```

**Demo trên UI:**
1. Vào URL: http://localhost:5173/courses/99999
2. Hệ thống hiển thị: "Khóa học không tồn tại"
3. Redirect về trang danh sách sau 3s

---

### 2. 401 Unauthorized - Chưa đăng nhập

**Scenario:** Truy cập API mà không có token

```bash
# Request (không có Authorization header)
curl -X GET http://localhost:8080/api/courses

# Response: 401 Unauthorized
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Vui lòng đăng nhập để tiếp tục",
  "path": "/api/courses"
}
```

**Demo trên UI:**
1. Logout khỏi hệ thống
2. Thử truy cập /courses
3. Hệ thống redirect về /login
4. Toast message: "Vui lòng đăng nhập"

---

### 3. 401 Unauthorized - Token hết hạn

**Scenario:** Token JWT đã hết hạn

```bash
# Request với token cũ
curl -X GET http://localhost:8080/api/courses \
  -H "Authorization: Bearer expired_token"

# Response: 401 Unauthorized
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Token đã hết hạn, vui lòng đăng nhập lại",
  "path": "/api/courses"
}
```

**Demo trên UI:**
1. Đợi token hết hạn (hoặc dùng token cũ)
2. Thử gọi API
3. Hệ thống tự động logout
4. Redirect về login page

---

### 4. 403 Forbidden - Không có quyền

**Scenario:** Student cố xóa khóa học của Teacher

```bash
# Request (student token)
curl -X DELETE http://localhost:8080/api/courses/1 \
  -H "Authorization: Bearer student_token"

# Response: 403 Forbidden
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Bạn không có quyền xóa khóa học này",
  "path": "/api/courses/1"
}
```

**Demo trên UI:**
1. Login với tài khoản student
2. Vào khóa học của teacher khác
3. Nút "Xóa" bị ẩn hoặc disabled
4. Nếu gọi API trực tiếp → Toast error: "Không có quyền"

---

### 5. 400 Bad Request - Validation Error

**Scenario:** Tạo khóa học với dữ liệu không hợp lệ

```bash
# Request (thiếu title)
curl -X POST http://localhost:8080/api/courses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "courseDescription": "Mô tả khóa học"
  }'

# Response: 400 Bad Request
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "courseTitle",
      "message": "Tiêu đề khóa học không được để trống"
    }
  ],
  "path": "/api/courses"
}
```

**Demo trên UI:**
1. Vào form tạo khóa học
2. Bỏ trống trường "Tiêu đề"
3. Click "Tạo khóa học"
4. Hiển thị lỗi validation màu đỏ dưới input
5. Form không submit

---

### 6. 400 Bad Request - Email không hợp lệ

**Scenario:** Đăng ký với email sai format

```bash
# Request
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student01",
    "email": "invalid-email",
    "password": "password123"
  }'

# Response: 400 Bad Request
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email không hợp lệ",
  "path": "/api/auth/register"
}
```

**Demo trên UI:**
1. Vào trang đăng ký
2. Nhập email: "abc@"
3. Hiển thị lỗi real-time: "Email không hợp lệ"

---

### 7. 409 Conflict - Username đã tồn tại

**Scenario:** Đăng ký với username đã có

```bash
# Request
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student01",
    "email": "new@example.com",
    "password": "password123"
  }'

# Response: 409 Conflict
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Username 'student01' đã tồn tại",
  "path": "/api/auth/register"
}
```

---

### 8. 500 Internal Server Error - Database lỗi

**Scenario:** Database connection failed

```bash
# Request (khi MySQL down)
curl -X GET http://localhost:8080/api/courses \
  -H "Authorization: Bearer {token}"

# Response: 500 Internal Server Error
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Đã xảy ra lỗi, vui lòng thử lại sau",
  "path": "/api/courses"
}
```

**Demo:**
1. Stop MySQL container: `docker-compose stop mysql`
2. Thử truy cập /courses
3. Hiển thị error page: "Hệ thống đang bảo trì"
4. Start lại MySQL: `docker-compose start mysql`

---

### 9. 429 Too Many Requests - Rate Limit

**Scenario:** Gọi API quá nhiều lần

```bash
# Request (lần thứ 101 trong 1 phút)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 429 Too Many Requests
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Bạn đã vượt quá giới hạn 20 requests/phút",
  "retryAfter": 45
}
```

**Demo trên UI:**
1. Spam nút "Gửi" trong chat
2. Sau 20 lần → Hiển thị: "Vui lòng đợi 45 giây"
3. Disable nút "Gửi" tạm thời

---

### 10. 503 Service Unavailable - AI Service Down

**Scenario:** FastAPI service không khả dụng

```bash
# Request (khi FastAPI down)
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 503 Service Unavailable
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 503,
  "error": "Service Unavailable",
  "message": "AI service tạm thời không khả dụng",
  "path": "/api/chat"
}
```

---

## 🎯 Kịch bản Demo trong Thuyết trình

### Phần 1: Validation Errors (2 phút)
1. Mở form tạo khóa học
2. Bỏ trống các trường bắt buộc
3. Click "Tạo" → Show validation errors
4. Nhập đúng → Tạo thành công

### Phần 2: Authentication Errors (2 phút)
1. Logout
2. Thử truy cập /courses → Redirect to login
3. Login sai password → 401 error
4. Login đúng → Vào được

### Phần 3: Authorization Errors (1 phút)
1. Login student
2. Thử xóa khóa học của teacher → 403 Forbidden
3. Toast: "Không có quyền"

### Phần 4: Not Found Errors (1 phút)
1. Truy cập /courses/99999
2. Show "Khóa học không tồn tại"
3. Auto redirect về danh sách

### Phần 5: Server Errors (1 phút)
1. Show code xử lý try-catch
2. Giải thích: Mọi lỗi đều được catch và return JSON chuẩn
3. Log lỗi để debug

---

## 💻 Code Implementation

### Spring Boot - Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
        ResourceNotFoundException ex, 
        HttpServletRequest request
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(404)
            .error("Not Found")
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .build();
        return ResponseEntity.status(404).body(error);
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(
        UnauthorizedException ex,
        HttpServletRequest request
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(401)
            .error("Unauthorized")
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .build();
        return ResponseEntity.status(401).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
        Exception ex,
        HttpServletRequest request
    ) {
        // Log lỗi để debug
        log.error("Unexpected error", ex);
        
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(500)
            .error("Internal Server Error")
            .message("Đã xảy ra lỗi, vui lòng thử lại sau")
            .path(request.getRequestURI())
            .build();
        return ResponseEntity.status(500).body(error);
    }
}
```

### React - Error Handling

```typescript
// API interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    switch (status) {
      case 401:
        // Logout và redirect
        authStore.logout();
        navigate('/login');
        toast.error(message || 'Vui lòng đăng nhập');
        break;
      case 403:
        toast.error(message || 'Không có quyền truy cập');
        break;
      case 404:
        toast.error(message || 'Không tìm thấy');
        break;
      case 500:
        toast.error('Lỗi hệ thống, vui lòng thử lại');
        break;
      default:
        toast.error(message || 'Đã xảy ra lỗi');
    }
    
    return Promise.reject(error);
  }
);
```

---

## ✅ Checklist Demo Error Handling

- [ ] Chuẩn bị 3-4 test cases chính
- [ ] Test trước khi demo
- [ ] Giải thích code xử lý lỗi
- [ ] Show logs khi có lỗi
- [ ] Nhấn mạnh: "Mọi lỗi đều được xử lý mượt mà"
