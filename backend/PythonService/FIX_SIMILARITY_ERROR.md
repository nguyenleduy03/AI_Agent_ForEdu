# 🔧 Fix Lỗi Similarity - Error 500

## ❌ Lỗi gốc:
```
{"detail": "Lỗi: cannot access local variable 'similarity' where it is not associated with a value"}
```

## 🔍 Nguyên nhân:
Trong code xử lý course search, biến `similarity` được sử dụng ở dòng 1300 nhưng chưa được khởi tạo trong vòng lặp courses.

**Code lỗi:**
```python
for i, course in enumerate(courses[:5], 1):
    title = course.get('title', 'Unknown')
    course_id = course.get('id') or course.get('course_id', '')
    # ... các biến khác ...
    
    # ❌ Sử dụng similarity nhưng chưa định nghĩa
    course_context += f"   - Độ phù hợp: {similarity}%\n"
```

## ✅ Giải pháp:
Thêm dòng khởi tạo biến `similarity` từ course data:

```python
for i, course in enumerate(courses[:5], 1):
    title = course.get('title', 'Unknown')
    course_id = course.get('id') or course.get('course_id', '')
    description = course.get('description', '')[:150]
    creator = course.get('creator_full_name') or course.get('creator_name', 'Unknown')
    enrollment_count = course.get('enrollment_count', 0)
    lesson_count = course.get('lesson_count', 0)
    
    # ✅ Thêm dòng này
    similarity = course.get('similarity', 100)  # MySQL không có similarity, mặc định 100%
    
    course_context += f"{i}. **{title}** (ID: {course_id})\n"
    # ... rest of code ...
```

## 📝 Giải thích:
- **MySQL Direct Access:** Không có similarity score (vì là exact match)
- **ChromaDB RAG:** Có similarity score từ vector search
- **Giải pháp:** Dùng `course.get('similarity', 100)` để:
  - Lấy similarity nếu có (từ RAG)
  - Mặc định 100% nếu không có (từ MySQL)

## 🚀 Cách áp dụng:

### 1. Code đã được sửa trong `main.py`

### 2. Restart Python service:
```bash
# Dừng service hiện tại (Ctrl+C)

# Khởi động lại
cd backend/PythonService
python main.py
```

### 3. Test lại:
```bash
# Bật RAG trong chat
# Hỏi: "Tìm khóa học về Python"
# Kết quả: Không còn lỗi 500
```

## ✅ Kết quả:
- ✅ Không còn lỗi 500
- ✅ Course search hoạt động bình thường
- ✅ Hiển thị đầy đủ thông tin khóa học

---

**Status:** ✅ FIXED  
**Date:** January 16, 2026
