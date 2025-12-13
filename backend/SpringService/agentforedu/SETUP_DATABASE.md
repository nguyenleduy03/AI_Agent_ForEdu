# 🚀 HƯỚNG DẪN SETUP DATABASE

## 📦 YÊU CẦU

- MySQL 8.0+ đã cài đặt
- Java 17+
- Maven 3.6+

---

## ⚡ CÁCH 1: TỰ ĐỘNG (Khuyến nghị)

Spring Boot sẽ tự động tạo tất cả các bảng khi khởi động.

### Bước 1: Tạo database

```sql
CREATE DATABASE IF NOT EXISTS Agent_Db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Chạy Spring Boot

```cmd
cd backend\SpringService\agentforedu
mvn spring-boot:run
```

✅ **Xong!** Tất cả 11 bảng sẽ được tạo tự động.

---

## 🔧 CÁCH 2: THỦ CÔNG (Nếu cần)

### Bước 1: Chạy SQL script

```bash
mysql -u root -p < database_schema.sql
```

Hoặc trong MySQL Workbench:
1. Mở file `database_schema.sql`
2. Execute script

### Bước 2: Kiểm tra

```sql
USE Agent_Db;
SHOW TABLES;
```

Kết quả sẽ hiển thị 11 bảng:
```
+---------------------+
| Tables_in_Agent_Db  |
+---------------------+
| chat_messages       |
| chat_sessions       |
| courses             |
| lessons             |
| materials           |
| quiz_questions      |
| quiz_results        |
| quizzes             |
| rag_documents       |
| system_logs         |
| users               |
+---------------------+
```

---

## 👤 TÀI KHOẢN MẪU

Script đã tạo sẵn 3 tài khoản:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin | admin123 | ADMIN | admin@example.com |
| teacher1 | teacher123 | TEACHER | teacher@example.com |
| student1 | student123 | STUDENT | student@example.com |

### Test đăng nhập qua Swagger:

1. Mở: http://localhost:8080/swagger-ui/index.html
2. Endpoint: `POST /api/auth/login`
3. Body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

## 🔍 KIỂM TRA DATABASE

### Xem cấu trúc bảng users:

```sql
DESCRIBE users;
```

### Xem dữ liệu users:

```sql
SELECT id, username, email, role, full_name, created_at FROM users;
```

### Đếm số bảng:

```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'Agent_Db';
```

---

## 🛠️ XỬ LÝ LỖI

### Lỗi: "Access denied for user 'root'@'localhost'"

**Giải pháp:** Kiểm tra password trong `application.yaml`

```yaml
spring:
  datasource:
    username: root
    password: "1111"  # Đổi thành password MySQL của bạn
```

### Lỗi: "Unknown database 'Agent_Db'"

**Giải pháp:** Tạo database thủ công

```sql
CREATE DATABASE Agent_Db;
```

### Lỗi: "Table already exists"

**Giải pháp:** Drop database và tạo lại

```sql
DROP DATABASE Agent_Db;
CREATE DATABASE Agent_Db;
```

---

## 🔄 RESET DATABASE

Nếu muốn xóa toàn bộ dữ liệu và bắt đầu lại:

```sql
DROP DATABASE IF EXISTS Agent_Db;
CREATE DATABASE Agent_Db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Sau đó chạy lại Spring Boot hoặc SQL script.

---

## 📊 BACKUP & RESTORE

### Backup:

```bash
mysqldump -u root -p Agent_Db > backup_$(date +%Y%m%d).sql
```

### Restore:

```bash
mysql -u root -p Agent_Db < backup_20251206.sql
```

---

## 🎯 NEXT STEPS

Sau khi setup database xong:

1. ✅ Chạy Spring Boot: `mvn spring-boot:run`
2. ✅ Test API qua Swagger: http://localhost:8080/swagger-ui/index.html
3. ✅ Đăng ký user mới hoặc dùng tài khoản mẫu
4. ✅ Chạy FastAPI: `python main.py`
5. ✅ Test RAG: http://localhost:8000/docs

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. Kiểm tra MySQL đã chạy: `mysql -u root -p`
2. Kiểm tra port 3306: `netstat -an | findstr 3306`
3. Xem log Spring Boot để biết lỗi cụ thể
4. Đọc file `DATABASE_DESIGN.md` để hiểu cấu trúc

---

**Happy Coding! 🚀**
