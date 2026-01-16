# 🗄️ MySQL Course Service - Hướng dẫn sử dụng

## 📌 Tổng quan

Chatbot giờ đây truy vấn **trực tiếp vào MySQL database** thay vì qua ChromaDB vector search. Điều này giúp:

✅ **Dữ liệu real-time** - Luôn lấy thông tin mới nhất từ database  
✅ **Không cần sync** - Không cần chạy sync_courses_to_rag  
✅ **Chính xác hơn** - Truy vấn SQL chính xác, không phụ thuộc embedding  
✅ **Nhanh hơn** - Không cần tính toán vector similarity  

---

## 🚀 Cài đặt

### 1. Cài đặt MySQL connector

```bash
cd backend/PythonService
pip install mysql-connector-python==8.2.0
```

### 2. Cấu hình database trong `.env`

File `.env` đã được cập nhật với:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=1111
MYSQL_DATABASE=Agent_Db
```

**Lưu ý:** Đảm bảo thông tin khớp với `application.yaml` của Spring Boot!

### 3. Khởi động lại Python service

```bash
python main.py
# hoặc
py -3.11 main_with_rag.py
```

Bạn sẽ thấy:
```
✅ MySQL Course Service available
✅ MySQL Course Service initialized
```

---

## 💬 Cách sử dụng trong Chat

### Ví dụ câu hỏi:

1. **Tìm khóa học theo từ khóa:**
   - "Tìm khóa học về Python"
   - "Có khóa học nào về Machine Learning không?"
   - "Khóa học về AI"

2. **Hỏi chung:**
   - "Bạn có khóa học gì?"
   - "Cho tôi xem các khóa học"
   - "Danh sách khóa học"

3. **Hỏi về chủ đề:**
   - "Tôi muốn học lập trình"
   - "Dạy tôi về Data Science"
   - "Hướng dẫn về Web Development"

### Chatbot sẽ:

1. **Phát hiện intent** - Nhận biết bạn đang hỏi về khóa học
2. **Truy vấn MySQL** - Tìm kiếm trực tiếp trong database
3. **Trả về kết quả** - Hiển thị khóa học với đầy đủ thông tin:
   - Tên khóa học
   - Mô tả
   - Giảng viên
   - Số học viên
   - Số bài học
   - ID khóa học

---

## 🔍 Các loại truy vấn được hỗ trợ

### 1. Search by keyword
```python
mysql_course_service.search_courses("Python", limit=10)
```
Tìm trong `title` và `description`

### 2. Get all courses
```python
mysql_course_service.get_all_courses(limit=50)
```
Lấy tất cả khóa học public

### 3. Get popular courses
```python
mysql_course_service.get_popular_courses(limit=10)
```
Sắp xếp theo số học viên

### 4. Get by creator
```python
mysql_course_service.get_courses_by_creator("teacher_name")
```
Tìm khóa học của giảng viên

### 5. Get course details
```python
mysql_course_service.get_course_by_id(1)
```
Lấy chi tiết 1 khóa học

### 6. Get lessons
```python
mysql_course_service.get_lessons_by_course(1)
```
Lấy bài học của khóa học

---

## 📊 Ví dụ Response

### Input:
```
User: "Tìm khóa học về Python"
```

### Output:
```
Tìm thấy 3 khóa học:

1. **Python cơ bản cho người mới bắt đầu** (ID: 1)
📝 Mô tả: Khóa học Python từ cơ bản đến nâng cao, phù hợp cho người mới...
👨‍🏫 Giảng viên: Nguyễn Văn A
👥 Học viên: 150 | 📚 Bài học: 20

2. **Python nâng cao - Machine Learning** (ID: 5)
📝 Mô tả: Học Python để làm Machine Learning, bao gồm NumPy, Pandas...
👨‍🏫 Giảng viên: Trần Thị B
👥 Học viên: 89 | 📚 Bài học: 15

3. **Python Web Development với Django** (ID: 8)
📝 Mô tả: Xây dựng website với Django framework...
👨‍🏫 Giảng viên: Lê Văn C
👥 Học viên: 67 | 📚 Bài học: 18
```

---

## 🔧 Troubleshooting

### Lỗi: "MySQL connection error"

**Nguyên nhân:** Không kết nối được MySQL

**Giải pháp:**
1. Kiểm tra MySQL đang chạy:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. Kiểm tra thông tin trong `.env`:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=1111  # Đúng password?
   MYSQL_DATABASE=Agent_Db  # Database tồn tại?
   ```

3. Test kết nối:
   ```bash
   mysql -u root -p -h localhost
   ```

### Lỗi: "No module named 'mysql.connector'"

**Giải pháp:**
```bash
pip install mysql-connector-python==8.2.0
```

### Không tìm thấy khóa học

**Nguyên nhân:** Database chưa có dữ liệu

**Giải pháp:**
1. Tạo khóa học qua frontend hoặc API
2. Hoặc import dữ liệu mẫu:
   ```bash
   mysql -u root -p Agent_Db < insert_demo_data.sql
   ```

---

## 🆚 So sánh: MySQL vs ChromaDB

| Tiêu chí | MySQL Direct | ChromaDB RAG |
|----------|-------------|--------------|
| **Tốc độ** | ⚡ Nhanh | 🐢 Chậm hơn |
| **Độ chính xác** | ✅ 100% | ⚠️ Phụ thuộc embedding |
| **Real-time** | ✅ Luôn mới nhất | ❌ Cần sync |
| **Setup** | ✅ Đơn giản | ⚠️ Phức tạp |
| **Semantic search** | ❌ Không có | ✅ Có |
| **Keyword search** | ✅ Chính xác | ⚠️ Có thể sai |

**Kết luận:** MySQL Direct tốt hơn cho hầu hết trường hợp!

---

## 📝 Code Example

### Test MySQL service:

```bash
cd backend/PythonService
python mysql_course_service.py
```

### Sử dụng trong code:

```python
from mysql_course_service import get_mysql_course_service

# Get service
service = get_mysql_course_service()

# Search courses
courses = service.search_courses("Python", limit=10)

# Format for chat
response = service.format_courses_for_chat(courses)
print(response)
```

---

## ✅ Checklist

- [x] Cài đặt `mysql-connector-python`
- [x] Cấu hình `.env` với thông tin MySQL
- [x] Khởi động lại Python service
- [x] Test chat với câu hỏi về khóa học
- [x] Kiểm tra log: "✅ MySQL Course Service initialized"

---

**Version:** 1.0.0  
**Last Updated:** January 16, 2026  
**Author:** Agent For Edu Team
