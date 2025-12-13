# Requirements Document - Universal Credential Manager

## Introduction

Hệ thống quản lý tài khoản/mật khẩu đa mục đích (Universal Credential Manager) cho phép người dùng lưu trữ nhiều bộ credentials cho các dịch vụ khác nhau (web trường, web phim, mạng xã hội, v.v.). AI Agent sẽ đọc metadata để hiểu mục đích sử dụng của từng credential và tự động sử dụng đúng credential cho đúng tác vụ.

## Glossary

- **Credential**: Một bộ thông tin đăng nhập bao gồm username, password, và các thông tin liên quan
- **Service**: Dịch vụ/website mà credential được sử dụng (ví dụ: school_portal, movie_site, social_media)
- **Purpose**: Mục đích sử dụng credential (ví dụ: "xem thời khóa biểu", "xem phim", "đăng bài")
- **AI Agent**: Hệ thống AI có khả năng đọc và sử dụng credentials dựa trên context
- **Metadata**: Thông tin mô tả về credential để AI hiểu được cách sử dụng
- **Vector Database**: Cơ sở dữ liệu lưu trữ embeddings để semantic search
- **SQL Database**: Cơ sở dữ liệu quan hệ MySQL lưu trữ dữ liệu có cấu trúc

## Requirements

### Requirement 1: Quản lý Multiple Credentials

**User Story:** Là một người dùng, tôi muốn lưu nhiều bộ tài khoản/mật khẩu cho các dịch vụ khác nhau, để tôi có thể quản lý tất cả credentials ở một nơi.

#### Acceptance Criteria

1. WHEN người dùng tạo credential mới THEN hệ thống SHALL lưu trữ username, password, service_name, service_url, và purpose
2. WHEN người dùng xem danh sách credentials THEN hệ thống SHALL hiển thị tất cả credentials của người dùng đó được nhóm theo service
3. WHEN người dùng cập nhật credential THEN hệ thống SHALL mã hóa password mới và cập nhật metadata
4. WHEN người dùng xóa credential THEN hệ thống SHALL xóa cả dữ liệu trong SQL và vector database
5. WHEN người dùng có nhiều credentials cho cùng một service THEN hệ thống SHALL cho phép phân biệt bằng label hoặc description

### Requirement 2: AI-Readable Metadata

**User Story:** Là một AI Agent, tôi muốn đọc metadata của credentials để hiểu mục đích sử dụng, để tôi có thể tự động chọn đúng credential cho đúng tác vụ.

#### Acceptance Criteria

1. WHEN AI Agent nhận yêu cầu "xem thời khóa biểu" THEN hệ thống SHALL tìm credential có purpose chứa "schedule" hoặc "timetable"
2. WHEN AI Agent search credentials bằng semantic query THEN vector database SHALL trả về credentials có meaning tương tự
3. WHEN credential được tạo THEN hệ thống SHALL tự động generate embedding từ purpose và description
4. WHEN AI Agent cần credential THEN hệ thống SHALL trả về credential phù hợp nhất dựa trên context
5. WHEN có nhiều credentials match THEN hệ thống SHALL rank theo relevance score và trả về top result

### Requirement 3: Security và Encryption

**User Story:** Là một người dùng, tôi muốn credentials của tôi được mã hóa an toàn, để thông tin nhạy cảm không bị lộ.

#### Acceptance Criteria

1. WHEN credential được lưu THEN hệ thống SHALL mã hóa password bằng AES-256
2. WHEN credential được lấy ra THEN hệ thống SHALL giải mã password chỉ khi có quyền truy cập
3. WHEN lưu vào vector database THEN hệ thống SHALL NOT lưu password, chỉ lưu metadata và embeddings
4. WHEN API trả về credential THEN hệ thống SHALL mask password (hiển thị ****) trừ khi explicitly requested
5. WHEN user không phải owner THEN hệ thống SHALL từ chối truy cập credential

### Requirement 4: Categorization và Tagging

**User Story:** Là một người dùng, tôi muốn phân loại credentials theo categories và tags, để dễ dàng tìm kiếm và quản lý.

#### Acceptance Criteria

1. WHEN người dùng tạo credential THEN hệ thống SHALL cho phép chọn category (Education, Entertainment, Social, Work, Other)
2. WHEN người dùng thêm tags THEN hệ thống SHALL lưu tags dạng array và index để search
3. WHEN người dùng filter theo category THEN hệ thống SHALL trả về tất cả credentials trong category đó
4. WHEN người dùng search theo tag THEN hệ thống SHALL trả về credentials có tag match
5. WHEN AI Agent cần credential THEN hệ thống SHALL sử dụng category và tags để narrow down search

### Requirement 5: Usage Tracking và Analytics

**User Story:** Là một người dùng, tôi muốn xem lịch sử sử dụng credentials, để biết credential nào được dùng nhiều nhất và khi nào.

#### Acceptance Criteria

1. WHEN credential được sử dụng THEN hệ thống SHALL ghi log với timestamp và action
2. WHEN người dùng xem credential detail THEN hệ thống SHALL hiển thị last_used_at và usage_count
3. WHEN credential không được dùng trong 90 ngày THEN hệ thống SHALL đánh dấu là "inactive"
4. WHEN AI Agent sử dụng credential THEN hệ thống SHALL log action và context
5. WHEN có lỗi xác thực THEN hệ thống SHALL ghi log và notify người dùng

### Requirement 6: Credential Sharing (Optional)

**User Story:** Là một người dùng, tôi muốn chia sẻ credential với người khác trong team, để họ có thể sử dụng chung tài khoản.

#### Acceptance Criteria

1. WHEN người dùng share credential THEN hệ thống SHALL tạo share link hoặc grant permission cho user khác
2. WHEN credential được share THEN hệ thống SHALL log ai được share và khi nào
3. WHEN người nhận revoke access THEN hệ thống SHALL xóa permission ngay lập tức
4. WHEN credential owner xóa credential THEN hệ thống SHALL revoke tất cả shares
5. WHEN shared credential được sử dụng THEN hệ thống SHALL log cả owner và user sử dụng

### Requirement 7: Auto-fill và Browser Integration (Future)

**User Story:** Là một người dùng, tôi muốn AI tự động điền credentials khi cần, để không phải copy-paste thủ công.

#### Acceptance Criteria

1. WHEN AI Agent detect login form THEN hệ thống SHALL suggest matching credentials dựa trên URL
2. WHEN người dùng approve THEN AI SHALL tự động điền username và password
3. WHEN có nhiều credentials cho cùng URL THEN hệ thống SHALL hỏi người dùng chọn
4. WHEN auto-fill thành công THEN hệ thống SHALL update last_used_at
5. WHEN auto-fill thất bại THEN hệ thống SHALL log error và notify người dùng

---

## Kiến trúc đề xuất: HYBRID (SQL + Vector Database)

### Lý do chọn Hybrid:

#### SQL Database (MySQL) - Lưu trữ chính:
**Ưu điểm:**
- ✅ ACID compliance - đảm bảo data integrity
- ✅ Structured data - credentials có schema rõ ràng
- ✅ Fast exact match queries - tìm theo ID, user_id, service_name
- ✅ Relationships - foreign keys với users table
- ✅ Transactions - đảm bảo consistency khi update
- ✅ Backup và recovery dễ dàng

**Lưu trữ:**
- Credential ID, user_id, service_name, service_url
- Encrypted username, encrypted password
- Category, tags (JSON), is_active, is_shared
- Created_at, updated_at, last_used_at, usage_count

#### Vector Database - Semantic Search:
**Ưu điểm:**
- ✅ Semantic search - AI tìm credential theo meaning, không cần exact match
- ✅ Context-aware - hiểu "xem phim" = "watch movie" = "streaming"
- ✅ Fuzzy matching - tìm được ngay cả khi user mô tả không chính xác
- ✅ Ranking - trả về credentials theo relevance score

**Lưu trữ:**
- Credential ID (reference to SQL)
- Purpose embedding (768 dimensions)
- Description embedding
- Tags embedding
- Metadata: category, service_name (for filtering)

### Workflow:

```
1. CREATE Credential:
   SQL: Lưu full data (encrypted)
   Vector DB: Lưu embeddings của purpose + description
   
2. SEARCH by AI:
   Step 1: Vector DB semantic search → get credential IDs
   Step 2: SQL fetch full data by IDs
   Step 3: Decrypt và return
   
3. SEARCH by User (exact):
   SQL: Direct query by service_name, category, tags
   
4. UPDATE:
   SQL: Update data
   Vector DB: Re-generate embeddings nếu purpose/description thay đổi
   
5. DELETE:
   SQL: Delete record
   Vector DB: Delete embeddings
```

---

## Database Schema

### SQL Table: `user_credentials`

```sql
CREATE TABLE user_credentials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Service info
    service_name VARCHAR(100) NOT NULL,
    service_url VARCHAR(500),
    service_type ENUM('WEB', 'API', 'APP', 'OTHER') DEFAULT 'WEB',
    
    -- Credentials (encrypted)
    encrypted_username VARCHAR(500) NOT NULL,
    encrypted_password TEXT NOT NULL,
    
    -- Metadata for AI
    purpose TEXT NOT NULL,  -- "Xem thời khóa biểu", "Watch movies", etc.
    description TEXT,       -- Chi tiết hơn về cách dùng
    
    -- Organization
    category ENUM('EDUCATION', 'ENTERTAINMENT', 'SOCIAL', 'WORK', 'FINANCE', 'HEALTH', 'OTHER') DEFAULT 'OTHER',
    tags JSON,  -- ["school", "schedule", "student"]
    label VARCHAR(100),  -- "Tài khoản chính", "Tài khoản phụ"
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    last_used_at DATETIME,
    usage_count INT DEFAULT 0,
    last_success BOOLEAN,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_service (user_id, service_name),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_last_used (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Vector Database Schema:

```json
{
  "id": "cred_123",
  "user_id": 1,
  "credential_id": 123,
  "service_name": "school_portal",
  "category": "EDUCATION",
  "purpose_embedding": [0.123, 0.456, ...],  // 768 dimensions
  "combined_text": "Xem thời khóa biểu trường học. Dùng để check lịch học hàng tuần.",
  "tags": ["school", "schedule", "timetable"],
  "metadata": {
    "service_type": "WEB",
    "is_active": true,
    "usage_count": 45
  }
}
```

---

## API Endpoints

### 1. Create Credential
```
POST /api/credentials
Body: {
  service_name, service_url, username, password,
  purpose, description, category, tags, label
}
```

### 2. List Credentials
```
GET /api/credentials
Query: ?category=EDUCATION&active=true
```

### 3. Search Credentials (AI)
```
POST /api/credentials/search
Body: {
  query: "Tôi muốn xem lịch học",
  context: "user đang hỏi về thời khóa biểu"
}
```

### 4. Get Credential Detail
```
GET /api/credentials/{id}
Query: ?decrypt=true  // Để lấy password đã decrypt
```

### 5. Update Credential
```
PUT /api/credentials/{id}
```

### 6. Delete Credential
```
DELETE /api/credentials/{id}
```

### 7. Use Credential (Log usage)
```
POST /api/credentials/{id}/use
Body: { action: "login", context: "..." }
```

---

## Performance Optimization

### 1. Caching Strategy:
- Redis cache cho frequently used credentials
- Cache embeddings để không phải re-generate
- TTL: 1 hour

### 2. Indexing:
- SQL: Index trên user_id, service_name, category, last_used_at
- Vector DB: HNSW index cho fast similarity search

### 3. Batch Operations:
- Bulk insert credentials
- Batch generate embeddings

### 4. Lazy Loading:
- Chỉ decrypt password khi thực sự cần
- Load embeddings on-demand

---

## Security Considerations

1. **Encryption at Rest**: AES-256 cho passwords
2. **Encryption in Transit**: HTTPS/TLS
3. **Access Control**: User chỉ access được credentials của mình
4. **Audit Log**: Log mọi access và modifications
5. **Rate Limiting**: Giới hạn số lần decrypt password
6. **Secret Management**: Encryption keys trong environment variables

---

## Migration Plan

### Phase 1: Extend Current System
- Rename `user_school_credentials` → `user_credentials`
- Add new columns: purpose, description, category, tags, label
- Migrate existing data

### Phase 2: Add Vector Database
- Setup vector database (Chroma/Pinecone/Weaviate)
- Generate embeddings cho existing credentials
- Implement semantic search API

### Phase 3: AI Integration
- Update AI Agent để sử dụng semantic search
- Implement context-aware credential selection
- Add usage tracking

---

## Comparison: Current vs Proposed

| Feature | Current (user_school_credentials) | Proposed (user_credentials) |
|---------|-----------------------------------|------------------------------|
| **Scope** | Chỉ cho trường học | Đa mục đích |
| **Số lượng** | 1 credential/user | Unlimited credentials/user |
| **AI Understanding** | Hardcoded logic | Semantic search |
| **Search** | Exact match only | Semantic + Exact |
| **Categorization** | None | Category + Tags |
| **Flexibility** | Low | High |
| **Scalability** | Limited | Excellent |

---

## Recommendation: HYBRID APPROACH

### ✅ Dùng SQL (MySQL) cho:
1. Primary storage - lưu trữ chính
2. Exact match queries - tìm theo ID, service_name
3. CRUD operations - tạo, đọc, cập nhật, xóa
4. Relationships - foreign keys
5. Transactions - đảm bảo consistency

### ✅ Dùng Vector Database cho:
1. Semantic search - AI tìm credential theo meaning
2. Context-aware retrieval - hiểu intent của user
3. Fuzzy matching - tìm gần đúng
4. Ranking - sắp xếp theo relevance

### 🎯 Kết luận:
**HYBRID là tối ưu nhất** vì:
- SQL đảm bảo data integrity và security
- Vector DB cung cấp AI-powered search
- Kết hợp cả hai cho best of both worlds
- Dễ maintain và scale

---

**Next Steps:**
1. Review requirements này
2. Tạo design document chi tiết
3. Implement database schema
4. Build APIs
5. Integrate với AI Agent
