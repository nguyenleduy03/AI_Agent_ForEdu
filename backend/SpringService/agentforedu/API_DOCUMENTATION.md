# 📚 API DOCUMENTATION - AGENT FOR EDU

## 🌐 BASE URLs
- **Spring Boot**: http://localhost:8080
- **FastAPI**: http://localhost:8000

## 📖 SWAGGER UI
- **Spring Boot**: http://localhost:8080/swagger-ui/index.html
- **FastAPI**: http://localhost:8000/docs

---

## 🔐 AUTHENTICATION

### JWT Token
Tất cả API (trừ register/login) yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🟦 AUTH SERVICE (Spring Boot - Port 8080)

### 1. Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "password": "password123",
  "email": "user@example.com"
}
```

### 2. Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "user123",
  "role": "USER"
}
```

### 3. Xem Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 4. Cập nhật Profile
```http
PUT /api/auth/update-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "email": "newemail@example.com",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### 5. Đổi mật khẩu
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

---

## 🟨 USER MANAGEMENT - ADMIN ONLY (Spring Boot)

### 1. Lấy danh sách users
```http
GET /api/admin/users
Authorization: Bearer <admin_token>
```

### 2. Lấy user theo ID
```http
GET /api/admin/users/{id}
Authorization: Bearer <admin_token>
```

### 3. Xóa user
```http
DELETE /api/admin/users/{id}
Authorization: Bearer <admin_token>
```

---

## 🟥 COURSES API (Spring Boot)

### 1. Lấy tất cả khóa học
```http
GET /api/courses
Authorization: Bearer <token>
```

### 2. Lấy khóa học theo ID
```http
GET /api/courses/{id}
Authorization: Bearer <token>
```

### 3. Tạo khóa học mới
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Lập trình Python cơ bản",
  "description": "Khóa học Python cho người mới bắt đầu"
}
```

### 4. Cập nhật khóa học
```http
PUT /api/courses/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Lập trình Python nâng cao",
  "description": "Khóa học Python nâng cao"
}
```

### 5. Xóa khóa học
```http
DELETE /api/courses/{id}
Authorization: Bearer <token>
```

---

## 🟩 LESSONS API (Spring Boot)

### 1. Lấy bài học của khóa học
```http
GET /api/courses/{courseId}/lessons
Authorization: Bearer <token>
```

### 2. Lấy bài học theo ID
```http
GET /api/lessons/{id}
Authorization: Bearer <token>
```

### 3. Tạo bài học mới
```http
POST /api/courses/{courseId}/lessons
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Bài 1: Giới thiệu Python",
  "content": "Nội dung bài học...",
  "orderIndex": 1
}
```

### 4. Cập nhật bài học
```http
PUT /api/lessons/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Bài 1: Giới thiệu Python (Updated)",
  "content": "Nội dung mới...",
  "orderIndex": 1
}
```

### 5. Xóa bài học
```http
DELETE /api/lessons/{id}
Authorization: Bearer <token>
```

---

## 🟧 MATERIALS API (Spring Boot)

### 1. Lấy tài liệu của khóa học
```http
GET /api/courses/{courseId}/materials
Authorization: Bearer <token>
```

### 2. Upload tài liệu (tự động ingest vào RAG)
```http
POST /api/materials/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 1,
  "title": "Tài liệu Python",
  "description": "Tài liệu học Python",
  "fileUrl": "https://example.com/python.pdf",
  "type": "PDF"
}
```

**Types:** PDF, DOC, TXT, HTML, IMAGE

### 3. Xóa tài liệu
```http
DELETE /api/materials/{id}
Authorization: Bearer <token>
```

---

## 🟪 CHAT SESSIONS API (Spring Boot)

### 1. Lấy danh sách phiên chat
```http
GET /api/chat/sessions
Authorization: Bearer <token>
```

### 2. Tạo phiên chat mới
```http
POST /api/chat/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Chat về Python"
}
```

### 3. Lấy tin nhắn trong phiên
```http
GET /api/chat/sessions/{id}/messages
Authorization: Bearer <token>
```

### 4. Xóa phiên chat
```http
DELETE /api/chat/sessions/{id}
Authorization: Bearer <token>
```

---

## 🟦 QUIZ GENERATION API (Spring Boot)

### 1. Tạo quiz tự động (AI)
```http
POST /api/quiz/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "lessonId": 1,
  "difficulty": "medium",
  "numQuestions": 10
}
```

**Difficulty:** EASY, MEDIUM, HARD

**Response:**
```json
{
  "id": 1,
  "courseId": 1,
  "lessonId": 1,
  "difficulty": "MEDIUM",
  "createdBy": 1,
  "createdAt": "2025-12-06T10:00:00",
  "questions": [
    {
      "id": 1,
      "question": "Python là gì?",
      "optionA": "Ngôn ngữ lập trình",
      "optionB": "Hệ điều hành",
      "optionC": "Database",
      "optionD": "Framework"
    }
  ]
}
```

### 2. Lấy quiz theo ID
```http
GET /api/quiz/{id}
Authorization: Bearer <token>
```

### 3. Nộp bài quiz
```http
POST /api/quiz/{id}/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": {
    "1": "A",
    "2": "B",
    "3": "C"
  }
}
```

**Response:**
```json
{
  "quizId": 1,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "score": 80.0,
  "message": "Tốt lắm! 👍"
}
```

---

## 🟥 LOGGING API (Spring Boot)

### 1. Lấy tất cả log (ADMIN)
```http
GET /api/logs
Authorization: Bearer <admin_token>
```

### 2. Lấy log của user (ADMIN)
```http
GET /api/logs/user/{id}
Authorization: Bearer <admin_token>
```

---

## 🐍 FASTAPI SERVICE (Port 8000)

### 1. Health Check
```http
GET /
```

### 2. Chat với AI (có RAG)
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Python là gì?",
  "model": "gemini-2.5-flash",
  "use_rag": true
}
```

### 3. Thêm kiến thức vào RAG
```http
POST /api/rag/prompt
Content-Type: application/json

{
  "prompt": "Python là ngôn ngữ lập trình bậc cao...",
  "category": "programming",
  "tags": ["python", "programming"]
}
```

### 4. Tìm kiếm trong RAG
```http
POST /api/documents/search
Content-Type: application/json

{
  "query": "Python là gì",
  "n_results": 5
}
```

### 5. Lấy tất cả documents
```http
GET /api/documents
```

### 6. Xóa tất cả documents
```http
DELETE /api/documents
```

### 7. Đếm documents
```http
GET /api/documents/count
```

### 8. Thống kê RAG
```http
GET /api/rag/stats
```

### 9. Liệt kê models
```http
GET /api/models
```

---

## 🟣 AI EXTENDED APIs (FastAPI)

### 1. Generate Quiz (AI)
```http
POST /api/ai/generate-quiz
Content-Type: application/json

{
  "content": "Python là ngôn ngữ lập trình bậc cao...",
  "num_questions": 10,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "Python là gì?",
      "a": "Ngôn ngữ lập trình",
      "b": "Hệ điều hành",
      "c": "Database",
      "d": "Framework",
      "correct": "A"
    }
  ]
}
```

### 2. Summarize (Tóm tắt)
```http
POST /api/ai/summarize
Content-Type: application/json

{
  "content": "Văn bản dài cần tóm tắt...",
  "max_length": 200
}
```

### 3. Explain (Giải thích như giáo viên)
```http
POST /api/ai/explain
Content-Type: application/json

{
  "question": "Định lý Pythagoras là gì?",
  "context": "Toán học lớp 9"
}
```

### 4. Ingest Document (Thêm tài liệu vào RAG)
```http
POST /api/ai/ingest
Content-Type: application/json

{
  "file_url": "https://example.com/document.pdf",
  "title": "Tài liệu học tập"
}
```

---

## 📊 RESPONSE CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized (No token or invalid token) |
| 403 | Forbidden (No permission) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔒 ROLES

- **USER**: Người dùng thông thường
- **ADMIN**: Quản trị viên (full access)
- **TEACHER**: Giáo viên (tạo khóa học, bài học)
- **STUDENT**: Học sinh (xem và làm bài)

---

## 📝 NOTES

1. **JWT Token** có thời hạn 24 giờ
2. **RAG** tự động được gọi khi upload material
3. **Quiz Generation** sử dụng AI (Gemini 2.5 Flash)
4. **Swagger UI** có sẵn để test API
5. **CORS** đã được enable cho tất cả origins

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-06
