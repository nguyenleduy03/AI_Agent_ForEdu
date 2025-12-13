-- School Credentials table for web scraping
-- Lưu tài khoản trường của sinh viên để Agent tự động login

CREATE TABLE IF NOT EXISTS user_school_credentials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    encrypted_username VARCHAR(500) NOT NULL,
    encrypted_password TEXT NOT NULL,
    school_url VARCHAR(500) NOT NULL,
    last_synced_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_school (user_id)
);

-- Note: Username and password are encrypted using AES-256
-- Only the Agent can decrypt and use them
