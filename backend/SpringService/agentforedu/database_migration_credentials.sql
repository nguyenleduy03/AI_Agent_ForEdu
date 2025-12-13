-- =====================================================
-- Universal Credential Manager - Database Migration
-- Database: agent_db
-- =====================================================

-- Make sure you're using the correct database
USE agent_db;

-- Step 1: Create new user_credentials table
CREATE TABLE IF NOT EXISTS user_credentials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    
    -- Service info
    service_name VARCHAR(100) NOT NULL COMMENT 'Tên dịch vụ: school_portal, netflix, facebook...',
    service_url VARCHAR(500) COMMENT 'URL của dịch vụ',
    service_type ENUM('WEB', 'API', 'APP', 'OTHER') DEFAULT 'WEB',
    
    -- Credentials (encrypted)
    encrypted_username VARCHAR(500) NOT NULL COMMENT 'Username đã mã hóa',
    encrypted_password TEXT NOT NULL COMMENT 'Password đã mã hóa AES-256',
    
    -- Metadata for AI
    purpose TEXT NOT NULL COMMENT 'Mục đích sử dụng: "Xem thời khóa biểu", "Watch movies"...',
    description TEXT COMMENT 'Mô tả chi tiết cách sử dụng credential',
    
    -- Organization
    category ENUM('EDUCATION', 'ENTERTAINMENT', 'SOCIAL', 'WORK', 'FINANCE', 'HEALTH', 'OTHER') DEFAULT 'OTHER',
    tags JSON COMMENT 'Array of tags: ["school", "schedule", "student"]',
    label VARCHAR(100) COMMENT 'Nhãn phân biệt: "Tài khoản chính", "Tài khoản phụ"',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    last_used_at DATETIME COMMENT 'Lần cuối sử dụng',
    usage_count INT DEFAULT 0 COMMENT 'Số lần đã sử dụng',
    last_success BOOLEAN COMMENT 'Lần sử dụng cuối có thành công không',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_service (user_id, service_name),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_last_used (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Migrate data from user_school_credentials to user_credentials
INSERT INTO user_credentials (
    user_id,
    service_name,
    service_url,
    service_type,
    encrypted_username,
    encrypted_password,
    purpose,
    description,
    category,
    tags,
    label,
    is_active,
    created_at,
    updated_at
)
SELECT 
    user_id,
    'school_portal' as service_name,
    'https://school.example.com' as service_url,
    'WEB' as service_type,
    encrypted_username,
    encrypted_password,
    'Xem thời khóa biểu và thông tin học tập' as purpose,
    'Tài khoản trường học để tra cứu lịch học, điểm số, thông báo' as description,
    'EDUCATION' as category,
    JSON_ARRAY('school', 'schedule', 'education') as tags,
    'Tài khoản trường học' as label,
    TRUE as is_active,
    created_at,
    updated_at
FROM user_school_credentials
WHERE NOT EXISTS (
    SELECT 1 FROM user_credentials uc 
    WHERE uc.user_id = user_school_credentials.user_id 
    AND uc.service_name = 'school_portal'
);

-- Step 3: Create credential usage log table
CREATE TABLE IF NOT EXISTS credential_usage_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    credential_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'login, view, update, delete',
    context TEXT COMMENT 'Context khi sử dụng credential',
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (credential_id) REFERENCES user_credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_credential (credential_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create credential sharing table (optional feature)
CREATE TABLE IF NOT EXISTS credential_shares (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    credential_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL COMMENT 'User sở hữu credential',
    shared_with_user_id BIGINT NOT NULL COMMENT 'User được share',
    permission ENUM('READ', 'USE') DEFAULT 'USE' COMMENT 'READ: chỉ xem, USE: có thể sử dụng',
    expires_at DATETIME COMMENT 'Thời gian hết hạn share',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME,
    
    FOREIGN KEY (credential_id) REFERENCES user_credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_share (credential_id, shared_with_user_id),
    INDEX idx_shared_with (shared_with_user_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Add indexes for performance
CREATE INDEX idx_purpose_fulltext ON user_credentials(purpose(255));
CREATE INDEX idx_service_category ON user_credentials(service_name, category);

-- Step 6: Create view for easy querying
CREATE OR REPLACE VIEW v_user_credentials_summary AS
SELECT 
    uc.id,
    uc.user_id,
    u.username,
    uc.service_name,
    uc.service_url,
    uc.category,
    uc.label,
    uc.purpose,
    uc.is_active,
    uc.last_used_at,
    uc.usage_count,
    uc.created_at,
    COUNT(DISTINCT cs.id) as share_count
FROM user_credentials uc
JOIN users u ON uc.user_id = u.id
LEFT JOIN credential_shares cs ON uc.id = cs.credential_id AND cs.is_active = TRUE
GROUP BY uc.id;

-- Verification queries
SELECT 'Total credentials' as metric, COUNT(*) as value FROM user_credentials
UNION ALL
SELECT 'Active credentials', COUNT(*) FROM user_credentials WHERE is_active = TRUE
UNION ALL
SELECT 'Credentials by category - EDUCATION', COUNT(*) FROM user_credentials WHERE category = 'EDUCATION'
UNION ALL
SELECT 'Migrated from school_credentials', COUNT(*) FROM user_credentials WHERE service_name = 'school_portal';
