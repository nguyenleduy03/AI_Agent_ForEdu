# 🔄 CÁCH LẤY DỮ LIỆU KHÓA HỌC - GIẢI THÍCH CHI TIẾT

## 📌 TL;DR - Trả lời ngắn gọn:

**Lấy dữ liệu REAL-TIME mỗi khi user hỏi!** ✅

---

## 🎯 Luồng hoạt động chi tiết:

### 1️⃣ **Khi khởi động service (python main.py)**

```python
# Chỉ khởi tạo service, CHƯA lấy dữ liệu
mysql_course_service = get_mysql_course_service()
print("✅ MySQL Course Service initialized")
```

**Điều gì xảy ra:**
- ✅ Tạo object MySQLCourseService
- ✅ Lưu thông tin kết nối (host, port, user, password)
- ❌ CHƯA kết nối database
- ❌ CHƯA lấy dữ liệu khóa học

---

### 2️⃣ **Khi user hỏi về khóa học**

```
User: "Tìm khóa học về Python"
  ↓
Frontend gửi request với use_rag=true
  ↓
FastAPI nhận request
  ↓
detect_course_search_intent() → True
  ↓
handle_course_search("Tìm khóa học về Python")
  ↓
mysql_course_service.search_courses("Python")
  ↓
[BẮT ĐẦU LẤY DỮ LIỆU REAL-TIME]
```

---

### 3️⃣ **Bên trong search_courses()**

```python
def search_courses(self, query: str, limit: int = 10):
    # Bước 1: Kết nối database (nếu chưa kết nối)
    if not self.connect():
        return []
    
    # Bước 2: Thực thi SQL query NGAY LẬP TỨC
    sql = """
        SELECT 
            c.id,
            c.title,
            c.description,
            u.username as creator_name,
            COUNT(DISTINCT e.id) as enrollment_count,
            COUNT(DISTINCT l.id) as lesson_count
        FROM courses c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN course_enrollments e ON c.id = e.course_id
        LEFT JOIN lessons l ON c.id = l.course_id
        WHERE 
            c.title LIKE %s 
            OR c.description LIKE %s
        GROUP BY c.id
        ORDER BY enrollment_count DESC
        LIMIT %s
    """
    
    # Bước 3: Lấy dữ liệu TỪ DATABASE NGAY BÂY GIỜ
    search_pattern = f"%{query}%"
    self.cursor.execute(sql, (search_pattern, search_pattern, limit))
    courses = self.cursor.fetchall()  # ← LẤY DỮ LIỆU REAL-TIME
    
    # Bước 4: Trả về kết quả
    return courses
```

---

## 🔍 So sánh 3 cách lấy dữ liệu:

### ❌ **Cách 1: Cache khi khởi động** (KHÔNG dùng)
```python
# Khi start service
all_courses = mysql_service.get_all_courses()  # Lấy 1 lần
cache = all_courses  # Lưu vào memory

# Khi user hỏi
return cache  # Trả về data cũ
```
**Vấn đề:**
- ❌ Dữ liệu cũ (không real-time)
- ❌ Tốn memory
- ❌ Không cập nhật khi có khóa học mới

---

### ❌ **Cách 2: Sync định kỳ** (ChromaDB dùng)
```python
# Mỗi 1 giờ chạy 1 lần
schedule.every(1).hour.do(sync_courses_to_chromadb)

# Khi user hỏi
return chromadb.search(query)  # Dữ liệu có thể cũ 1 giờ
```
**Vấn đề:**
- ⚠️ Dữ liệu có thể cũ (delay 1 giờ)
- ⚠️ Cần chạy sync job
- ⚠️ Phức tạp hơn

---

### ✅ **Cách 3: Query real-time** (MySQL Direct - ĐANG DÙNG)
```python
# Khi user hỏi
courses = mysql_service.search_courses(query)  # Query NGAY
return courses  # Dữ liệu MỚI NHẤT
```
**Ưu điểm:**
- ✅ **Real-time** - Luôn mới nhất
- ✅ **Đơn giản** - Không cần sync
- ✅ **Chính xác** - Trực tiếp từ database
- ✅ **Nhanh** - SQL query ~10ms

---

## 📊 Timeline chi tiết:

```
T0: Khởi động service
    └─ Khởi tạo MySQLCourseService
    └─ Lưu config kết nối
    └─ CHƯA lấy dữ liệu

T1: User hỏi "Tìm khóa học về Python"
    └─ Kết nối MySQL (nếu chưa kết nối)
    └─ Execute SQL: SELECT * FROM courses WHERE title LIKE '%Python%'
    └─ Fetch results từ database
    └─ Return: [Course 1, Course 2, Course 3]
    └─ Thời gian: ~10-20ms

T2: User hỏi "Tìm khóa học về AI"
    └─ Kết nối đã có sẵn (reuse)
    └─ Execute SQL: SELECT * FROM courses WHERE title LIKE '%AI%'
    └─ Fetch results từ database
    └─ Return: [Course 4, Course 5]
    └─ Thời gian: ~8-15ms

T3: Admin tạo khóa học mới "Machine Learning"
    └─ Spring Boot insert vào MySQL
    └─ Dữ liệu có sẵn NGAY trong database

T4: User hỏi "Tìm khóa học về Machine Learning"
    └─ Execute SQL query
    └─ ✅ TÌM THẤY khóa học mới (vừa tạo ở T3)
    └─ Return: [Course "Machine Learning"]
```

---

## 🎯 Kết luận:

### **Cách lấy dữ liệu:**
1. ❌ **KHÔNG** lấy khi khởi động service
2. ❌ **KHÔNG** cache trong memory
3. ❌ **KHÔNG** sync định kỳ
4. ✅ **CÓ** query real-time mỗi khi user hỏi

### **Ưu điểm:**
- ✅ Dữ liệu luôn mới nhất (real-time)
- ✅ Không tốn memory (không cache)
- ✅ Đơn giản (không cần sync job)
- ✅ Nhanh (SQL query ~10ms)

### **Nhược điểm:**
- ⚠️ Mỗi lần hỏi phải query database (nhưng rất nhanh)
- ⚠️ Phụ thuộc MySQL phải online

---

## 💡 Ví dụ thực tế:

### Scenario 1: Khóa học mới được tạo
```
09:00 - Admin tạo khóa học "Python Advanced"
09:01 - User hỏi: "Tìm khóa học về Python"
        → ✅ TÌM THẤY "Python Advanced" (vừa tạo 1 phút trước)
```

### Scenario 2: Khóa học bị xóa
```
10:00 - Admin xóa khóa học "Old Course"
10:01 - User hỏi: "Tìm khóa học về Old"
        → ✅ KHÔNG TÌM THẤY (đã bị xóa)
```

### Scenario 3: Cập nhật thông tin khóa học
```
11:00 - Admin đổi tên: "Python Basic" → "Python for Beginners"
11:01 - User hỏi: "Tìm khóa học về Beginners"
        → ✅ TÌM THẤY "Python for Beginners" (tên mới)
```

---

## 🔧 Code minh họa:

### Khi khởi động (main.py):
```python
# Chỉ khởi tạo, CHƯA lấy dữ liệu
mysql_course_service = get_mysql_course_service()
# ← Không có query nào được thực thi ở đây
```

### Khi user hỏi (main.py):
```python
@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Detect intent
    if detect_course_search_intent(request.message):
        # ← BẮT ĐẦU query database NGAY BÂY GIỜ
        courses = mysql_course_service.search_courses("Python")
        # ← Dữ liệu REAL-TIME từ MySQL
        return format_response(courses)
```

### Trong MySQLCourseService:
```python
def search_courses(self, query: str):
    # Kết nối (nếu chưa có)
    self.connect()
    
    # Query NGAY LẬP TỨC
    sql = "SELECT * FROM courses WHERE title LIKE %s"
    self.cursor.execute(sql, (f"%{query}%",))
    
    # Lấy dữ liệu REAL-TIME
    courses = self.cursor.fetchall()  # ← Từ database NGAY BÂY GIỜ
    
    return courses
```

---

## 📈 Performance:

| Thao tác | Thời gian | Ghi chú |
|----------|-----------|---------|
| Khởi động service | 0ms | Không query database |
| Kết nối MySQL lần đầu | ~50ms | Chỉ 1 lần |
| Query courses | ~10ms | Mỗi lần hỏi |
| Reuse connection | ~8ms | Nhanh hơn |

**Tổng thời gian response:** ~50-100ms (rất nhanh!)

---

## ✅ Tóm tắt cho thuyết trình:

**Câu hỏi:** "Dữ liệu khóa học được lấy khi nào?"

**Trả lời:** 
> "Hệ thống lấy dữ liệu **real-time** mỗi khi user hỏi. Không cache, không sync định kỳ. Mỗi câu hỏi sẽ query trực tiếp MySQL database để đảm bảo dữ liệu luôn mới nhất. Thời gian query chỉ ~10ms, rất nhanh!"

**Ưu điểm:**
- ✅ Real-time (luôn mới nhất)
- ✅ Đơn giản (không cần sync)
- ✅ Nhanh (~10ms)

---

**Date:** January 16, 2026  
**Status:** ✅ DOCUMENTED
