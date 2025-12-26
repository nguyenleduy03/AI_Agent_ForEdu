# 🎓 BÁO CÁO DỰ ÁN: AGENT FOR EDU
## Nền Tảng Học Tập Thông Minh Tích Hợp AI

---

## 📋 TỔNG QUAN DỰ ÁN

### Tên dự án: Agent For Edu - AI-Powered Learning Platform
### Mục tiêu: 
Xây dựng nền tảng học tập trực tuyến tích hợp trí tuệ nhân tạo (AI) giúp sinh viên:
- Học tập hiệu quả với AI Assistant
- Tự động đồng bộ thời khóa biểu từ cổng trường (TVU)
- Tạo quiz tự động từ nội dung bài học
- Quản lý flashcard với thuật toán Spaced Repetition
- Tích hợp Google Calendar, Gmail

---

## 🏗️ KIẾN TRÚC HỆ THỐNG (3-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                          │
│                    Port: 5173                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │Dashboard│ │ Courses │ │  Chat   │ │Flashcard│ │Calendar │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                             │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │   Spring Boot API    │    │   FastAPI AI Service │           │
│  │      Port: 8080      │◄──►│      Port: 8000      │           │
│  │  - Authentication    │    │  - Gemini AI Chat    │           │
│  │  - Course Management │    │  - RAG Search        │           │
│  │  - Quiz Management   │    │  - Quiz Generation   │           │
│  │  - User Management   │    │  - Intent Detection  │           │
│  └──────────────────────┘    └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │       MySQL          │    │   Vector Database    │           │
│  │   (Relational DB)    │    │  (knowledge_base)    │           │
│  │  - Users, Courses    │    │  - Embeddings        │           │
│  │  - Lessons, Quizzes  │    │  - Semantic Search   │           │
│  │  - Chat History      │    │  - RAG Context       │           │
│  └──────────────────────┘    └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | 19 | UI Framework |
| TypeScript | 5.x | Type-safe JavaScript |
| Vite | 6.x | Build tool (nhanh hơn Webpack) |
| Tailwind CSS | 4.x | Utility-first CSS |
| Zustand | 5.x | State Management (thay Redux) |
| React Query | 5.x | Server State Management |
| Framer Motion | 11.x | Animations |
| Axios | 1.x | HTTP Client |

### Backend - Spring Boot
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Spring Boot | 3.x | Java REST API Framework |
| Spring Security | 6.x | Authentication & Authorization |
| Spring Data JPA | 3.x | ORM (Object-Relational Mapping) |
| JWT | - | Token-based Authentication |
| MySQL | 8.0 | Relational Database |
| Swagger/OpenAPI | 3.0 | API Documentation |
| BCrypt | - | Password Encryption |

### Backend - FastAPI (Python)
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| FastAPI | 0.100+ | Python REST API Framework |
| Google Gemini | 2.5 Flash | Generative AI Model |
| Groq | - | Alternative AI Provider |
| Sentence Transformers | - | Text Embeddings |
| Pydantic | 2.x | Data Validation |

### External APIs
| API | Mục đích |
|-----|----------|
| Google Gemini API | AI Chat, Quiz Generation |
| Google OAuth 2.0 | Social Login |
| Gmail API | Email Integration |
| Google Calendar API | Calendar Sync |
| YouTube Data API | Video Search |
| OCR.space API | Image Text Extraction |

---

## 📊 THIẾT KẾ CƠ SỞ DỮ LIỆU

### Sơ đồ ERD (Entity Relationship Diagram)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    USERS    │       │   COURSES   │       │   LESSONS   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)     │
│ username    │  │    │ title       │  │    │ course_id   │──┐
│ password    │  │    │ description │  │    │ title       │  │
│ email       │  │    │ created_by  │◄─┘    │ content     │  │
│ role        │  │    │ is_public   │       │ order_index │  │
│ full_name   │  │    │ created_at  │       └─────────────┘  │
└─────────────┘  │    └─────────────┘                        │
                 │           │                               │
                 │           ▼                               │
                 │    ┌─────────────┐       ┌─────────────┐  │
                 │    │ ENROLLMENTS │       │  MATERIALS  │  │
                 │    ├─────────────┤       ├─────────────┤  │
                 └───►│ user_id     │       │ id (PK)     │  │
                      │ course_id   │◄──────│ course_id   │◄─┘
                      │ enrolled_at │       │ title       │
                      └─────────────┘       │ file_url    │
                                            │ type        │
                                            └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   QUIZZES   │       │  QUESTIONS  │       │   RESULTS   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │       │ id (PK)     │
│ lesson_id   │  │    │ quiz_id     │◄──────│ quiz_id     │
│ difficulty  │  │    │ question    │       │ user_id     │
│ created_by  │  │    │ option_a-d  │       │ score       │
└─────────────┘  │    │ correct_ans │       │ created_at  │
                 │    └─────────────┘       └─────────────┘
                 │
                 │    ┌─────────────┐       ┌─────────────┐
                 │    │CHAT_SESSIONS│       │CHAT_MESSAGES│
                 │    ├─────────────┤       ├─────────────┤
                 └───►│ id (PK)     │──┐    │ id (PK)     │
                      │ user_id     │  │    │ session_id  │◄─┐
                      │ title       │  │    │ sender      │  │
                      │ created_at  │  │    │ message     │  │
                      └─────────────┘  │    │ timestamp   │  │
                                       └────┴─────────────┘  │
                                                             │
┌─────────────┐       ┌─────────────┐                        │
│  SCHEDULES  │       │ CREDENTIALS │                        │
├─────────────┤       ├─────────────┤                        │
│ id (PK)     │       │ id (PK)     │                        │
│ user_id     │       │ user_id     │                        │
│ day_of_week │       │ service_name│                        │
│ start_time  │       │ username    │                        │
│ end_time    │       │ password    │ (AES-256 encrypted)    │
│ subject     │       │ category    │                        │
│ room        │       └─────────────┘                        │
│ teacher     │                                              │
└─────────────┘                                              │
```

### Các bảng chính (16 bảng)
1. **users** - Người dùng (4 roles: USER, ADMIN, TEACHER, STUDENT)
2. **courses** - Khóa học (public/private)
3. **lessons** - Bài học
4. **materials** - Tài liệu (PDF, DOC, TXT, HTML, IMAGE)
5. **course_enrollments** - Đăng ký khóa học (N:N)
6. **lesson_progress** - Tiến độ học bài
7. **course_progress** - Tiến độ khóa học
8. **quizzes** - Bộ câu hỏi
9. **quiz_questions** - Câu hỏi trắc nghiệm
10. **quiz_results** - Kết quả làm bài
11. **chat_sessions** - Phiên chat
12. **chat_messages** - Tin nhắn chat
13. **user_schedules** - Thời khóa biểu
14. **user_credentials** - Tài khoản dịch vụ (mã hóa AES-256)
15. **flashcard_decks** - Bộ flashcard
16. **flashcards** - Thẻ flashcard

---

## 🎯 TÍNH NĂNG CHÍNH

### 1. 🤖 AI Chat Assistant
- Chat với AI (Google Gemini 2.5 Flash)
- Hỗ trợ RAG (Retrieval-Augmented Generation)
- Conversation Memory (nhớ context)
- Vision AI (phân tích hình ảnh)
- Voice Chat (speech-to-text)

### 2. 📚 Quản lý Khóa học
- Tạo/sửa/xóa khóa học
- Khóa học công khai/riêng tư
- Upload tài liệu học tập
- Theo dõi tiến độ học

### 3. 📝 Quiz tự động
- AI tự động tạo câu hỏi từ nội dung
- 3 mức độ: Easy, Medium, Hard
- Chấm điểm tự động
- Lưu lịch sử làm bài

### 4. 📅 Đồng bộ Thời khóa biểu
- Tự động lấy TKB từ cổng TVU
- Web scraping với credentials mã hóa
- Hỗ trợ ngày tương đối (hôm qua, mai, mốt)
- Sync với Google Calendar

### 5. 📧 Email Integration
- Đọc/gửi email qua Gmail API
- AI soạn email tự động
- Preview trước khi gửi

### 6. 🃏 Flashcard System
- Tạo flashcard từ nội dung
- Thuật toán Spaced Repetition (SM-2)
- Theo dõi tiến độ ôn tập

### 7. 👨‍🏫 Teacher Dashboard
- Quản lý sinh viên
- Xem tiến độ học
- Thống kê analytics

---

## 🔐 BẢO MẬT

### Authentication & Authorization
```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY FLOW                            │
│                                                             │
│  1. Login Request                                           │
│     POST /api/auth/login                                    │
│     { username, password }                                  │
│                          │                                  │
│                          ▼                                  │
│  2. Validate Credentials                                    │
│     - BCrypt password verification                          │
│     - Load user from database                               │
│                          │                                  │
│                          ▼                                  │
│  3. Generate JWT Token                                      │
│     - Payload: { userId, username, role }                   │
│     - Expiration: 24 hours                                  │
│     - Algorithm: HS256                                      │
│                          │                                  │
│                          ▼                                  │
│  4. Return Token to Client                                  │
│     { token: "eyJhbGc...", user: {...} }                    │
│                          │                                  │
│                          ▼                                  │
│  5. Client stores token (localStorage)                      │
│                          │                                  │
│                          ▼                                  │
│  6. Subsequent Requests                                     │
│     Authorization: Bearer <token>                           │
│                          │                                  │
│                          ▼                                  │
│  7. JWT Filter validates token                              │
│     - Extract username                                      │
│     - Verify signature                                      │
│     - Check expiration                                      │
│     - Set SecurityContext                                   │
└─────────────────────────────────────────────────────────────┘
```

### Các biện pháp bảo mật
| Biện pháp | Mô tả |
|-----------|-------|
| BCrypt | Mã hóa password (cost factor 10) |
| JWT | Token-based authentication (24h expiry) |
| AES-256 | Mã hóa credentials dịch vụ |
| CORS | Cross-Origin Resource Sharing |
| RBAC | Role-Based Access Control |
| SQL Injection | PreparedStatements |
| XSS | Input sanitization |

---

## 🔄 LUỒNG XỬ LÝ CHÍNH

### Luồng Chat với AI
```
User Input → Intent Detection → Route to Handler
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
Schedule       Email           Normal Chat
Intent         Intent          (RAG + AI)
    │               │               │
    ▼               ▼               ▼
TVU Scraper    Gmail API      Gemini API
    │               │               │
    └───────────────┴───────────────┘
                    │
                    ▼
              Response to User
```

### Luồng tạo Quiz tự động
```
1. User chọn bài học
2. Frontend gọi POST /api/quiz/generate
3. Spring Boot gọi FastAPI /api/ai/generate-quiz
4. FastAPI gửi prompt đến Gemini AI
5. Gemini trả về JSON câu hỏi
6. Parse và lưu vào database
7. Trả về quiz cho user
```

---

## 📱 GIAO DIỆN NGƯỜI DÙNG

### Các trang chính (20+ pages)
| Trang | Mô tả |
|-------|-------|
| LandingPage | Trang chủ giới thiệu |
| LoginPage | Đăng nhập |
| RegisterPage | Đăng ký |
| DashboardPage | Tổng quan |
| CoursesPage | Danh sách khóa học |
| CourseDetailPage | Chi tiết khóa học |
| LessonPage | Nội dung bài học |
| ChatPage | Chat với AI |
| QuizPage | Làm bài quiz |
| FlashcardsPage | Flashcard |
| SchedulePage | Thời khóa biểu |
| GoogleCalendarPage | Google Calendar |
| ProfilePage | Thông tin cá nhân |
| SettingsPage | Cài đặt (UI, Credentials) |
| TeacherDashboard | Dashboard giáo viên |

---

## 📈 ĐIỂM NỔI BẬT

### 1. AI-First Approach
- Tích hợp sâu với Google Gemini
- Intent Detection tự động
- Conversation Memory

### 2. Modern Tech Stack
- React 19 + TypeScript
- Spring Boot 3 + Spring Security 6
- FastAPI + Async

### 3. Real-world Integration
- TVU Portal scraping
- Google OAuth/Gmail/Calendar
- YouTube search

### 4. Security Focus
- JWT + BCrypt + AES-256
- Role-based access control
- Encrypted credentials

### 5. User Experience
- Responsive design
- Dark/Light mode
- Customizable UI settings
- Smooth animations

---

## 🚀 HƯỚNG PHÁT TRIỂN

1. **Mobile App** - React Native
2. **Advanced Analytics** - Learning insights
3. **Video Lessons** - Streaming integration
4. **Peer Collaboration** - Study groups
5. **Gamification** - Badges, leaderboards

---

## 📞 THÔNG TIN LIÊN HỆ

- **Tên dự án:** Agent For Edu
- **Version:** 1.0.0
- **Ngày cập nhật:** 26/12/2025
- **Trạng thái:** Production Ready

---

## 🎤 CÂU HỎI THƯỜNG GẶP KHI BÁO CÁO

### Q1: Tại sao chọn kiến trúc 3-tier?
**A:** Tách biệt concerns, dễ scale, dễ maintain. Frontend có thể thay đổi mà không ảnh hưởng backend.

### Q2: Tại sao dùng 2 backend (Spring Boot + FastAPI)?
**A:** 
- Spring Boot: Mạnh về enterprise features, security, JPA
- FastAPI: Tốt cho AI/ML, async, Python ecosystem

### Q3: RAG là gì và hoạt động như thế nào?
**A:** Retrieval-Augmented Generation - Tìm kiếm tài liệu liên quan trước khi gửi cho AI, giúp AI trả lời chính xác hơn dựa trên context.

### Q4: Làm sao bảo mật credentials của user?
**A:** Mã hóa AES-256 trước khi lưu database, chỉ decrypt khi cần sử dụng.

### Q5: Conversation Memory hoạt động như thế nào?
**A:** Lưu chat history vào database, load 10 tin nhắn gần nhất làm context cho AI.

### Q6: Tại sao chọn Gemini thay vì ChatGPT?
**A:** 
- Free tier generous (1500 requests/day)
- Vision capability built-in
- Fast response time
- Good Vietnamese support


---

## 🎯 DEMO SCENARIOS (Kịch bản demo)

### Demo 1: Đăng nhập và Dashboard
```
1. Truy cập http://localhost:5173
2. Đăng nhập với tài khoản
3. Xem Dashboard với thống kê
```

### Demo 2: Chat với AI
```
1. Vào trang Chat
2. Hỏi: "Python là gì?"
3. AI trả lời với emoji, ví dụ
4. Hỏi tiếp: "Cho ví dụ code" (AI nhớ context)
```

### Demo 3: Xem Thời khóa biểu
```
1. Trong Chat, gõ: "Hôm nay tôi học gì?"
2. AI tự động lấy TKB từ TVU
3. Hiển thị lịch học với thời gian, phòng, giáo viên
```

### Demo 4: Gửi Email
```
1. Trong Chat, gõ: "Gửi email xin nghỉ học đến teacher@tvu.edu.vn"
2. AI soạn email tự động
3. Preview và xác nhận gửi
```

### Demo 5: Tạo Quiz
```
1. Vào khóa học → Bài học
2. Click "Tạo Quiz"
3. Chọn độ khó, số câu
4. AI tự động tạo câu hỏi
5. Làm bài và xem kết quả
```

### Demo 6: Flashcard
```
1. Vào trang Flashcards
2. Tạo deck mới
3. Thêm cards
4. Study với Spaced Repetition
```

### Demo 7: Settings UI
```
1. Vào Settings → Giao Diện
2. Đổi theme Dark/Light
3. Đổi font size
4. Đổi màu chủ đạo
5. Thấy thay đổi ngay lập tức
```

---

## 📊 SỐ LIỆU DỰ ÁN

### Code Statistics
| Thành phần | Số file | Ngôn ngữ |
|------------|---------|----------|
| Frontend | ~50 files | TypeScript/TSX |
| Spring Boot | ~60 files | Java |
| FastAPI | ~30 files | Python |
| SQL | ~10 files | SQL |
| Documentation | ~70 files | Markdown |

### Database
| Bảng | Số cột | Mô tả |
|------|--------|-------|
| users | 9 | Người dùng |
| courses | 7 | Khóa học |
| lessons | 5 | Bài học |
| quizzes | 6 | Quiz |
| quiz_questions | 8 | Câu hỏi |
| chat_sessions | 4 | Phiên chat |
| chat_messages | 5 | Tin nhắn |
| user_schedules | 10 | TKB |
| flashcard_decks | 6 | Bộ flashcard |
| flashcards | 8 | Thẻ flashcard |

### API Endpoints
| Service | Số endpoints |
|---------|--------------|
| Auth | 5 |
| Courses | 6 |
| Lessons | 5 |
| Quiz | 5 |
| Chat | 4 |
| AI | 8 |
| Flashcard | 10 |
| Schedule | 4 |
| **Tổng** | **~50** |

---

## 🔧 HƯỚNG DẪN CHẠY DỰ ÁN

### Yêu cầu hệ thống
- Node.js 18+
- Java 11+ (Maven)
- Python 3.11
- MySQL 8.0
- Google Gemini API Key

### Bước 1: Database
```sql
CREATE DATABASE Agent_Db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Spring Boot (Port 8080)
```bash
cd backend/SpringService/agentforedu
mvn spring-boot:run
```

### Bước 3: FastAPI (Port 8000)
```bash
cd backend/PythonService
python main.py
```

### Bước 4: Frontend (Port 5173)
```bash
cd fronend_web
npm install
npm run dev
```

### Bước 5: Truy cập
- Frontend: http://localhost:5173
- Spring Boot Swagger: http://localhost:8080/swagger-ui/index.html
- FastAPI Docs: http://localhost:8000/docs

---

## ✅ CHECKLIST TRƯỚC KHI BÁO CÁO

- [ ] MySQL đang chạy
- [ ] Spring Boot đang chạy (port 8080)
- [ ] FastAPI đang chạy (port 8000)
- [ ] Frontend đang chạy (port 5173)
- [ ] Có tài khoản test để demo
- [ ] Có credentials TVU để demo TKB
- [ ] Đã kết nối Google OAuth (nếu demo Gmail/Calendar)
- [ ] Đã chuẩn bị nội dung demo
- [ ] Đã test các tính năng chính

---

**Chúc bạn báo cáo thành công! 🎉**
