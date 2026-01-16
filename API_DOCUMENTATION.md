# 📚 API DOCUMENTATION - AGENT FOR EDU

## Tổng quan
- **Tổng số API:** 40+ endpoints
- **Base URL Spring Boot:** http://localhost:8080
- **Base URL FastAPI:** http://localhost:8000
- **Authentication:** JWT Bearer Token
- **Response Format:** JSON

---

## 🔐 Authentication APIs (Spring Boot)

### 1. Đăng ký tài khoản
```http
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "username": "student01",
  "email": "student01@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "role": "STUDENT"
}

Response: 201 Created
{
  "id": 1,
  "username": "student01",
  "email": "student01@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "STUDENT",
  "createdAt": "2025-01-17T10:00:00"
}

Error Responses:
- 400 Bad Request: Username đã tồn tại
- 400 Bad Request: Email không hợp lệ
```

### 2. Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "username": "student01",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "student01",
  "email": "student01@example.com",
  "role": "STUDENT"
}

Error Responses:
- 401 Unauthorized: Sai username hoặc password
- 400 Bad Request: Thiếu thông tin đăng nhập
```

### 3. Xem profile
```http
GET /api/auth/profile
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "username": "student01",
  "email": "student01@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "STUDENT",
  "createdAt": "2025-01-17T10:00:00"
}

Error Responses:
- 401 Unauthorized: Token không hợp lệ hoặc hết hạn
```

---

## 📚 Course APIs (Spring Boot)

### 4. Lấy danh sách khóa học
```http
GET /api/courses
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "courseTitle": "Python cơ bản",
    "courseDescription": "Khóa học Python cho người mới bắt đầu",
    "creatorName": "Giảng viên A",
    "enrollmentCount": 150,
    "lessonCount": 20,
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "createdAt": "2025-01-01T00:00:00"
  }
]

Error Responses:
- 401 Unauthorized: Chưa đăng nhập
```

### 5. Lấy chi tiết khóa học
```http
GET /api/courses/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "courseTitle": "Python cơ bản",
  "courseDescription": "Khóa học Python cho người mới bắt đầu",
  "creatorId": 2,
  "creatorName": "Giảng viên A",
  "enrollmentCount": 150,
  "lessonCount": 20,
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "createdAt": "2025-01-01T00:00:00",
  "lessons": [
    {
      "id": 1,
      "lessonTitle": "Giới thiệu Python",
      "orderIndex": 1
    }
  ]
}

Error Responses:
- 404 Not Found: Khóa học không tồn tại
- 401 Unauthorized: Chưa đăng nhập
```

### 6. Tạo khóa học mới
```http
POST /api/courses
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "courseTitle": "Java Spring Boot",
  "courseDescription": "Học Spring Boot từ cơ bản đến nâng cao",
  "thumbnailUrl": "https://example.com/java.jpg"
}

Response: 201 Created
{
  "id": 2,
  "courseTitle": "Java Spring Boot",
  "courseDescription": "Học Spring Boot từ cơ bản đến nâng cao",
  "creatorId": 2,
  "creatorName": "Giảng viên A",
  "enrollmentCount": 0,
  "lessonCount": 0,
  "thumbnailUrl": "https://example.com/java.jpg",
  "createdAt": "2025-01-17T10:30:00"
}

Error Responses:
- 400 Bad Request: Thiếu thông tin bắt buộc
- 401 Unauthorized: Chưa đăng nhập
- 403 Forbidden: Không có quyền tạo khóa học (chỉ TEACHER)
```

### 7. Cập nhật khóa học
```http
PUT /api/courses/{id}
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "courseTitle": "Java Spring Boot - Updated",
  "courseDescription": "Khóa học đã cập nhật",
  "thumbnailUrl": "https://example.com/java-new.jpg"
}

Response: 200 OK
{
  "id": 2,
  "courseTitle": "Java Spring Boot - Updated",
  "courseDescription": "Khóa học đã cập nhật",
  "thumbnailUrl": "https://example.com/java-new.jpg"
}

Error Responses:
- 404 Not Found: Khóa học không tồn tại
- 403 Forbidden: Không phải người tạo khóa học
```

### 8. Xóa khóa học
```http
DELETE /api/courses/{id}
Authorization: Bearer {token}

Response: 204 No Content

Error Responses:
- 404 Not Found: Khóa học không tồn tại
- 403 Forbidden: Không phải người tạo khóa học
```

### 9. Đăng ký khóa học
```http
POST /api/courses/{id}/enroll
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Đăng ký khóa học thành công",
  "enrollmentId": 123
}

Error Responses:
- 404 Not Found: Khóa học không tồn tại
- 400 Bad Request: Đã đăng ký khóa học này rồi
```

---

## 📖 Lesson APIs (Spring Boot)

### 10. Lấy danh sách bài học
```http
GET /api/courses/{courseId}/lessons
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "lessonTitle": "Giới thiệu Python",
    "orderIndex": 1,
    "content": "# Bài 1: Giới thiệu...",
    "createdAt": "2025-01-02T00:00:00"
  }
]
```

### 11. Tạo bài học mới
```http
POST /api/courses/{courseId}/lessons
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "lessonTitle": "Biến và kiểu dữ liệu",
  "orderIndex": 2,
  "content": "# Bài 2: Biến và kiểu dữ liệu\n\n## Biến trong Python..."
}

Response: 201 Created
{
  "id": 2,
  "lessonTitle": "Biến và kiểu dữ liệu",
  "orderIndex": 2,
  "courseId": 1,
  "content": "# Bài 2: Biến và kiểu dữ liệu...",
  "createdAt": "2025-01-17T11:00:00"
}

Error Responses:
- 404 Not Found: Khóa học không tồn tại
- 403 Forbidden: Không phải người tạo khóa học
```

---

## 🧠 Quiz APIs (Spring Boot)

### 12. Tạo quiz tự động bằng AI
```http
POST /api/quiz/generate
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "lessonId": 1,
  "content": "Python là ngôn ngữ lập trình...",
  "numberOfQuestions": 5,
  "difficulty": "MEDIUM"
}

Response: 201 Created
{
  "id": 1,
  "title": "Quiz: Giới thiệu Python",
  "lessonId": 1,
  "questions": [
    {
      "id": 1,
      "questionText": "Python là ngôn ngữ gì?",
      "options": ["A. Compiled", "B. Interpreted", "C. Assembly", "D. Machine"],
      "correctAnswer": "B",
      "explanation": "Python là ngôn ngữ thông dịch"
    }
  ]
}

Error Responses:
- 400 Bad Request: Nội dung quá ngắn
- 500 Internal Server Error: AI service lỗi
```

### 13. Nộp bài quiz
```http
POST /api/quiz/{id}/submit
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "answers": {
    "1": "B",
    "2": "A",
    "3": "C"
  }
}

Response: 200 OK
{
  "score": 80,
  "totalQuestions": 5,
  "correctAnswers": 4,
  "passed": true,
  "details": [
    {
      "questionId": 1,
      "isCorrect": true,
      "userAnswer": "B",
      "correctAnswer": "B"
    }
  ]
}
```

---

## 🤖 AI Chat APIs (FastAPI)

### 14. Chat với AI
```http
POST /api/chat
Content-Type: application/json

Request Body:
{
  "message": "Giải thích về Python",
  "use_rag": false,
  "ai_provider": "gemini",
  "model": "gemini-2.0-flash-exp"
}

Response: 200 OK
{
  "response": "Python là ngôn ngữ lập trình bậc cao...",
  "suggested_actions": [
    {
      "type": "course",
      "url": "/courses/1",
      "title": "Xem khóa học Python",
      "icon": "📚"
    }
  ]
}

Error Responses:
- 429 Too Many Requests: Vượt quá quota API
- 500 Internal Server Error: AI service lỗi
```

### 15. Tìm kiếm khóa học qua MySQL
```http
POST /api/chat
Content-Type: application/json

Request Body:
{
  "message": "Tìm khóa học về Python",
  "use_rag": false
}

Response: 200 OK
{
  "response": "Tôi tìm thấy 3 khóa học về Python:",
  "course_cards": [
    {
      "id": 1,
      "title": "Python cơ bản",
      "description": "Khóa học Python cho người mới",
      "creator_name": "Giảng viên A",
      "enrollment_count": 150,
      "lesson_count": 20,
      "url": "/courses/1"
    }
  ]
}
```

---

## 📊 HTTP Status Codes

### Success Codes
- **200 OK:** Request thành công
- **201 Created:** Tạo mới thành công
- **204 No Content:** Xóa thành công

### Client Error Codes
- **400 Bad Request:** Dữ liệu không hợp lệ
- **401 Unauthorized:** Chưa đăng nhập hoặc token hết hạn
- **403 Forbidden:** Không có quyền truy cập
- **404 Not Found:** Resource không tồn tại
- **429 Too Many Requests:** Vượt quá rate limit

### Server Error Codes
- **500 Internal Server Error:** Lỗi server
- **503 Service Unavailable:** Service tạm thời không khả dụng

---

## 🔒 Authentication Flow

```
1. User đăng ký/đăng nhập
   POST /api/auth/login
   ↓
2. Server trả về JWT token
   {token: "eyJhbGc..."}
   ↓
3. Client lưu token (localStorage)
   ↓
4. Mọi request sau đều gửi kèm token
   Authorization: Bearer eyJhbGc...
   ↓
5. Server verify token
   - Valid → Cho phép truy cập
   - Invalid → 401 Unauthorized
```

---

## 📝 Error Response Format

Tất cả error đều có format nhất quán:

```json
{
  "timestamp": "2025-01-17T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Khóa học không tồn tại",
  "path": "/api/courses/999"
}
```

---

## 🧪 Testing với Swagger UI

1. Truy cập: http://localhost:8080/swagger-ui.html
2. Click "Authorize" và nhập token
3. Chọn endpoint muốn test
4. Click "Try it out"
5. Nhập parameters
6. Click "Execute"
7. Xem response

---

## 📦 Postman Collection

Import file `postman_collection.json` để test nhanh tất cả APIs.

**Các biến môi trường:**
- `base_url`: http://localhost:8080
- `fastapi_url`: http://localhost:8000
- `token`: Bearer token sau khi login

---

## 🚀 Rate Limiting

- **Authentication APIs:** 10 requests/minute
- **Course APIs:** 100 requests/minute
- **AI Chat APIs:** 20 requests/minute
- **Quiz APIs:** 50 requests/minute

---

## 📞 Support

Nếu gặp vấn đề với API, vui lòng:
1. Kiểm tra logs: `docker-compose logs -f`
2. Verify token còn hạn
3. Kiểm tra request format
4. Xem Swagger UI documentation
