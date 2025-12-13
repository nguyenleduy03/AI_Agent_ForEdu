-- Migration: Add Google OAuth fields to users table (MySQL)
-- Date: 2024-12-09
-- Purpose: Store user's Google OAuth tokens for Google Cloud API access

-- Add Google OAuth columns to users table
ALTER TABLE users 
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_token_expiry DATETIME,
ADD COLUMN google_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN google_email VARCHAR(255);

-- Create indexes for faster lookups
CREATE INDEX idx_users_google_connected ON users(google_connected);
CREATE INDEX idx_users_google_token_expiry ON users(google_token_expiry);

-- Create table for OAuth usage logs (optional - for analytics)
CREATE TABLE IF NOT EXISTS google_oauth_usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    api_name VARCHAR(100) NOT NULL COMMENT 'vision, translation, speech, etc.',
    action VARCHAR(100) NOT NULL COMMENT 'analyze_image, translate_text, etc.',
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_oauth_logs_user_id (user_id),
    INDEX idx_oauth_logs_created_at (created_at),
    INDEX idx_oauth_logs_api_name (api_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs of Google Cloud API usage via OAuth';

-- Verify the changes
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME LIKE 'google%'
ORDER BY ORDINAL_POSITION;

-- Sample query to check OAuth status
-- SELECT 
--     id, 
--     username, 
--     email,
--     google_connected,
--     google_email,
--     google_token_expiry,
--     CASE 
--         WHEN google_token_expiry < NOW() THEN 'Expired'
--         WHEN google_token_expiry > NOW() THEN 'Valid'
--         ELSE 'Not Connected'
--     END as token_status
-- FROM users
-- WHERE google_connected = TRUE;

-- Sample query to get OAuth usage stats
-- SELECT 
--     u.username,
--     COUNT(*) as total_requests,
--     SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
--     api_name,
--     DATE(created_at) as date
-- FROM google_oauth_usage_logs l
-- JOIN users u ON l.user_id = u.id
-- GROUP BY u.username, api_name, DATE(created_at)
-- ORDER BY date DESC, total_requests DESC;
