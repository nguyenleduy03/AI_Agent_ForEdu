# 🗄️ THIẾT KẾ CƠ SỞ DỮ LIỆU - HỆ THỐNG HỌC TẬP AI

## 📋 TỔNG QUAN

Hệ thống sử dụng **MySQL** để lưu trữ dữ liệu quan hệ và **JSON Vector Database** (knowledge_base.json) để lưu embeddings cho RAG.

**Database:** `Agent_Db`  
**Charset:** utf8mb4_unicode_ci  
**Engine:** InnoDB

---

## 🧱 CẤU TRÚC CÁC BẢNG

### 1️⃣ BẢNG `users` - Người dùng hệ thống

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID người dùng |
| username | VARCHAR(255) UNIQUE | Tên đăng nhập |
| password | VARCHAR(255) | Mật khẩu (BCrypt) |
| email | VARCHAR(255) UNIQUE | Email |
| role | ENUM | USER, ADMIN, TEACHER, STUDENT |
| full_name | VARCHAR(255) | Họ tên đầy đủ |
| avatar_url | VARCHAR(500) | URL ảnh đại diện |
| created_at | DATETIME | Thời gian tạo |
| updated_at | DATETIME | Thời gian cập nhật |

**Indexes:** username, email, role

---

### 2️⃣ BẢNG `courses` - Khóa học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID khóa học |
| title | VARCHAR(500) | Tiêu đề khóa học |
| description | TEXT | Mô tả chi tiết |
| created_by | BIGINT FK users(id) | Người tạo |
| is_public | BOOLEAN | Khóa học công khai (TRUE) hay riêng tư (FALSE) |
| access_password | VARCHAR(255) | Mật khẩu cho khóa học riêng tư |
| created_at | DATETIME | Thời gian tạo |
| updated_at | DATETIME | Thời gian cập nhật |

**Indexes:** created_by, created_at, is_public

---

### 3️⃣ BẢNG `lessons` - Bài học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID bài học |
| course_id | BIGINT FK courses(id) | Khóa học |
| title | VARCHAR(500) | Tiêu đề bài học |
| content | TEXT | Nội dung bài học |
| order_index | INT | Thứ tự bài học |
| created_at | DATETIME | Thời gian tạo |

**Indexes:** course_id, (course_id, order_index)

---

### 4️⃣ BẢNG `materials` - Tài liệu học tập

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID tài liệu |
| course_id | BIGINT FK courses(id) | Khóa học |
| title | VARCHAR(500) | Tiêu đề tài liệu |
| description | TEXT | Mô tả |
| file_url | VARCHAR(1000) | URL file |
| type | ENUM | PDF, DOC, TXT, HTML, IMAGE |
| uploaded_by | BIGINT FK users(id) | Người upload |
| uploaded_at | DATETIME | Thời gian upload |

**Indexes:** course_id, type

---

### 5️⃣ BẢNG `rag_documents` - Metadata cho RAG

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID metadata |
| external_id | VARCHAR(255) | ID trong knowledge_base.json |
| course_id | BIGINT | Khóa học liên quan |
| lesson_id | BIGINT | Bài học liên quan |
| title | VARCHAR(500) | Tiêu đề document |
| category | VARCHAR(100) | Danh mục |
| tags | TEXT | Tags (JSON/CSV) |
| created_at | DATETIME | Thời gian tạo |

**Indexes:** external_id, course_id, lesson_id, category

**Lưu ý:** Bảng này đồng bộ metadata với `knowledge_base.json` của FastAPI

---

### 6️⃣ BẢNG `chat_sessions` - Phiên chat

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID phiên chat |
| user_id | BIGINT FK users(id) | Người dùng |
| title | VARCHAR(500) | Tiêu đề phiên chat |
| created_at | DATETIME | Thời gian tạo |

**Indexes:** user_id, created_at

---

### 7️⃣ BẢNG `chat_messages` - Tin nhắn chat

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID tin nhắn |
| session_id | BIGINT FK chat_sessions(id) | Phiên chat |
| sender | ENUM | USER, AI |
| message | TEXT | Nội dung tin nhắn |
| timestamp | DATETIME | Thời gian gửi |

**Indexes:** session_id, timestamp

---

### 8️⃣ BẢNG `quizzes` - Bộ câu hỏi

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID quiz |
| course_id | BIGINT | Khóa học |
| lesson_id | BIGINT | Bài học |
| created_by | BIGINT FK users(id) | Người tạo |
| difficulty | ENUM | EASY, MEDIUM, HARD |
| created_at | DATETIME | Thời gian tạo |

**Indexes:** course_id, lesson_id, difficulty

---

### 9️⃣ BẢNG `quiz_questions` - Câu hỏi quiz

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID câu hỏi |
| quiz_id | BIGINT FK quizzes(id) | Quiz |
| question | TEXT | Câu hỏi |
| option_a | TEXT | Đáp án A |
| option_b | TEXT | Đáp án B |
| option_c | TEXT | Đáp án C |
| option_d | TEXT | Đáp án D |
| correct_answer | CHAR(1) | Đáp án đúng (A/B/C/D) |

**Indexes:** quiz_id

---

### 🔟 BẢNG `quiz_results` - Kết quả quiz

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID kết quả |
| quiz_id | BIGINT FK quizzes(id) | Quiz |
| user_id | BIGINT FK users(id) | Người làm |
| score | INT | Điểm số |
| created_at | DATETIME | Thời gian làm |

**Indexes:** quiz_id, user_id, score

---

### 1️⃣1️⃣ BẢNG `system_logs` - Log hệ thống

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID log |
| user_id | BIGINT FK users(id) | Người thực hiện |
| action | VARCHAR(255) | Hành động |
| detail | TEXT | Chi tiết |
| timestamp | DATETIME | Thời gian |

**Indexes:** user_id, action, timestamp

---

### 1️⃣2️⃣ BẢNG `course_enrollments` - Đăng ký khóa học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID đăng ký |
| user_id | BIGINT FK users(id) | Người đăng ký |
| course_id | BIGINT FK courses(id) | Khóa học |
| enrolled_at | DATETIME | Thời gian đăng ký |

**Indexes:** user_id, course_id, enrolled_at  
**Unique Constraint:** (user_id, course_id) - Một user chỉ đăng ký 1 lần

---

### 1️⃣3️⃣ BẢNG `user_schedules` - Thời khóa biểu

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID lịch |
| user_id | BIGINT FK users(id) | Người dùng |
| day_of_week | VARCHAR(20) | Thứ (MONDAY-SUNDAY) |
| start_time | TIME | Giờ bắt đầu |
| end_time | TIME | Giờ kết thúc |
| subject | VARCHAR(255) | Môn học |
| room | VARCHAR(100) | Phòng học |
| teacher | VARCHAR(255) | Giáo viên |
| notes | TEXT | Ghi chú |
| created_at | DATETIME | Thời gian tạo |
| updated_at | DATETIME | Thời gian cập nhật |

**Indexes:** user_id, day_of_week, (user_id, day_of_week)  
**Check Constraints:** start_time < end_time, day_of_week IN (MONDAY-SUNDAY)

---

### 1️⃣4️⃣ BẢNG `user_school_credentials` - Thông tin trường học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | BIGINT PK AUTO | ID credential |
| user_id | BIGINT FK users(id) UNIQUE | Người dùng |
| encrypted_username | VARCHAR(500) | Username đã mã hóa |
| encrypted_password | TEXT | Password đã mã hóa |
| school_url | VARCHAR(500) | URL trang trường |
| last_synced_at | DATETIME | Lần đồng bộ cuối |
| is_active | BOOLEAN | Đang hoạt động |
| created_at | DATETIME | Thời gian tạo |
| updated_at | DATETIME | Thời gian cập nhật |

**Indexes:** user_id (UNIQUE), is_active, last_synced_at

---

## 🔗 QUAN HỆ GIỮA CÁC BẢNG

```
users (1) ----< (N) courses
users (1) ----< (N) materials
users (1) ----< (N) chat_sessions
users (1) ----< (N) quizzes
users (1) ----< (N) quiz_results
users (1) ----< (N) system_logs
users (1) ----< (N) course_enrollments
users (1) ----< (N) user_schedules
users (1) ---- (1) user_school_credentials

courses (1) ----< (N) lessons
courses (1) ----< (N) materials
courses (1) ----< (N) course_enrollments

chat_sessions (1) ----< (N) chat_messages

quizzes (1) ----< (N) quiz_questions
quizzes (1) ----< (N) quiz_results

users (N) ←→ (N) courses  [qua course_enrollments]
```

---

## 🚀 CÁCH SỬ DỤNG

### 1. Tạo database tự động (Spring Boot)

Spring Boot sẽ tự động tạo các bảng khi khởi động với cấu hình:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

### 2. Tạo database thủ công (MySQL)

```bash
mysql -u root -p < database_schema.sql
```

### 3. Kiểm tra database

```sql
USE Agent_Db;
SHOW TABLES;
DESCRIBE users;
```

---

## 📊 DỮ LIỆU MẪU

File `database_schema.sql` đã bao gồm 3 user mẫu:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin | admin123 | ADMIN | admin@example.com |
| teacher1 | teacher123 | TEACHER | teacher@example.com |
| student1 | student123 | STUDENT | student@example.com |

---

## 🔐 BẢO MẬT

- Tất cả password được mã hóa bằng **BCrypt**
- Foreign keys có `ON DELETE CASCADE` hoặc `SET NULL`
- Indexes được tạo cho các cột thường xuyên query
- Charset utf8mb4 hỗ trợ emoji và ký tự đặc biệt

---

## 📝 LƯU Ý

1. **Vector Database (knowledge_base.json)** lưu embeddings, MySQL chỉ lưu metadata
2. **rag_documents.external_id** liên kết với ID trong JSON
3. **chat_messages** lưu lịch sử chat để training/analysis
4. **system_logs** giúp Admin theo dõi hoạt động hệ thống
5. **quiz_questions** hỗ trợ 4 đáp án trắc nghiệm
6. **course_enrollments** quản lý quan hệ N:N giữa User và Course
7. **user_schedules** lưu thời khóa biểu từ web scraper
8. **user_school_credentials** lưu thông tin đăng nhập đã mã hóa AES-256
9. **courses.is_public** = FALSE yêu cầu access_password để truy cập
10. **user_school_credentials.user_id** có UNIQUE constraint - mỗi user chỉ 1 credential

---

## 🛠️ MIGRATION

Khi cần thay đổi schema:

1. Backup database: `mysqldump -u root -p Agent_Db > backup.sql`
2. Chỉnh sửa Entity classes
3. Restart Spring Boot (ddl-auto: update sẽ tự động migrate)
4. Hoặc viết migration script riêng

---

**Thiết kế bởi:** AI Learning System  
**Version:** 1.0  
**Last Updated:** 2025-12-06
