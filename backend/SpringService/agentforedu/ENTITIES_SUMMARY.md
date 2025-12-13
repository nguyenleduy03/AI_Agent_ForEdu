# 📦 TỔNG HỢP CÁC ENTITY CLASSES

## ✅ ĐÃ TẠO: 11 ENTITY CLASSES + 4 ENUM CLASSES

### 🟦 ENTITY CLASSES (11)

#### 1. **User.java** ✅
- **Bảng:** `users`
- **Mô tả:** Người dùng hệ thống
- **Trường mới thêm:** `fullName`, `avatarUrl`, `createdAt`, `updatedAt`
- **Role:** USER, ADMIN, TEACHER, STUDENT
- **Implements:** UserDetails (Spring Security)

#### 2. **Course.java** ✅
- **Bảng:** `courses`
- **Mô tả:** Khóa học
- **Quan hệ:** 
  - N:1 với User (created_by)
  - 1:N với Lesson
  - 1:N với Material

#### 3. **Lesson.java** ✅
- **Bảng:** `lessons`
- **Mô tả:** Bài học trong khóa học
- **Quan hệ:** N:1 với Course
- **Đặc biệt:** `orderIndex` để sắp xếp thứ tự bài học

#### 4. **Material.java** ✅
- **Bảng:** `materials`
- **Mô tả:** Tài liệu học tập (PDF, DOC, TXT, HTML, IMAGE)
- **Quan hệ:** 
  - N:1 với Course
  - N:1 với User (uploaded_by)
- **Type:** MaterialType enum

#### 5. **RagDocument.java** ✅
- **Bảng:** `rag_documents`
- **Mô tả:** Metadata cho RAG Vector Database
- **Đặc biệt:** 
  - `externalId` liên kết với knowledge_base.json
  - `tags` lưu dạng TEXT (JSON/CSV)
  - Không có FK vì liên kết lỏng lẻo

#### 6. **ChatSession.java** ✅
- **Bảng:** `chat_sessions`
- **Mô tả:** Phiên chat của người dùng
- **Quan hệ:** 
  - N:1 với User
  - 1:N với ChatMessage

#### 7. **ChatMessage.java** ✅
- **Bảng:** `chat_messages`
- **Mô tả:** Tin nhắn trong phiên chat
- **Quan hệ:** N:1 với ChatSession
- **Sender:** USER hoặc AI (MessageSender enum)

#### 8. **Quiz.java** ✅
- **Bảng:** `quizzes`
- **Mô tả:** Bộ câu hỏi do AI sinh
- **Quan hệ:** 
  - N:1 với User (created_by)
  - 1:N với QuizQuestion
  - 1:N với QuizResult
- **Difficulty:** EASY, MEDIUM, HARD

#### 9. **QuizQuestion.java** ✅
- **Bảng:** `quiz_questions`
- **Mô tả:** Câu hỏi trắc nghiệm
- **Quan hệ:** N:1 với Quiz
- **Format:** 4 đáp án (A, B, C, D)
- **Correct Answer:** CHAR(1) - 'A', 'B', 'C', hoặc 'D'

#### 10. **QuizResult.java** ✅
- **Bảng:** `quiz_results`
- **Mô tả:** Kết quả làm bài quiz
- **Quan hệ:** 
  - N:1 với Quiz
  - N:1 với User

#### 11. **SystemLog.java** ✅
- **Bảng:** `system_logs`
- **Mô tả:** Log hệ thống cho Admin
- **Quan hệ:** N:1 với User (nullable)
- **Đặc biệt:** ON DELETE SET NULL (giữ log khi xóa user)

---

### 🟨 ENUM CLASSES (4)

#### 1. **Role.java** ✅
```java
public enum Role {
    USER,
    ADMIN,
    TEACHER,
    STUDENT
}
```

#### 2. **MaterialType.java** ✅
```java
public enum MaterialType {
    PDF,
    DOC,
    TXT,
    HTML,
    IMAGE
}
```

#### 3. **MessageSender.java** ✅
```java
public enum MessageSender {
    USER,
    AI
}
```

#### 4. **QuizDifficulty.java** ✅
```java
public enum QuizDifficulty {
    EASY,
    MEDIUM,
    HARD
}
```

---

## 📂 CẤU TRÚC THỨ MỤC

```
src/main/java/aiagent/dacn/agentforedu/entity/
├── User.java                    ✅ (Updated)
├── Role.java                    ✅ (Updated)
├── Course.java                  ✅ (New)
├── Lesson.java                  ✅ (New)
├── Material.java                ✅ (New)
├── MaterialType.java            ✅ (New)
├── RagDocument.java             ✅ (New)
├── ChatSession.java             ✅ (New)
├── ChatMessage.java             ✅ (New)
├── MessageSender.java           ✅ (New)
├── Quiz.java                    ✅ (New)
├── QuizQuestion.java            ✅ (New)
├── QuizResult.java              ✅ (New)
├── QuizDifficulty.java          ✅ (New)
└── SystemLog.java               ✅ (New)
```

**Tổng:** 15 files (11 entities + 4 enums)

---

## 🔧 ANNOTATIONS SỬ DỤNG

### JPA Annotations
- `@Entity` - Đánh dấu class là entity
- `@Table(name = "...")` - Tên bảng trong database
- `@Id` - Primary key
- `@GeneratedValue(strategy = GenerationType.IDENTITY)` - Auto increment
- `@Column` - Cấu hình cột
- `@Enumerated(EnumType.STRING)` - Lưu enum dạng string
- `@ManyToOne` - Quan hệ N:1
- `@JoinColumn` - Foreign key
- `@CreationTimestamp` - Tự động set thời gian tạo
- `@UpdateTimestamp` - Tự động update thời gian

### Lombok Annotations
- `@Data` - Tự động tạo getter/setter/toString/equals/hashCode
- `@NoArgsConstructor` - Constructor không tham số
- `@AllArgsConstructor` - Constructor đầy đủ tham số

---

## 🔗 QUAN HỆ GIỮA CÁC ENTITY

### User (Trung tâm)
```
User (1) ──< (N) Course
User (1) ──< (N) Material
User (1) ──< (N) ChatSession
User (1) ──< (N) Quiz
User (1) ──< (N) QuizResult
User (1) ──< (N) SystemLog
```

### Course
```
Course (1) ──< (N) Lesson
Course (1) ──< (N) Material
```

### Chat
```
ChatSession (1) ──< (N) ChatMessage
```

### Quiz
```
Quiz (1) ──< (N) QuizQuestion
Quiz (1) ──< (N) QuizResult
```

### RAG (Độc lập)
```
RagDocument ↔ knowledge_base.json (Đồng bộ metadata)
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] User entity (updated với full_name, avatar_url, timestamps)
- [x] Role enum (thêm TEACHER, STUDENT)
- [x] Course entity
- [x] Lesson entity
- [x] Material entity + MaterialType enum
- [x] RagDocument entity
- [x] ChatSession entity
- [x] ChatMessage entity + MessageSender enum
- [x] Quiz entity + QuizDifficulty enum
- [x] QuizQuestion entity
- [x] QuizResult entity
- [x] SystemLog entity
- [x] SQL schema script (database_schema.sql)
- [x] Database design documentation (DATABASE_DESIGN.md)
- [x] ERD diagram (DATABASE_ERD.txt)
- [x] Setup guide (SETUP_DATABASE.md)

---

## 🚀 NEXT STEPS

### 1. Tạo Repository Interfaces
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}
```

### 2. Tạo Service Classes
```java
@Service
public class CourseService {
    // Business logic
}
```

### 3. Tạo Controller Classes
```java
@RestController
@RequestMapping("/api/courses")
public class CourseController {
    // REST endpoints
}
```

### 4. Tạo DTO Classes
```java
public class CourseRequest {
    private String title;
    private String description;
}
```

---

## 📝 LƯU Ý

1. **Lazy Loading:** Tất cả `@ManyToOne` dùng `FetchType.LAZY` để tối ưu performance
2. **Cascade:** Foreign keys có `ON DELETE CASCADE` hoặc `SET NULL`
3. **Indexes:** Đã thêm indexes cho các cột thường query
4. **Timestamps:** Dùng `@CreationTimestamp` và `@UpdateTimestamp` tự động
5. **Validation:** Chưa thêm `@Valid` annotations - sẽ thêm ở DTO layer

---

**Status:** ✅ HOÀN THÀNH  
**Date:** 2025-12-06  
**Version:** 1.0
