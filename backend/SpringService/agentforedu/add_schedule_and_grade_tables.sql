-- Add Schedule and Grade tables for Agent features

-- User Schedules (Thời khóa biểu)
CREATE TABLE IF NOT EXISTS user_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(255) NOT NULL,
    room VARCHAR(100),
    teacher VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_day (user_id, day_of_week)
);

-- User Grades (Điểm số)
CREATE TABLE IF NOT EXISTS user_grades (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    grade_type VARCHAR(50) NOT NULL,
    grade DECIMAL(4,2) NOT NULL,
    max_grade DECIMAL(4,2) DEFAULT 10.00,
    semester VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_user_course (user_id, course_id)
);

-- User Contacts (Danh bạ - cho email)
CREATE TABLE IF NOT EXISTS user_contacts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Insert sample data for testing
-- Sample schedules for user_id = 6 (testuser123)
INSERT INTO user_schedules (user_id, day_of_week, start_time, end_time, subject, room, teacher) VALUES
(6, 'MONDAY', '08:00:00', '10:00:00', 'Python Programming', '301', 'Thầy Nguyễn'),
(6, 'MONDAY', '10:15:00', '12:00:00', 'Database Systems', '205', 'Thầy Trần'),
(6, 'TUESDAY', '08:00:00', '10:00:00', 'Web Development', '102', 'Cô Lê'),
(6, 'TUESDAY', '14:00:00', '16:00:00', 'Machine Learning', '401', 'Thầy Phạm'),
(6, 'WEDNESDAY', '08:00:00', '10:00:00', 'Python Programming', '301', 'Thầy Nguyễn'),
(6, 'THURSDAY', '10:15:00', '12:00:00', 'Database Systems', '205', 'Thầy Trần'),
(6, 'FRIDAY', '08:00:00', '10:00:00', 'Web Development', '102', 'Cô Lê');

-- Sample grades for user_id = 6
INSERT INTO user_grades (user_id, course_id, grade_type, grade, semester) VALUES
(6, 1, 'MIDTERM', 8.5, '2024-1'),
(6, 1, 'FINAL', 9.0, '2024-1'),
(6, 2, 'MIDTERM', 7.5, '2024-1'),
(6, 2, 'FINAL', 8.0, '2024-1');

-- Sample contacts for user_id = 6
INSERT INTO user_contacts (user_id, contact_name, contact_email, contact_type) VALUES
(6, 'Thầy Nguyễn', 'nguyen.teacher@school.edu.vn', 'TEACHER'),
(6, 'Thầy Trần', 'tran.teacher@school.edu.vn', 'TEACHER'),
(6, 'Cô Lê', 'le.teacher@school.edu.vn', 'TEACHER');
