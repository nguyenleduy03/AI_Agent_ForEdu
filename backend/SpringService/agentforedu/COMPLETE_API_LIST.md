# ✅ DANH SÁCH API ĐẦY ĐỦ - AGENT FOR EDU

## 📊 TỔNG QUAN

**Tổng số API:** 40+ endpoints  
**Spring Boot APIs:** 28 endpoints  
**FastAPI APIs:** 13 endpoints

---

## 🟦 AUTH SERVICE (Spring Boot) - 5 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| GET | `/api/auth/profile` | Xem thông tin profile | ✅ |
| PUT | `/api/auth/update-profile` | Cập nhật profile | ✅ |
| POST | `/api/auth/change-password` | Đổi mật khẩu | ✅ |

---

## 🟨 USER MANAGEMENT (Spring Boot) - ADMIN ONLY - 3 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/api/admin/users` | Lấy danh sách tất cả users | ✅ ADMIN |
| GET | `/api/admin/users/{id}` | Lấy thông tin user theo ID | ✅ ADMIN |
| DELETE | `/api/admin/users/{id}` | Xóa user | ✅ ADMIN |

---

## 🟥 COURSES API (Spring Boot) - 5 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/api/courses` | Lấy danh sách tất cả khóa học | ✅ |
| GET | `/api/courses/{id}` | Lấy thông tin khóa học theo ID | ✅ |
| POST | `/api/courses` | Tạo khóa học mới | ✅ |
| PUT | `/api/courses/{id}` | Cập nhật khóa học | ✅ |
| DELETE | `/api/courses/{id}` | Xóa khóa học | ✅ |

---

## 🟩 LESSONS API (Spring Boot) - 5 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/api/courses/{courseId}/lessons` | Lấy danh sách bài học của khóa học | ✅ |
| GET | `/api/lessons/{id}` | Lấy thông tin bài học theo ID | ✅ |
| POST | `/api/courses/{courseId}/lessons` | Tạo bài học mới trong khóa học | ✅ |
| PUT | `/api/lessons/{id}` | Cập nhật bài học | ✅ |
| DELETE | `/api/lessons/{id}` | Xóa bài học | ✅ |

---

## 🟧 MATERIALS API (Spring Boot) - 3 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/api/courses/{courseId}/materials` | Lấy danh sách tài liệu của khóa học | ✅ |
| POST | `/api/materials/upload` | Upload tài liệu (tự động ingest vào RAG) | ✅ |
| DELETE | `/api/materials/{id}` | Xóa tài liệu | ✅ |

---

## 🟪 CHAT SESSIONS API (Spring Boot) - 4 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/api/chat/sessions` | Lấy danh sách phiên chat của user | ✅ |
| POST | `/api/chat/sessions` | Tạo phiên chat mới | ✅ |
| GET | `/api/chat/sessions/{id}/messages` | Lấy danh sách tin nhắn trong phiên chat | ✅ |
| DELETE | `/api/chat/sessions/{id}` | Xóa phiên chat | ✅ |

---

## 🟦 QUIZ GENERATION API (Spring Boot) - 3 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| POST | `/api/quiz/generate` | Tạo quiz tự động từ bài học (AI) | ✅ |
| GET | `/api/quiz/{id}` | Lấy thông tin quiz và câu hỏi | ✅ |
| POST | `/api/quiz/{id}/submit` | Nộp bài quiz và nhận kết quả | ✅ |

---

## 🟥 LOGGING API (Spring Boot) - ADMIN ONLY - 2 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/api/logs` | Lấy tất cả log hệ thống | ✅ ADMIN |
| GET | `/api/logs/user/{id}` | Lấy log của một user | ✅ ADMIN |

---

## 🐍 FASTAPI - CHAT & RAG APIs - 9 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| GET | `/` | Health check | ❌ |
| POST | `/api/chat` | Chat với Gemini AI (có RAG) | ❌ |
| POST | `/api/rag/prompt` | Thêm kiến thức vào RAG (tự động phân loại) | ❌ |
| POST | `/api/rag/prompt/auto` | Thêm kiến thức (AI tự động sinh metadata) | ❌ |
| POST | `/api/documents/add` | Thêm nhiều documents vào RAG | ❌ |
| POST | `/api/documents/search` | Tìm kiếm semantic trong RAG | ❌ |
| GET | `/api/documents` | Lấy tất cả documents | ❌ |
| GET | `/api/documents/count` | Đếm số lượng documents | ❌ |
| DELETE | `/api/documents` | Xóa tất cả documents | ❌ |
| GET | `/api/rag/stats` | Thống kê RAG theo category | ❌ |
| GET | `/api/models` | Liệt kê các model Gemini có sẵn | ❌ |

---

## 🟣 FASTAPI - AI EXTENDED APIs - 4 APIs

| Method | Endpoint | Mô tả | Auth Required |
|--------|----------|-------|---------------|
| POST | `/api/ai/generate-quiz` | Tạo câu hỏi trắc nghiệm tự động (AI) | ❌ |
| POST | `/api/ai/summarize` | Tóm tắt văn bản | ❌ |
| POST | `/api/ai/explain` | Giải thích như một giáo viên | ❌ |
| POST | `/api/ai/ingest` | Ingest tài liệu vào RAG Vector Database | ❌ |

---

## 📊 THỐNG KÊ THEO MODULE

### Spring Boot (28 APIs)
- ✅ Auth Service: 5 APIs
- ✅ User Management (Admin): 3 APIs
- ✅ Courses: 5 APIs
- ✅ Lessons: 5 APIs
- ✅ Materials: 3 APIs
- ✅ Chat Sessions: 4 APIs
- ✅ Quiz Generation: 3 APIs
- ✅ Logging (Admin): 2 APIs

### FastAPI (13 APIs)
- ✅ Chat & RAG: 9 APIs
- ✅ AI Extended: 4 APIs

---

## 🔐 AUTHENTICATION

### JWT Token
Tất cả Spring Boot APIs (trừ register/login) yêu cầu JWT token:
```
Authorization: Bearer <your_jwt_token>
```

### Roles
- **USER**: Người dùng thông thường
- **ADMIN**: Quản trị viên (full access)
- **TEACHER**: Giáo viên
- **STUDENT**: Học sinh

---

## 🌐 SWAGGER UI

### Spring Boot
```
http://localhost:8080/swagger-ui/index.html
```

### FastAPI
```
http://localhost:8000/docs
```

---

## 🚀 WORKFLOW EXAMPLES

### 1. Tạo khóa học hoàn chỉnh
```
1. POST /api/auth/login → Lấy token
2. POST /api/courses → Tạo khóa học
3. POST /api/courses/{courseId}/lessons → Tạo bài học
4. POST /api/materials/upload → Upload tài liệu (tự động RAG)
5. POST /api/quiz/generate → Tạo quiz từ bài học
```

### 2. Học sinh làm bài
```
1. POST /api/auth/login → Lấy token
2. GET /api/courses → Xem danh sách khóa học
3. GET /api/courses/{id}/lessons → Xem bài học
4. GET /api/quiz/{id} → Lấy quiz
5. POST /api/quiz/{id}/submit → Nộp bài
```

### 3. Chat với AI có RAG
```
1. POST /api/materials/upload → Upload tài liệu (Spring Boot)
2. POST /api/chat → Chat với AI, use_rag=true (FastAPI)
```

### 4. Admin quản lý
```
1. POST /api/auth/login (ADMIN) → Lấy admin token
2. GET /api/admin/users → Xem danh sách users
3. GET /api/logs → Xem system logs
4. DELETE /api/admin/users/{id} → Xóa user
```

---

## ✅ CHECKLIST HOÀN THÀNH

### Spring Boot
- [x] Auth Service (5 APIs)
- [x] User Management - Admin (3 APIs)
- [x] Courses API (5 APIs)
- [x] Lessons API (5 APIs)
- [x] Materials API (3 APIs)
- [x] Chat Sessions API (4 APIs)
- [x] Quiz Generation API (3 APIs)
- [x] Logging API (2 APIs)

### FastAPI
- [x] Chat & RAG APIs (9 APIs)
- [x] AI Extended APIs (4 APIs)

### Infrastructure
- [x] JWT Authentication
- [x] Role-based Access Control
- [x] Swagger Documentation
- [x] CORS Configuration
- [x] Database Entities (11 entities)
- [x] DTOs (17 DTOs)
- [x] Repositories (9 repositories)
- [x] Services (7 services)
- [x] Controllers (8 controllers)

---

**Status:** ✅ HOÀN THÀNH  
**Total APIs:** 41 endpoints  
**Date:** 2025-12-06  
**Version:** 1.0.0
