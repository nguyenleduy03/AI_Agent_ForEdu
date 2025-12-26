# 💬 Hướng Dẫn: Chat AI Có Nhớ Ngữ Cảnh

## 🎯 Tính Năng Mới

Chat AI của bạn giờ **nhớ được toàn bộ cuộc trò chuyện** - giống như ChatGPT!

### **Trước đây:**
```
Bạn: "Tên tôi là Minh"
AI: "Chào Minh!"

[5 phút sau]

Bạn: "Tên tôi là gì?"
AI: "Xin lỗi, tôi không biết tên bạn" ❌
```

### **Bây giờ:**
```
Bạn: "Tên tôi là Minh"
AI: "Chào Minh!"

[5 phút sau]

Bạn: "Tên tôi là gì?"
AI: "Tên bạn là Minh! 😊" ✅
```

## ✨ Cách Hoạt Động

### **1. Mỗi Phiên Chat Có Bộ Nhớ Riêng**
- Khi bạn chat, AI sẽ nhớ tất cả những gì đã nói trong phiên đó
- Chuyển sang phiên chat mới = AI quên hết (bắt đầu lại từ đầu)

### **2. AI Nhớ 10 Tin Nhắn Gần Nhất**
- Để tránh quá tải, AI chỉ nhớ 10 tin nhắn gần nhất
- Đủ để hiểu ngữ cảnh mà không làm chậm hệ thống

### **3. Tự Động - Không Cần Làm Gì**
- Tính năng tự động hoạt động
- Bạn chỉ cần chat bình thường

## 🎬 Ví Dụ Thực Tế

### **Ví dụ 1: Nhớ Thông Tin Cá Nhân**
```
Bạn: "Tên tôi là Minh, tôi 16 tuổi, học lớp 10A"
AI: "Chào Minh! Rất vui được gặp bạn."

Bạn: "Tôi học lớp nào?"
AI: "Bạn học lớp 10A nhé!"

Bạn: "Tôi bao nhiêu tuổi?"
AI: "Bạn 16 tuổi!"
```

### **Ví dụ 2: Tiếp Tục Chủ Đề**
```
Bạn: "Giải thích về AI"
AI: "AI là trí tuệ nhân tạo, là khả năng của máy tính..."

Bạn: "Cho ví dụ"
AI: "Ví dụ về AI mà tôi vừa giải thích: ChatGPT, Siri, Google Assistant..."
```

### **Ví dụ 3: Giải Bài Tập Nhiều Bước**
```
Bạn: "Giải phương trình x² + 5x + 6 = 0"
AI: "Ta có thể dùng công thức nghiệm..."

Bạn: "Còn cách nào khác không?"
AI: "Với phương trình x² + 5x + 6 = 0 này, ta có thể phân tích thành nhân tử..."
```

### **Ví dụ 4: Nhớ Sở Thích**
```
Bạn: "Tôi thích học bằng ví dụ thực tế"
AI: "Được rồi, tôi sẽ nhớ và đưa nhiều ví dụ thực tế cho bạn!"

[Sau đó trong cuộc trò chuyện]

AI: "Để giải thích khái niệm này, tôi sẽ đưa ví dụ thực tế như bạn thích..."
```

## 🔄 Phiên Chat Mới

### **Khi Nào Cần Tạo Phiên Mới?**
- Muốn bắt đầu chủ đề hoàn toàn mới
- Muốn AI quên thông tin cũ
- Cuộc trò chuyện cũ đã quá dài

### **Cách Tạo Phiên Mới:**
1. Nhấn nút **"New Chat"** ở góc trên
2. AI sẽ quên hết thông tin phiên cũ
3. Bắt đầu cuộc trò chuyện mới

## 💡 Mẹo Sử Dụng

### **1. Cung Cấp Thông Tin Ngay Từ Đầu**
```
✅ TỐT:
"Tên tôi là Minh, tôi học lớp 10A, môn yêu thích là Toán"

❌ KHÔNG TỐT:
"Tôi cần giúp đỡ" (quá chung chung)
```

### **2. Tham Chiếu Đến Tin Nhắn Trước**
```
✅ TỐT:
"Còn cách nào khác không?"
"Giải thích rõ hơn phần đó"
"Cho ví dụ về điều bạn vừa nói"

❌ KHÔNG TỐT:
"Còn cách nào khác giải phương trình x² + 5x + 6 = 0 không?"
(không cần lặp lại, AI đã nhớ)
```

### **3. Sử Dụng Đại Từ**
```
✅ TỐT:
"Giải thích về AI"
"Cho ví dụ về nó"  ← AI hiểu "nó" = "AI"

✅ TỐT:
"Tôi học lớp 10A"
"Môn nào khó nhất ở lớp đó?"  ← AI hiểu "lớp đó" = "10A"
```

## 🚀 Cách Test

### **Test 1: Nhớ Tên**
1. Gửi: "Tên tôi là [Tên bạn]"
2. Đợi AI trả lời
3. Gửi: "Tên tôi là gì?"
4. ✅ AI phải nhớ tên bạn

### **Test 2: Nhớ Nhiều Thông Tin**
1. Gửi: "Tên tôi là Minh, 16 tuổi, học lớp 10A"
2. Gửi: "Tôi bao nhiêu tuổi?"
3. Gửi: "Tôi học lớp nào?"
4. ✅ AI phải nhớ cả tuổi và lớp

### **Test 3: Phiên Mới**
1. Nhấn "New Chat"
2. Gửi: "Tên tôi là gì?"
3. ✅ AI phải nói không biết (phiên mới)

## ⚙️ Cài Đặt

### **Khởi Động Hệ Thống:**
```bash
# 1. Spring Boot (Database)
cd backend/SpringService/agentforedu
./mvnw spring-boot:run

# 2. Python FastAPI (AI)
cd backend/PythonService
py main.py

# 3. Frontend (Web)
cd fronend_web
npm run dev
```

### **Truy Cập:**
- Mở trình duyệt: http://localhost:5173/chat
- Đăng nhập (nếu cần)
- Bắt đầu chat!

## 🔧 Tùy Chỉnh

### **Thay Đổi Số Tin Nhắn Nhớ:**

Mở file `backend/PythonService/main.py`, tìm dòng:
```python
recent_messages = messages[-10:]  # Nhớ 10 tin nhắn
```

Thay đổi số 10:
```python
recent_messages = messages[-20:]  # Nhớ 20 tin nhắn
recent_messages = messages[-5:]   # Nhớ 5 tin nhắn
```

**Lưu ý:**
- Nhiều tin nhắn = AI nhớ lâu hơn nhưng chậm hơn
- Ít tin nhắn = Nhanh hơn nhưng quên nhanh

## ❓ Câu Hỏi Thường Gặp

### **Q: AI nhớ được bao lâu?**
A: AI nhớ trong suốt phiên chat. Khi bạn tạo phiên mới, AI sẽ quên hết.

### **Q: AI có nhớ qua các phiên không?**
A: Không. Mỗi phiên chat độc lập. Muốn AI nhớ thì phải chat trong cùng 1 phiên.

### **Q: Tôi có thể xóa bộ nhớ không?**
A: Có, nhấn "New Chat" để tạo phiên mới. AI sẽ quên hết thông tin phiên cũ.

### **Q: AI nhớ được bao nhiêu tin nhắn?**
A: Mặc định là 10 tin nhắn gần nhất (5 lượt hỏi-đáp). Có thể tùy chỉnh.

### **Q: Tại sao không nhớ tất cả?**
A: Để tránh:
- Quá tải token (AI có giới hạn)
- Chậm (nhiều tin nhắn = xử lý lâu)
- Thông tin cũ không còn liên quan

### **Q: AI có nhớ ảnh không?**
A: Hiện tại chưa. AI chỉ nhớ text. Tính năng nhớ ảnh sẽ có trong tương lai.

## 🎯 Lợi Ích

### **Cho Học Sinh:**
✅ Không cần lặp lại thông tin
✅ Chat tự nhiên hơn
✅ AI hiểu ngữ cảnh
✅ Giải bài tập nhiều bước dễ dàng

### **Cho Giáo Viên:**
✅ AI nhớ thông tin học sinh
✅ Cá nhân hóa trải nghiệm
✅ Theo dõi tiến trình học tập

### **Cho Hệ Thống:**
✅ UX tốt hơn
✅ Giống ChatGPT
✅ Tăng tính tương tác

## 📊 So Sánh

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| Nhớ tên | ❌ | ✅ |
| Nhớ thông tin | ❌ | ✅ |
| Tiếp tục chủ đề | ❌ | ✅ |
| Giải bài nhiều bước | ❌ | ✅ |
| Chat tự nhiên | ❌ | ✅ |
| Giống ChatGPT | ❌ | ✅ |

## 🎉 Kết Luận

**Chat AI của bạn giờ thông minh hơn nhiều!**

✅ Nhớ được ngữ cảnh cuộc trò chuyện
✅ Không cần lặp lại thông tin
✅ Chat tự nhiên như với người thật
✅ Giống ChatGPT

**Hãy thử ngay!** 🚀

---

**Tài liệu chi tiết:**
- `CHAT_CONTEXT_MEMORY_DONE.md` - Technical details
- `CONTEXT_MEMORY_FLOW.md` - Flow diagrams
- `test_context_memory.md` - Test guide

**Cần hỗ trợ?** Hỏi AI trong chat! 😊
