# 🗄️ TỔNG QUAN CƠ SỞ DỮ LIỆU - AGENT FOR EDU

## 📊 THỐNG KÊ TỔNG QUAN

### Tổng số bảng: **24 bảng**
### Tổng số entity: **24 entity classes**

---

## 📋 DANH SÁCH 24 BẢNG CSDL

### 1. NHÓM USER & AUTHENTICATION (4 bảng)

#### 1.1. `users` - Người dùng
**Entity:** `User.java`
```sql
- id (PK)
- username (UNIQUE)
- password
- email (UNIQUE)
- role (ENUM: USER, TEACHER, ADMIN)
- full_name
- avatar_url
- avatar_drive_id
- google_access_token
- google_refresh_token
- google_token_expiry
- google_connected
- google_email
- created_at
- updated_at
```

#### 1.2. `user_credentials` - Thông tin đăng nhập hệ thống khác
**Entity:** `UserCredential.java`
```sql
- id (PK)
- user_id (FK → users)
- credential_type (ENUM: SCHOOL_PORTAL, LIBRARY, LMS)
- username
- encrypted_password
- additional_data (JSON)
- is_active
- last_used_at
- created_at
- updated_at
```

#### 1.3. `user_school_credentials` - Thông tin đăng nhập trường học
**Entity:** `UserSchoolCredential.java`
```sql
- id (PK)
- user_id (FK → users)
- school_username
- encrypted_password
- school_system (ENUM: PORTAL, LIBRARY, LMS)
- is_active
- last_synced_at
- created_at
- updated_at
```

#### 1.4. `credential_usage_logs` - Lịch sử sử dụng credentials
**Entity:** `CredentialUsageLog.java`
```sql
- id (PK)
- credential_id (FK → user_credentials)
- action_type
- status
- error_message
- created_at
```

---

### 2. NHÓM COURSE & LESSON (6 bảng)

#### 2.1. `courses` - Khóa học
**Entity:** `Course.java`
```sql
- id (PK)
- title
- description (TEXT)
- thumbnail_url
- thumbnail_drive_id
- created_by (FK → users)
- is_public
- access_password
- created_at
- updated_at
```

#### 2.2. `lessons` - Bài học
**Entity:** `Lesson.java`
```sql
- id (PK)
- course_id (FK → courses)
- title
- content (TEXT)
- order_index
- created_at
```

#### 2.3. `materials` - Tài liệu học tập
**Entity:** `Material.java`
```sql
- id (PK)
- course_id (FK → courses)
- lesson_id (FK → lessons)
- title
- description
- file_url
- file_drive_id
- file_type
- file_size
- uploaded_by (FK → users)
- created_at
```

#### 2.4. `course_enrollments` - Đăng ký khóa học
**Entity:** `CourseEnrollment.java`
```sql
- id (PK)
- user_id (FK → users)
- course_id (FK → courses)
- enrolled_at
- completed_at
- status (ENUM: ACTIVE, COMPLETED, DROPPED)
- UNIQUE(user_id, course_id)
```

#### 2.5. `course_progress` - Tiến độ khóa học
**Entity:** `CourseProgress.java`
```sql
- id (PK)
- user_id (FK → users)
- course_id (FK → courses)
- progress_percentage
- last_accessed_at
- total_time_spent (seconds)
- created_at
- updated_at
- UNIQUE(user_id, course_id)
```

#### 2.6. `lesson_progress` - Tiến độ bài học
**Entity:** `LessonProgress.java`
```sql
- id (PK)
- user_id (FK → users)
- lesson_id (FK → lessons)
- is_completed
- time_spent (seconds)
- last_accessed_at
- completed_at
- created_at
- updated_at
- UNIQUE(user_id, lesson_id)
```

---

### 3. NHÓM QUIZ & ASSESSMENT (3 bảng)

#### 3.1. `quizzes` - Bài kiểm tra
**Entity:** `Quiz.java`
```sql
- id (PK)
- course_id (FK → courses)
- lesson_id (FK → lessons)
- title
- description (TEXT)
- created_by (FK → users)
- difficulty (ENUM: EASY, MEDIUM, HARD)
- is_public
- deadline
- time_limit_minutes
- max_attempts
- shuffle_questions
- shuffle_options
- created_at
```

#### 3.2. `quiz_questions` - Câu hỏi quiz
**Entity:** `QuizQuestion.java`
```sql
- id (PK)
- quiz_id (FK → quizzes)
- question_text (TEXT)
- question_type (ENUM: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER)
- options (JSON)
- correct_answer
- explanation (TEXT)
- points
- order_index
- created_at
```

#### 3.3. `quiz_results` - Kết quả làm bài
**Entity:** `QuizResult.java`
```sql
- id (PK)
- quiz_id (FK → quizzes)
- user_id (FK → users)
- score
- total_questions
- correct_answers
- time_spent (seconds)
- answers (JSON)
- started_at
- submitted_at
- created_at
```

---

### 4. NHÓM FLASHCARD (6 bảng)

#### 4.1. `flashcard_decks` - Bộ thẻ flashcard
**Entity:** `FlashcardDeck.java`
```sql
- id (PK)
- user_id (FK → users)
- name
- description
- icon
- color
- is_public
- created_at
- updated_at
```

#### 4.2. `flashcards` - Thẻ flashcard
**Entity:** `Flashcard.java`
```sql
- id (PK)
- deck_id (FK → flashcard_decks)
- user_id (FK → users)
- front (TEXT)
- back (TEXT)
- hint (TEXT)
- explanation (TEXT)
- front_image_url
- back_image_url
- audio_url
- tags (JSON)
- source_type (ENUM: MANUAL, AI_GENERATED, IMPORTED)
- source_material_id
- created_at
- updated_at
```

#### 4.3. `flashcard_stats` - Thống kê học flashcard
**Entity:** `FlashcardStats.java`
```sql
- id (PK)
- user_id (FK → users)
- flashcard_id (FK → flashcards)
- ease_factor (Spaced Repetition)
- interval_days
- repetitions
- next_review_date
- last_reviewed_at
- total_reviews
- correct_reviews
- created_at
- updated_at
- UNIQUE(user_id, flashcard_id)
```

#### 4.4. `flashcard_reviews` - Lịch sử ôn tập
**Entity:** `FlashcardReview.java`
```sql
- id (PK)
- user_id (FK → users)
- flashcard_id (FK → flashcards)
- quality (1-5: Again, Hard, Good, Easy, Perfect)
- time_spent (seconds)
- reviewed_at
- created_at
```

#### 4.5. `flashcard_study_sessions` - Phiên học
**Entity:** `FlashcardStudySession.java`
```sql
- id (PK)
- user_id (FK → users)
- deck_id (FK → flashcard_decks)
- cards_studied
- cards_correct
- total_time (seconds)
- started_at
- ended_at
- created_at
```

#### 4.6. `flashcard_generation_requests` - Yêu cầu tạo flashcard tự động
**Entity:** `FlashcardGenerationRequest.java`
```sql
- id (PK)
- user_id (FK → users)
- deck_id (FK → flashcard_decks)
- source_content (TEXT)
- num_cards_requested
- status (ENUM: PENDING, PROCESSING, COMPLETED, FAILED)
- error_message
- created_at
- completed_at
```

---

### 5. NHÓM CHAT & AI (2 bảng)

#### 5.1. `chat_sessions` - Phiên chat
**Entity:** `ChatSession.java`
```sql
- id (PK)
- user_id (FK → users)
- title
- created_at
- updated_at
```

#### 5.2. `chat_messages` - Tin nhắn chat
**Entity:** `ChatMessage.java`
```sql
- id (PK)
- session_id (FK → chat_sessions)
- sender (ENUM: USER, AI)
- message (TEXT)
- timestamp
- created_at
```

---

### 6. NHÓM RAG & DOCUMENTS (1 bảng)

#### 6.1. `rag_documents` - Tài liệu RAG
**Entity:** `RagDocument.java`
```sql
- id (PK)
- user_id (FK → users)
- title
- content (TEXT)
- source_url
- document_type
- metadata (JSON)
- vector_id (ChromaDB ID)
- created_at
- updated_at
```

---

### 7. NHÓM SCHEDULE & CALENDAR (1 bảng)

#### 7.1. `user_schedules` - Lịch học
**Entity:** `UserSchedule.java`
```sql
- id (PK)
- user_id (FK → users)
- title
- description
- start_time
- end_time
- location
- event_type (ENUM: CLASS, EXAM, ASSIGNMENT, MEETING)
- google_event_id
- created_at
- updated_at
```

---

### 8. NHÓM SYSTEM (1 bảng)

#### 8.1. `system_logs` - Logs hệ thống
**Entity:** `SystemLog.java`
```sql
- id (PK)
- user_id (FK → users)
- action
- entity_type
- entity_id
- details (JSON)
- ip_address
- user_agent
- created_at
```

---

## 🔗 QUAN HỆ GIỮA CÁC BẢNG

### Sơ đồ quan hệ chính:

```
users (1) ──────────── (N) courses
  │                         │
  │                         │
  ├─ (N) course_enrollments │
  │                         │
  ├─ (N) course_progress    │
  │                         │
  └─ (N) lesson_progress    │
                            │
                    lessons (N) ─── (1) courses
                            │
                            │
                    materials (N) ─┬─ (1) courses
                                   └─ (1) lessons
                            
users (1) ──────────── (N) quizzes
  │                         │
  │                         │
  └─ (N) quiz_results       │
                            │
                    quiz_questions (N) ─── (1) quizzes

users (1) ──────────── (N) flashcard_decks
  │                         │
  │                         │
  └─ (N) flashcards ────────┘
       │
       ├─ (N) flashcard_stats
       ├─ (N) flashcard_reviews
       └─ (N) flashcard_study_sessions

users (1) ──────────── (N) chat_sessions
                            │
                            │
                    chat_messages (N) ─── (1) chat_sessions

users (1) ──────────── (N) user_credentials
  │
  ├─ (N) user_school_credentials
  ├─ (N) user_schedules
  ├─ (N) rag_documents
  └─ (N) system_logs
```

---

## 📈 PHÂN TÍCH THEO CHỨC NĂNG

### 1. **Core Learning (12 bảng - 50%)**
- Courses, Lessons, Materials
- Course Enrollments, Progress
- Quizzes, Questions, Results
- Flashcards (6 bảng)

### 2. **User Management (4 bảng - 17%)**
- Users
- Credentials (3 bảng)

### 3. **AI & Chat (3 bảng - 12.5%)**
- Chat Sessions, Messages
- RAG Documents

### 4. **Supporting Features (5 bảng - 20.5%)**
- Schedules
- System Logs

---

## 💾 KÍCH THƯỚC DỮ LIỆU ƯỚC TÍNH

### Với 1000 users:

| Bảng | Số records ước tính | Kích thước |
|------|---------------------|------------|
| users | 1,000 | ~500 KB |
| courses | 500 | ~200 KB |
| lessons | 5,000 | ~50 MB |
| materials | 2,000 | ~10 MB |
| course_enrollments | 10,000 | ~1 MB |
| quizzes | 1,000 | ~500 KB |
| quiz_questions | 10,000 | ~20 MB |
| quiz_results | 50,000 | ~100 MB |
| flashcards | 50,000 | ~100 MB |
| flashcard_reviews | 500,000 | ~200 MB |
| chat_messages | 100,000 | ~50 MB |
| **TỔNG** | **~728,000 records** | **~530 MB** |

---

## 🎯 ĐIỂM MẠNH THIẾT KẾ CSDL

### 1. **Chuẩn hóa tốt**
- Tách bạch các entity
- Không duplicate data
- Foreign keys rõ ràng

### 2. **Hỗ trợ Microservices**
- Mỗi service có thể query riêng
- Loose coupling

### 3. **Scalability**
- Index trên các FK
- Unique constraints
- Timestamps cho audit

### 4. **Flexibility**
- JSON columns cho metadata
- Enum types cho status
- TEXT columns cho content

### 5. **Audit Trail**
- created_at, updated_at
- system_logs
- credential_usage_logs

---

## 🔍 INDEXES QUAN TRỌNG

```sql
-- Performance indexes
CREATE INDEX idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz ON quiz_results(quiz_id);
CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcards_user ON flashcards(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- Composite indexes
CREATE INDEX idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);
CREATE INDEX idx_course_progress_user_course ON course_progress(user_id, course_id);
CREATE INDEX idx_flashcard_stats_user_card ON flashcard_stats(user_id, flashcard_id);
```

---

## 📊 QUERIES THƯỜNG DÙNG

### 1. Lấy khóa học của user
```sql
SELECT c.* 
FROM courses c
JOIN course_enrollments ce ON c.id = ce.course_id
WHERE ce.user_id = ?
```

### 2. Tính tiến độ khóa học
```sql
SELECT 
  c.id,
  c.title,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT lp.lesson_id) as completed_lessons,
  (COUNT(DISTINCT lp.lesson_id) * 100.0 / COUNT(DISTINCT l.id)) as progress
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
WHERE c.id = ?
GROUP BY c.id
```

### 3. Flashcards cần ôn hôm nay
```sql
SELECT f.*
FROM flashcards f
JOIN flashcard_stats fs ON f.id = fs.flashcard_id
WHERE fs.user_id = ?
  AND fs.next_review_date <= CURDATE()
ORDER BY fs.next_review_date ASC
```

---

## 🎤 CÂU TRẢ LỜI MẪU CHO THUYẾT TRÌNH

### Q: "Dự án có bao nhiêu bảng CSDL?"

**Trả lời:**
```
Dự án có 24 bảng CSDL, chia thành 8 nhóm chức năng:

1. User & Authentication: 4 bảng
2. Course & Lesson: 6 bảng
3. Quiz & Assessment: 3 bảng
4. Flashcard: 6 bảng (nhiều nhất)
5. Chat & AI: 2 bảng
6. RAG Documents: 1 bảng
7. Schedule: 1 bảng
8. System Logs: 1 bảng

Trong đó, nhóm Flashcard có 6 bảng vì cần hỗ trợ:
- Spaced Repetition Algorithm
- Tracking học tập chi tiết
- AI generation
```

### Q: "Tại sao cần nhiều bảng như vậy?"

**Trả lời:**
```
Vì áp dụng nguyên tắc chuẩn hóa CSDL:

1. Tách bạch entities → Dễ maintain
2. Tránh duplicate data → Tiết kiệm storage
3. Foreign keys → Đảm bảo integrity
4. Scalability → Dễ mở rộng

Ví dụ: Flashcard có 6 bảng riêng thay vì 1 bảng lớn
→ Dễ query, dễ optimize performance
```

### Q: "Quan hệ giữa các bảng như thế nào?"

**Trả lời:**
```
Chủ yếu là quan hệ 1-N:

- 1 User → N Courses (created)
- 1 Course → N Lessons
- 1 Lesson → N Materials
- 1 User → N Flashcard Decks
- 1 Deck → N Flashcards

Có unique constraints cho:
- course_enrollments(user_id, course_id)
- lesson_progress(user_id, lesson_id)
→ Đảm bảo không duplicate
```

---

**Tổng kết: 24 bảng, 24 entity classes, thiết kế chuẩn hóa tốt, hỗ trợ Microservices!** ✅
