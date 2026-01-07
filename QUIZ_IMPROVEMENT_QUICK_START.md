# 🚀 QUICK START - QUIZ IMPROVEMENT

## ✅ ĐÃ HOÀN THÀNH

Tính năng tạo quiz đã được cải tiến với:
- Text bổ sung cho AI
- Upload file tài liệu
- Preview & Edit trước khi lưu

---

## 🎯 CÁCH SỬ DỤNG

### 1. Khởi động Services

```powershell
# Terminal 1: Spring Boot
cd backend/SpringService/agentforedu
./mvnw spring-boot:run

# Terminal 2: Python Service
cd backend/PythonService
py main.py

# Terminal 3: Frontend
cd fronend_web
npm run dev
```

### 2. Truy cập trang tạo quiz

1. Đăng nhập với tài khoản giáo viên
2. Vào khóa học → Bài học
3. Click "Tạo bài kiểm tra"

### 3. Chọn AI Mode

Click tab "🤖 AI tự động tạo"

### 4. Cấu hình (Step 1)

**Bắt buộc**:
- Số câu hỏi: 1-50
- Độ khó: Dễ/Trung bình/Khó

**Tùy chọn**:
- 📝 **Text bổ sung**: Nhập yêu cầu cho AI
  ```
  VD: 
  - Tập trung vào khái niệm X, Y, Z
  - Thêm ví dụ về A, B, C
  - Bỏ qua phần D, E, F
  ```

- 📎 **File tài liệu**: Upload PDF, DOC, DOCX, TXT (max 10MB)
  * Click vào ô upload
  * Chọn file
  * AI sẽ đọc và tạo câu hỏi dựa trên file

### 5. Tạo Preview

Click "🤖 Để AI tạo quiz"
- AI sẽ phân tích: Nội dung bài học + Text bổ sung + File
- Tạo câu hỏi với độ khó phù hợp
- Hiển thị preview

### 6. Review & Edit (Step 2)

**Xem tất cả câu hỏi**:
- Câu hỏi
- 4 đáp án (đáp án đúng màu xanh)
- Giải thích

**Chỉnh sửa**:
- Click ✏️ **Edit**: Sửa câu hỏi, đáp án, đáp án đúng
- Click 🗑️ **Delete**: Xóa câu không phù hợp
- Click **Thêm câu hỏi**: Thêm câu mới

**Edit thông tin quiz**:
- Tiêu đề
- Mô tả
- Độ khó

### 7. Lưu Quiz

**Nếu hài lòng**:
- Click "💾 Lưu bài kiểm tra"
- Quiz sẽ được lưu vào database
- Redirect về trang bài học

**Nếu chưa hài lòng**:
- Click "🔄 Tạo lại": AI tạo quiz mới
- Click "Quay lại": Về step 1, thay đổi config

---

## 💡 TIPS

### Text Bổ Sung Hiệu Quả

**Tốt**:
```
Tập trung vào:
- Cú pháp Python cơ bản (if, for, while)
- Kiểu dữ liệu (int, str, list, dict)
- Functions và parameters

Bỏ qua:
- OOP nâng cao
- Decorators
- Generators
```

**Không tốt**:
```
Tạo câu hỏi hay
```

### File Upload

**Nên**:
- File .txt với nội dung rõ ràng
- PDF có text (không phải scan)
- Nội dung liên quan đến bài học

**Không nên**:
- File quá lớn (>10MB)
- File scan không có text
- Nội dung không liên quan

### Edit Questions

**Khi nào edit**:
- Câu hỏi không rõ ràng
- Đáp án sai
- Thiếu giải thích
- Muốn thêm context

**Khi nào delete**:
- Câu hỏi trùng lặp
- Không liên quan đến bài học
- Quá dễ/khó so với yêu cầu

---

## 🐛 TROUBLESHOOTING

### AI không tạo được quiz

**Nguyên nhân**:
- Python service chưa chạy
- Gemini API key không đúng
- Nội dung bài học trống

**Giải pháp**:
```powershell
# Check Python service
cd backend/PythonService
py main.py

# Check .env
cat .env | findstr GEMINI_API_KEY
```

### File upload lỗi

**Nguyên nhân**:
- File quá lớn (>10MB)
- File type không hỗ trợ
- File corrupt

**Giải pháp**:
- Giảm size file
- Convert sang .txt
- Thử file khác

### Preview không hiển thị

**Nguyên nhân**:
- AI response không đúng format
- Network error

**Giải pháp**:
- Check console log
- Thử tạo lại
- Giảm số câu hỏi

---

## 📊 EXAMPLES

### Example 1: Basic AI Generation

**Config**:
- Số câu: 10
- Độ khó: Trung bình
- Text bổ sung: (trống)
- File: (không có)

**Kết quả**: 10 câu hỏi dựa trên nội dung bài học

### Example 2: With Additional Text

**Config**:
- Số câu: 15
- Độ khó: Khó
- Text bổ sung:
  ```
  Tập trung vào:
  - Thuật toán sắp xếp (bubble, quick, merge)
  - Độ phức tạp O(n), O(log n)
  - So sánh ưu/nhược điểm
  ```
- File: (không có)

**Kết quả**: 15 câu hỏi về thuật toán sắp xếp, độ phức tạp

### Example 3: With File Upload

**Config**:
- Số câu: 20
- Độ khó: Dễ
- Text bổ sung: (trống)
- File: `python_basics.pdf` (3MB)

**Kết quả**: 20 câu hỏi dựa trên nội dung file PDF

### Example 4: Full Features

**Config**:
- Số câu: 25
- Độ khó: Trung bình
- Text bổ sung:
  ```
  Kết hợp nội dung bài học và file PDF
  Tập trung vào ví dụ thực tế
  Thêm câu hỏi về best practices
  ```
- File: `advanced_python.txt` (1.5MB)

**Kết quả**: 25 câu hỏi chất lượng cao, kết hợp tất cả nguồn

---

## ✅ CHECKLIST

Trước khi lưu quiz, check:
- [ ] Tất cả câu hỏi rõ ràng
- [ ] Đáp án đúng chính xác
- [ ] Có giải thích (nếu cần)
- [ ] Độ khó phù hợp
- [ ] Không có câu trùng lặp
- [ ] Tiêu đề & mô tả đầy đủ

---

## 🎉 DONE!

Bây giờ bạn có thể:
✅ Tạo quiz nhanh với AI
✅ Thêm context cho AI
✅ Upload tài liệu tham khảo
✅ Review và chỉnh sửa trước khi lưu
✅ Kiểm soát 100% chất lượng

**Happy Teaching!** 🚀
