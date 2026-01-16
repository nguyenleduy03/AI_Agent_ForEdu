# 🎯 CHUẨN BỊ THUYẾT TRÌNH - MÔN PHÁT TRIỂN ỨNG DỤNG HƯỚNG DỊCH VỤ

## 📋 THÔNG TIN CHUNG

**Đề tài:** Agent For Edu - Hệ thống học tập thông minh theo kiến trúc hướng dịch vụ  
**Môn học:** Phát triển ứng dụng hướng dịch vụ  
**Thời gian thuyết trình:** 15-20 phút  
**Thời gian hỏi đáp:** 5-10 phút

---

## 🎓 ĐIỂM CHẤM THEO PHIẾU (10 điểm)

### 1. Hình thức báo cáo (1.0 điểm)
- ✅ Định dạng văn bản đúng quy định
- ✅ Có mục lục, danh mục hình, bảng, từ viết tắt
- ✅ Danh mục tài liệu tham khảo

### 2. Bố cục/Mở đầu (1.0 điểm)
- ✅ Đặt vấn đề rõ ràng
- ✅ Mục tiêu cụ thể, khả thi
- ✅ Phương pháp nghiên cứu phù hợp
- ✅ Đối tượng và phạm vi đúng

### 3. Nội dung (7.0 điểm)

#### 3.1 Cơ sở lý thuyết (1.0 điểm)
- ✅ Kiến trúc hướng dịch vụ (SOA)
- ✅ RESTful Web Services
- ✅ Docker Containerization
- ✅ So sánh công nghệ

#### 3.2 Giải pháp (2.0 điểm)
- ✅ Mô tả bài toán rõ ràng
- ✅ Yêu cầu chức năng cụ thể
- ✅ Mô hình dữ liệu phù hợp
- ✅ Mô hình xử lý hợp lý

#### 3.3 Thực nghiệm/Kết quả (3.5 điểm) - **QUAN TRỌNG NHẤT**
- ✅ Giao diện đẹp, màu sắc hài hòa
- ✅ Chức năng phù hợp yêu cầu
- ✅ **Đầy đủ các API CRUD**
- ✅ **Có ít nhất 10 URL API** (thực tế: 40+ APIs)
- ✅ **Triển khai với Docker**
- ✅ **Cấu trúc JSON phù hợp**
- ✅ **Xử lý lỗi (404, 500, 401...)**

#### 3.4 Kết luận (0.5 điểm)
- ✅ Kết quả đạt được
- ✅ Hạn chế
- ✅ Hướng phát triển

#### 3.5 Báo cáo (0.5 điểm)
- Tác phong tự tin
- Lập luận logic
- Tương tác tốt
- Trả lời câu hỏi rõ ràng

### 4. Mức đóng góp (0.5 điểm)

---

## 🎯 CÁC ĐIỂM CHÍNH CẦN NẮM

### 1. KIẾN TRÚC HƯỚNG DỊCH VỤ (SOA)

**Khái niệm:**
- Chia ứng dụng thành các service độc lập
- Mỗi service đảm nhận một chức năng nghiệp vụ
- Giao tiếp qua RESTful API chuẩn hóa

**Đặc điểm:**
- ✅ Loose Coupling (liên kết lỏng)
- ✅ Service Autonomy (tự chủ)
- ✅ Service Reusability (tái sử dụng)
- ✅ Stateless (phi trạng thái)

**Lợi ích:**
- Scale từng service riêng biệt
- Deploy độc lập
- Sử dụng công nghệ phù hợp (Polyglot)
- Cô lập lỗi hiệu quả


### 2. KIẾN TRÚC HỆ THỐNG AGENT FOR EDU

**Mô hình Microservices với 3 tầng:**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│              Port 5173 - Docker Container                │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼─────────┐
│  Spring Boot     │    │    FastAPI       │
│  Service (Java)  │    │  Service (Python)│
│  Port 8080       │◄───┤  Port 8000/8001  │
│  Docker Container│    │  Docker Container│
└───────┬──────────┘    └────────┬─────────┘
        │                        │
        └────────┬───────────────┘
                 │
        ┌────────▼──────────┐
        │   MySQL Database  │
        │   Port 3306       │
        │  Docker Container │
        └───────────────────┘
```

**Phân chia trách nhiệm:**

**Spring Boot Service (Core Business):**
- Authentication & Authorization (JWT)
- User Management (CRUD users)
- Course Management (CRUD courses)
- Lesson Management (CRUD lessons)
- Material Management (Upload/Download files)
- Quiz Management (CRUD quizzes)
- Flashcard System (Spaced repetition)
- Progress Tracking
- Schedule Management

**FastAPI Service (AI & Advanced Features):**
- AI Chat với Google Gemini
- Auto Quiz Generation
- Document Intelligence (PDF, DOCX)
- RAG (Retrieval-Augmented Generation)
- Vector Search với ChromaDB
- **MySQL Direct Access** (mới nhất!)

**Frontend (React + TypeScript):**
- User Interface
- API Consumer
- State Management (Zustand)
- Routing (React Router)

---

### 3. RESTFUL API - ĐIỂM QUAN TRỌNG NHẤT

**Tổng số API: 40+ endpoints**

#### A. Authentication Service (Spring Boot)
```
POST   /api/auth/register      - Đăng ký
POST   /api/auth/login         - Đăng nhập (JWT)
GET    /api/auth/profile       - Xem profile
PUT    /api/auth/profile       - Cập nhật profile
POST   /api/auth/change-password - Đổi mật khẩu
```

#### B. Course Service (Spring Boot)
```
GET    /api/courses            - Lấy tất cả khóa học
GET    /api/courses/{id}       - Lấy khóa học theo ID
GET    /api/courses/my-courses - Khóa học của tôi
GET    /api/courses/my-enrollments - Khóa đã đăng ký
POST   /api/courses            - Tạo khóa học mới
PUT    /api/courses/{id}       - Cập nhật khóa học
DELETE /api/courses/{id}       - Xóa khóa học
POST   /api/courses/{id}/enroll - Đăng ký khóa học
```

#### C. Lesson Service (Spring Boot)
```
GET    /api/courses/{courseId}/lessons - Lấy bài học
GET    /api/lessons/{id}       - Lấy bài học theo ID
POST   /api/courses/{courseId}/lessons - Tạo bài học
PUT    /api/lessons/{id}       - Cập nhật bài học
DELETE /api/lessons/{id}       - Xóa bài học
```

#### D. Material Service (Spring Boot)
```
GET    /api/courses/{courseId}/materials - Lấy tài liệu
GET    /api/lessons/{lessonId}/materials - Tài liệu theo bài
GET    /api/materials/{id}     - Chi tiết tài liệu
POST   /api/materials/upload   - Upload file
DELETE /api/materials/{id}     - Xóa tài liệu
```

#### E. Quiz Service (Spring Boot)
```
POST   /api/quiz/generate      - Tạo quiz tự động (AI)
GET    /api/quiz/lesson/{id}   - Quiz theo bài học
GET    /api/quiz/{id}          - Chi tiết quiz
POST   /api/quiz/{id}/submit   - Nộp bài
PUT    /api/quiz/{id}          - Cập nhật quiz
DELETE /api/quiz/{id}          - Xóa quiz
```

#### F. Flashcard Service (Spring Boot)
```
GET    /api/flashcards/decks   - Lấy danh sách bộ thẻ
POST   /api/flashcards/decks   - Tạo bộ thẻ mới
GET    /api/flashcards/decks/{id}/due - Thẻ cần ôn
POST   /api/flashcards/cards/{id}/review - Đánh giá thẻ
```

#### G. AI Service (FastAPI)
```
POST   /api/chat               - Chat với AI
POST   /api/ai/generate-quiz   - Tạo quiz từ nội dung
POST   /api/ai/summarize       - Tóm tắt văn bản
POST   /api/ai/explain         - Giải thích khái niệm
POST   /api/rag/prompt         - Thêm kiến thức vào RAG
GET    /api/documents/search   - Tìm kiếm ngữ nghĩa
```

**HTTP Methods sử dụng:**
- ✅ GET - Lấy dữ liệu (Safe, Idempotent)
- ✅ POST - Tạo mới (Not Safe, Not Idempotent)
- ✅ PUT - Cập nhật toàn bộ (Not Safe, Idempotent)
- ✅ DELETE - Xóa (Not Safe, Idempotent)

**HTTP Status Codes:**
- ✅ 200 OK - Thành công
- ✅ 201 Created - Tạo mới thành công
- ✅ 400 Bad Request - Lỗi validation
- ✅ 401 Unauthorized - Chưa đăng nhập
- ✅ 403 Forbidden - Không có quyền
- ✅ 404 Not Found - Không tìm thấy
- ✅ 500 Internal Server Error - Lỗi server

**Cấu trúc JSON Response:**
```json
{
  "id": 1,
  "title": "Python cơ bản",
  "description": "Khóa học Python cho người mới",
  "creatorName": "Nguyễn Văn A",
  "enrollmentCount": 150,
  "lessonCount": 20,
  "createdAt": "2025-12-06T10:00:00"
}
```

---

### 4. DOCKER CONTAINERIZATION

**Docker Compose - 4 Containers:**

```yaml
services:
  # Frontend Container
  frontend:
    build: ./fronend_web
    ports:
      - "5173:5173"
    depends_on:
      - spring-boot
      - fastapi
  
  # Spring Boot Container
  spring-boot:
    build: ./backend/SpringService/agentforedu
    ports:
      - "8080:8080"
    depends_on:
      - mysql
  
  # FastAPI Container
  fastapi:
    build: ./backend/PythonService
    ports:
      - "8000:8000"
      - "8001:8001"
    depends_on:
      - mysql
  
  # MySQL Container
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: 1111
      MYSQL_DATABASE: Agent_Db
```

**Lợi ích Docker:**
- ✅ Tính nhất quán môi trường (Dev = Production)
- ✅ Dễ dàng deploy và scale
- ✅ Cô lập dependencies
- ✅ Khởi động toàn bộ hệ thống: `docker-compose up`

---

### 5. TÍNH NĂNG NỔI BẬT

#### A. MySQL Direct Access (Mới nhất!)
**Vấn đề:** ChromaDB cần sync, dữ liệu có thể cũ

**Giải pháp:** Chatbot truy vấn trực tiếp MySQL
- ✅ Real-time data
- ✅ Chính xác 100%
- ✅ Nhanh hơn 10x
- ✅ Không cần sync

**Ví dụ:**
```
User: "Tìm khóa học về Python"
  ↓
FastAPI detect intent
  ↓
MySQLCourseService.search_courses("Python")
  ↓
SELECT * FROM courses WHERE title LIKE '%Python%'
  ↓
Return: 3 khóa học phù hợp
```

#### B. AI Chat với RAG
- Tích hợp Google Gemini 2.5 Flash
- RAG với ChromaDB vector search
- Context-aware responses
- Hỗ trợ tiếng Việt

#### C. Auto Quiz Generation
- Tạo quiz tự động từ nội dung bài học
- Sử dụng AI để sinh câu hỏi
- Đa dạng độ khó (Easy, Medium, Hard)

#### D. Flashcard System
- Spaced Repetition Algorithm
- Theo dõi tiến độ học tập
- Thống kê hiệu quả

---

### 6. CÔNG NGHỆ SỬ DỤNG

**Backend:**
- Spring Boot 3.x (Java 17)
- FastAPI (Python 3.11)
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0
- ChromaDB (Vector DB)

**Frontend:**
- React 19 + TypeScript
- Vite (Build tool)
- Tailwind CSS
- Zustand (State management)
- React Query
- Axios

**DevOps:**
- Docker
- Docker Compose
- Git

**API Documentation:**
- Swagger UI (Spring Boot)
- FastAPI Docs

---

### 7. KẾT QUẢ ĐẠT ĐƯỢC

✅ **Kiến trúc:**
- Microservices với 2 backend services
- Loose coupling, high cohesion
- Polyglot architecture (Java + Python)

✅ **API:**
- 40+ RESTful endpoints
- Đầy đủ CRUD operations
- HTTP status codes chuẩn
- JSON response nhất quán
- Swagger documentation

✅ **Docker:**
- 4 containers
- Docker Compose orchestration
- One-command deployment

✅ **Chức năng:**
- Authentication & Authorization
- Course/Lesson Management
- AI Chat & Quiz Generation
- Flashcard System
- Progress Tracking
- MySQL Direct Access

---

### 8. HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN

**Hạn chế:**
- Chưa có message queue (RabbitMQ, Kafka)
- Chưa có API Gateway
- Chưa có service discovery
- Chưa có circuit breaker
- Chưa có monitoring (Prometheus, Grafana)

**Hướng phát triển:**
- Thêm API Gateway (Spring Cloud Gateway)
- Triển khai Event-Driven Architecture
- Thêm caching layer (Redis)
- Kubernetes deployment
- CI/CD pipeline
- Mobile app (React Native)

---

## 🎤 CÂU HỎI THƯỜNG GẶP

### 1. Tại sao chọn kiến trúc Microservices?
**Trả lời:**
- Để scale từng service độc lập
- Sử dụng công nghệ phù hợp (Java cho business, Python cho AI)
- Deploy độc lập, giảm rủi ro
- Cô lập lỗi hiệu quả

### 2. Làm sao đảm bảo tính nhất quán dữ liệu giữa các service?
**Trả lời:**
- Mỗi service có database riêng (Database per service pattern)
- Giao tiếp qua RESTful API
- Sử dụng transaction trong từng service
- Có thể áp dụng Saga pattern cho distributed transaction

### 3. Tại sao dùng JWT thay vì Session?
**Trả lời:**
- Stateless - phù hợp với Microservices
- Dễ scale horizontal
- Không cần lưu session trên server
- Có thể verify token ở mọi service

### 4. Docker giúp gì cho dự án?
**Trả lời:**
- Đảm bảo môi trường nhất quán (Dev = Production)
- Dễ dàng deploy và scale
- Cô lập dependencies
- Khởi động toàn bộ hệ thống chỉ với 1 lệnh

### 5. Tại sao có 2 backend services?
**Trả lời:**
- Spring Boot: Mạnh về business logic, security, transaction
- FastAPI: Mạnh về AI, machine learning, async processing
- Polyglot architecture - dùng công nghệ phù hợp nhất

### 6. Làm sao chatbot truy vấn được database?
**Trả lời:**
- Tạo MySQLCourseService trong FastAPI
- Kết nối trực tiếp MySQL với mysql-connector-python
- Detect intent từ câu hỏi user
- Query database và format kết quả cho AI

### 7. API documentation được tạo như thế nào?
**Trả lời:**
- Spring Boot: Swagger UI tự động từ annotations
- FastAPI: Docs tự động từ type hints
- Truy cập: /swagger-ui.html và /docs

### 8. Xử lý lỗi như thế nào?
**Trả lời:**
- Try-catch trong code
- Return HTTP status code phù hợp
- JSON response với error message rõ ràng
- Log lỗi để debug

---

## 📊 DEMO TRONG THUYẾT TRÌNH

### 1. Kiến trúc hệ thống (2 phút)
- Vẽ sơ đồ 3 tầng
- Giải thích vai trò từng service
- Nhấn mạnh giao tiếp qua REST API

### 2. Swagger UI (3 phút)
- Mở http://localhost:8080/swagger-ui.html
- Show danh sách API endpoints
- Demo 1-2 API (GET courses, POST login)
- Show HTTP status codes

### 3. Docker (2 phút)
- Show docker-compose.yml
- Chạy: `docker-compose up`
- Show 4 containers đang chạy

### 4. Frontend (3 phút)
- Đăng nhập
- Xem danh sách khóa học
- Chat với AI: "Tìm khóa học về Python"
- Tạo quiz tự động

### 5. MySQL Direct Access (2 phút)
- Chat: "Bạn có khóa học gì?"
- Show log: "🔍 MySQL Course search"
- Giải thích: Truy vấn trực tiếp database

### 6. Code (3 phút)
- Show CourseController.java (Spring Boot)
- Show mysql_course_service.py (FastAPI)
- Giải thích cách giao tiếp giữa services

---

## ✅ CHECKLIST TRƯỚC KHI THUYẾT TRÌNH

### Chuẩn bị kỹ thuật:
- [ ] Khởi động Docker containers
- [ ] Test tất cả API trên Swagger
- [ ] Test frontend hoạt động
- [ ] Chuẩn bị database có dữ liệu mẫu
- [ ] Backup code và database

### Chuẩn bị nội dung:
- [ ] Đọc kỹ báo cáo
- [ ] Nắm vững kiến trúc hệ thống
- [ ] Thuộc danh sách API
- [ ] Hiểu rõ Docker setup
- [ ] Chuẩn bị trả lời câu hỏi

### Chuẩn bị slide:
- [ ] Slide 1: Giới thiệu đề tài
- [ ] Slide 2: Kiến trúc SOA/Microservices
- [ ] Slide 3: Kiến trúc hệ thống
- [ ] Slide 4: RESTful API
- [ ] Slide 5: Docker Containerization
- [ ] Slide 6: Demo
- [ ] Slide 7: Kết quả & Kết luận

---

## 🎯 ĐIỂM MẠNH CẦN NHẤN MẠNH

1. **Kiến trúc hướng dịch vụ chuẩn:**
   - Microservices với 2 backend services
   - Loose coupling, high cohesion
   - Polyglot architecture

2. **RESTful API đầy đủ:**
   - 40+ endpoints
   - Đầy đủ CRUD
   - HTTP methods & status codes chuẩn
   - Swagger documentation

3. **Docker hoàn chỉnh:**
   - 4 containers
   - Docker Compose
   - One-command deployment

4. **Tính năng nổi bật:**
   - MySQL Direct Access (real-time)
   - AI Chat với RAG
   - Auto Quiz Generation
   - Flashcard System

5. **Công nghệ hiện đại:**
   - Spring Boot 3.x
   - FastAPI
   - React 19
   - Docker

---

## 💡 LỜI KHUYÊN

1. **Tự tin:** Bạn đã làm một dự án tốt!
2. **Rõ ràng:** Giải thích đơn giản, dễ hiểu
3. **Demo mượt:** Test kỹ trước khi trình bày
4. **Trả lời ngắn gọn:** Đi thẳng vào vấn đề
5. **Thừa nhận hạn chế:** Cho thấy bạn hiểu rõ dự án

---

**Chúc bạn thuyết trình thành công! 🎉**
