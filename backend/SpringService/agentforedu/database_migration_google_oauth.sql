-- Migration: Add Google OAuth fields to users table
-- Date: 2024-12-09
-- Purpose: Store user's Google OAuth tokens for Google Cloud API access

-- Add Google OAuth columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP,
ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_connected ON users(google_connected);
CREATE INDEX IF NOT EXISTS idx_users_google_token_expiry ON users(google_token_expiry);

-- Add comments
COMMENT ON COLUMN users.google_access_token IS 'Encrypted Google OAuth access token';
COMMENT ON COLUMN users.google_refresh_token IS 'Encrypted Google OAuth refresh token';
COMMENT ON COLUMN users.google_token_expiry IS 'When the access token expires';
COMMENT ON COLUMN users.google_connected IS 'Whether user has connected their Google account';
COMMENT ON COLUMN users.google_email IS 'User''s Google email address';

-- Create table for OAuth usage logs (optional - for analytics)
CREATE TABLE IF NOT EXISTS google_oauth_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_name VARCHAR(100) NOT NULL, -- 'vision', 'translation', 'speech', etc.
    action VARCHAR(100) NOT NULL, -- 'analyze_image', 'translate_text', etc.
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_oauth_logs_user_id (user_id),
    INDEX idx_oauth_logs_created_at (created_at),
    INDEX idx_oauth_logs_api_name (api_name)
);

COMMENT ON TABLE google_oauth_usage_logs IS 'Logs of Google Cloud API usage via OAuth';

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
