# 🎨 DEMO DATA - SQL INSERT

## 📋 Tổng Quan

File SQL này insert **demo data đầy đủ** trực tiếp vào database MySQL:
- ✅ **6 khóa học** với nội dung chi tiết
- ✅ **17 bài học** với markdown formatting
- ✅ **Code examples** thực tế
- ✅ **Bài tập** cho mỗi bài học

---

## 🚀 Quick Start (2 bước)

### Bước 1: Chạy Script
```bash
cd backend/SpringService/agentforedu
run-demo-data.cmd
```

### Bước 2: Nhập Password
```
Enter MySQL password: 1111
```

**Done!** 🎉

---

## 📚 Khóa Học Được Tạo

### 1. 🐍 Python (5 bài học)
- Giới thiệu Python
- Biến và kiểu dữ liệu
- Cấu trúc điều kiện
- Vòng lặp
- List, Tuple, Dictionary

### 2. ☕ Java Spring Boot (3 bài học)
- Giới thiệu Spring Boot
- REST API và CRUD
- JPA và Database

### 3. ⚛️ React (3 bài học)
- Giới thiệu React và JSX
- State và Hooks
- React Router

### 4. 🤖 Machine Learning (3 bài học)
- Giới thiệu ML
- Linear Regression
- Classification

### 5. 🗄️ SQL Database (3 bài học)
- SQL cơ bản
- JOIN và Relationships
- Database Design

### 6. 🎨 UI/UX Design (2 bài học)
- Nguyên tắc thiết kế
- Wireframing và Prototyping

**Total:** 6 khóa học, 17 bài học

---

## 🛠️ Cách Sử Dụng

### Option 1: Script Tự Động (Dễ nhất) ⭐
```bash
cd backend/SpringService/agentforedu
run-demo-data.cmd
```

### Option 2: MySQL Command Line
```bash
mysql -u root -p Agent_Db < insert_demo_data.sql
```

### Option 3: MySQL Workbench
1. Mở MySQL Workbench
2. File → Open SQL Script
3. Chọn `insert_demo_data.sql`
4. Execute (⚡ icon)

### Option 4: phpMyAdmin
1. Truy cập phpMyAdmin
2. Chọn database `Agent_Db`
3. Tab "SQL"
4. Copy-paste nội dung file
5. Click "Go"

---

## ⚙️ Configuration

### Database Settings
```sql
Database: Agent_Db
User: root
Password: 1111  (thay đổi trong script nếu khác)
```

### Thay đổi password
Mở `run-demo-data.cmd` và sửa:
```cmd
set /p password="Enter MySQL password: "
```

### Thay đổi user
```bash
mysql -u your_username -p Agent_Db < insert_demo_data.sql
```

---

## 🔍 Verify Data

### Kiểm tra trong MySQL
```sql
USE Agent_Db;

-- Đếm courses
SELECT COUNT(*) FROM courses WHERE created_by = 1;

-- Đếm lessons
SELECT COUNT(*) FROM lessons;

-- Xem chi tiết
SELECT 
    c.title as course_title,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
WHERE c.created_by = 1
GROUP BY c.id, c.title;
```

### Kiểm tra trên Frontend
```
1. Start backend: ./mvnw spring-boot:run
2. Start frontend: npm start
3. Truy cập: http://localhost:3000
4. Xem danh sách khóa học
```

---

## 🗑️ Xóa Demo Data

### Xóa tất cả
```sql
USE Agent_Db;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE created_by = 1);
DELETE FROM courses WHERE created_by = 1;
SET FOREIGN_KEY_CHECKS = 1;
```

### Xóa từng khóa học
```sql
DELETE FROM courses WHERE id = 1;  -- Cascade sẽ xóa lessons
```

---

## 🐛 Troubleshooting

### ❌ ERROR 1045: Access denied
**Nguyên nhân:** Sai username/password

**Giải pháp:**
```bash
# Kiểm tra password trong application.yaml
cat src/main/resources/application.yaml

# Hoặc reset password MySQL
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
```

### ❌ ERROR 1049: Unknown database
**Nguyên nhân:** Database chưa tạo

**Giải pháp:**
```sql
CREATE DATABASE Agent_Db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ❌ ERROR 1062: Duplicate entry
**Nguyên nhân:** Data đã tồn tại

**Giải pháp:**
```sql
-- Xóa data cũ trước
DELETE FROM lessons;
DELETE FROM courses WHERE created_by = 1;

-- Hoặc chạy lại script (có DELETE trong file)
```

### ❌ ERROR 1452: Foreign key constraint
**Nguyên nhân:** User với id=1 không tồn tại

**Giải pháp:**
```sql
-- Kiểm tra admin user
SELECT * FROM users WHERE id = 1;

-- Nếu không có, tạo admin
INSERT INTO users (username, password, email, role, full_name) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 
 'admin@example.com', 'ADMIN', 'Administrator');
```

---

## 📊 File Structure

```
backend/SpringService/agentforedu/
├── insert_demo_data.sql       # SQL file chính ⭐
├── run-demo-data.cmd          # Script tự động
├── DEMO_DATA_README.md        # Hướng dẫn (file này)
└── database_schema.sql        # Schema gốc
```

---

## 🎯 Best Practices

### 1. Backup trước khi chạy
```bash
mysqldump -u root -p Agent_Db > backup_$(date +%Y%m%d).sql
```

### 2. Test trên dev database trước
```sql
CREATE DATABASE Agent_Db_Test;
mysql -u root -p Agent_Db_Test < insert_demo_data.sql
```

### 3. Verify sau khi insert
```sql
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM lessons;
```

### 4. Check foreign keys
```sql
SELECT * FROM courses WHERE created_by NOT IN (SELECT id FROM users);
```

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Thời gian chạy | ~2 giây |
| Courses inserted | 6 |
| Lessons inserted | 17 |
| Total queries | ~24 |

---

## ✅ Success Checklist

Sau khi chạy script thành công:

- [ ] Script chạy không lỗi
- [ ] Console hiển thị "SUCCESS!"
- [ ] `SELECT COUNT(*) FROM courses` → 6
- [ ] `SELECT COUNT(*) FROM lessons` → 17
- [ ] Frontend hiển thị khóa học
- [ ] Bài học có nội dung đầy đủ
- [ ] Markdown rendering đúng

---

## 🎉 Kết Quả

Sau khi chạy script, bạn sẽ có:

### Database
- ✅ 6 khóa học đầy đủ
- ✅ 17 bài học với nội dung
- ✅ Markdown formatting
- ✅ Code examples
- ✅ Bài tập thực hành

### Frontend
- ✅ Danh sách khóa học
- ✅ Chi tiết từng khóa học
- ✅ Bài học với markdown rendering
- ✅ Code syntax highlighting

### Ready to Demo
- ✅ Trông chuyên nghiệp
- ✅ Nội dung thực tế
- ✅ Sẵn sàng present

---

## 🔄 So Sánh với API Script

| Feature | SQL Insert | API Script |
|---------|-----------|------------|
| **Tốc độ** | ⚡ Rất nhanh (2s) | 🐌 Chậm hơn (30s) |
| **Dependencies** | ❌ Không cần | ✅ Cần Python, requests |
| **Backend** | ❌ Không cần chạy | ✅ Phải chạy backend |
| **Authentication** | ❌ Không cần | ✅ Cần login |
| **Direct DB** | ✅ Trực tiếp | ❌ Qua API |
| **Rollback** | ✅ Dễ dàng | ❌ Khó hơn |

**Khuyến nghị:** Dùng SQL Insert cho nhanh và đơn giản! ⭐

---

## 📞 Support

Nếu gặp vấn đề:
1. Check MySQL đang chạy
2. Verify username/password
3. Check database tồn tại
4. Xem Troubleshooting section
5. Check logs

---

**Happy Demo! 🚀**

*Last updated: 2025-12-09*
