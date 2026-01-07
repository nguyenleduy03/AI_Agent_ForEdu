# 👥 TẠO USER DEMO

## 📋 DANH SÁCH USER MẪU

### 1. Admin (Tự động tạo)
```
Username: admin
Password: admin123
Email: admin@agentforedu.com
Role: ADMIN
```

### 2. Teachers (3 người)
```
Username: teacher1
Password: teacher123
Email: teacher1@agentforedu.com
Full Name: Nguyễn Văn A
Role: TEACHER

Username: teacher2
Password: teacher123
Email: teacher2@agentforedu.com
Full Name: Trần Thị B
Role: TEACHER

Username: teacher3
Password: teacher123
Email: teacher3@agentforedu.com
Full Name: Lê Văn C
Role: TEACHER
```

### 3. Students (5 người)
```
Username: student1
Password: student123
Email: student1@agentforedu.com
Full Name: Phạm Văn D
Role: STUDENT

Username: student2
Password: student123
Email: student2@agentforedu.com
Full Name: Hoàng Thị E
Role: STUDENT

Username: student3
Password: student123
Email: student3@agentforedu.com
Full Name: Vũ Văn F
Role: STUDENT

Username: student4
Password: student123
Email: student4@agentforedu.com
Full Name: Đỗ Thị G
Role: STUDENT

Username: student5
Password: student123
Email: student5@agentforedu.com
Full Name: Bùi Văn H
Role: STUDENT
```

### 4. Regular Users (2 người)
```
Username: user1
Password: user123
Email: user1@agentforedu.com
Full Name: Ngô Văn I
Role: USER

Username: user2
Password: user123
Email: user2@agentforedu.com
Full Name: Đinh Thị K
Role: USER
```

---

## 🚀 CÁCH TẠO

### Cách 1: Chạy SQL Script (Khuyến nghị)

```bash
# Vào MySQL
mysql -u root -p

# Chạy script
source create-demo-users.sql

# Hoặc
mysql -u root -p Agent_Db < create-demo-users.sql
```

### Cách 2: Copy-Paste vào MySQL Workbench

1. Mở MySQL Workbench
2. Connect vào database
3. Mở file `create-demo-users.sql`
4. Click "Execute" (⚡ icon)

### Cách 3: Qua Command Line

```bash
mysql -u root -p -e "source create-demo-users.sql"
```

---

## ✅ VERIFY

### Kiểm tra user đã được tạo:

```sql
USE Agent_Db;

SELECT 
    id,
    username,
    email,
    full_name,
    role,
    created_at
FROM users
ORDER BY 
    FIELD(role, 'ADMIN', 'TEACHER', 'STUDENT', 'USER'),
    username;
```

### Đếm số lượng:

```sql
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY FIELD(role, 'ADMIN', 'TEACHER', 'STUDENT', 'USER');
```

**Kết quả mong đợi:**
```
ADMIN    : 1
TEACHER  : 3
STUDENT  : 5
USER     : 2
Total    : 11
```

---

## 🧪 TEST LOGIN

### Test Admin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Test Teacher
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher1",
    "password": "teacher123"
  }'
```

### Test Student
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "student123"
  }'
```

---

## 🔐 PASSWORD HASHES

Tất cả passwords đã được mã hóa bằng BCrypt:

| Plain Text | BCrypt Hash |
|------------|-------------|
| admin123 | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| teacher123 | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| student123 | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| user123 | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |

**Lưu ý:** Trong ví dụ này, tất cả đều dùng cùng 1 hash để đơn giản. Trên production nên dùng hash khác nhau.

---

## 🎯 USE CASES

### Testing Teacher Features
```
Login as: teacher1 / teacher123
- Tạo course
- Tạo lesson
- Upload materials
- Tạo quiz
- Xem students
```

### Testing Student Features
```
Login as: student1 / student123
- Enroll course
- Xem lessons
- Làm quiz
- Track progress
- Chat với AI
```

### Testing Admin Features
```
Login as: admin / admin123
- Quản lý users
- Xem tất cả courses
- Xem statistics
- Manage system
```

---

## 🗑️ XÓA DEMO USERS

Nếu muốn xóa tất cả demo users:

```sql
-- Xóa tất cả users trừ admin
DELETE FROM users WHERE username != 'admin';

-- Hoặc xóa từng loại
DELETE FROM users WHERE role = 'TEACHER';
DELETE FROM users WHERE role = 'STUDENT';
DELETE FROM users WHERE role = 'USER';
```

---

## 🔄 RESET PASSWORD

Reset password về mặc định:

```sql
-- Reset teacher1 password về "teacher123"
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE username = 'teacher1';

-- Reset tất cả students về "student123"
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE role = 'STUDENT';
```

---

## 📝 TẠO USER MỚI

### Qua SQL

```sql
INSERT INTO users (username, password, email, full_name, role, created_at, updated_at)
VALUES (
    'newuser',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'newuser@example.com',
    'New User Name',
    'STUDENT',
    NOW(),
    NOW()
);
```

### Qua API

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "email": "newuser@example.com",
    "fullName": "New User Name",
    "role": "STUDENT"
  }'
```

---

## 🛠️ TROUBLESHOOTING

### User đã tồn tại?

Script sử dụng `WHERE NOT EXISTS` nên sẽ không tạo duplicate.

```sql
-- Check user exists
SELECT * FROM users WHERE username = 'teacher1';
```

### Password không đúng?

Verify BCrypt hash:

```sql
-- Check password hash
SELECT username, password FROM users WHERE username = 'teacher1';
```

Hash phải là: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

---

## 📊 STATISTICS

Sau khi tạo xong, bạn sẽ có:

```
Total Users: 11
├── Admin: 1
├── Teachers: 3
├── Students: 5
└── Users: 2
```

---

**Tạo**: 2026-01-07  
**Status**: ✅ READY TO USE  
**Purpose**: Development & Testing
