# 🚀 Setup MySQL Chat - Hướng dẫn nhanh

## ⚡ Quick Start (3 bước)

### 1. Cài đặt MySQL connector
```bash
cd backend/PythonService
pip install mysql-connector-python==8.2.0
```

### 2. Kiểm tra file `.env` đã có:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=1111
MYSQL_DATABASE=Agent_Db
```

### 3. Test kết nối
```bash
python test_mysql_course.py
```

Nếu thấy `✅ Connected to MySQL successfully!` → OK!

---

## 🧪 Test Chat

### Khởi động service:
```bash
python main.py
```

### Kiểm tra log:
```
✅ MySQL Course Service available
✅ MySQL Course Service initialized
```

### Test trong chat:
- "Tìm khóa học về Python"
- "Bạn có khóa học gì?"
- "Khóa học về AI"

---

## ❌ Troubleshooting

### Lỗi: "MySQL connection error"

**Fix:**
```bash
# Windows
net start MySQL80

# Kiểm tra password trong .env
MYSQL_PASSWORD=1111  # Đúng chưa?
```

### Lỗi: "No module named 'mysql.connector'"

**Fix:**
```bash
pip install mysql-connector-python==8.2.0
```

### Không tìm thấy khóa học

**Fix:** Tạo khóa học mới qua frontend hoặc:
```bash
# Import dữ liệu mẫu
mysql -u root -p Agent_Db < insert_demo_data.sql
```

---

## 📚 Đọc thêm

- [MYSQL_COURSE_GUIDE.md](MYSQL_COURSE_GUIDE.md) - Hướng dẫn chi tiết
- [mysql_course_service.py](mysql_course_service.py) - Source code

---

**Xong! Giờ chatbot có thể truy vấn trực tiếp MySQL database! 🎉**
