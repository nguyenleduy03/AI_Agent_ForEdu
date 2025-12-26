# 🧪 TEST NGAY BÂY GIỜ - Context Memory

## 🚀 Cách Test Nhanh Nhất

### **Option 1: Test Script Tự Động (Khuyến nghị)**

```bash
# Chạy script PowerShell
./test_context_memory_manual.ps1
```

Script sẽ tự động:
- ✅ Kiểm tra services đang chạy
- ✅ Gửi 3 test messages
- ✅ Verify kết quả
- ✅ Hiển thị kết quả rõ ràng

### **Option 2: Test Script CMD**

```bash
# Chạy script CMD
test_context_simple.cmd
```

### **Option 3: Test Thủ Công Trong Browser**

1. **Mở chat page:**
   - http://localhost:5173/chat (hoặc 5174)

2. **Test 1: Giới thiệu tên**
   ```
   Gửi: "Tên tôi là Minh"
   Đợi AI trả lời
   ```

3. **Test 2: Hỏi lại tên (cùng session)**
   ```
   Gửi: "Tên tôi là gì?"
   ✅ AI phải trả lời: "Tên bạn là Minh!"
   ```

4. **Test 3: Session mới**
   ```
   Nhấn nút "New Chat"
   Gửi: "Tên tôi là gì?"
   ✅ AI phải nói: "Xin lỗi, tôi không biết..."
   ```

## 📋 Checklist Trước Khi Test

### **Services phải đang chạy:**

```bash
# 1. Spring Boot (port 8080)
cd backend/SpringService/agentforedu
./mvnw spring-boot:run

# 2. Python FastAPI (port 8000)
cd backend/PythonService
py main.py

# 3. Frontend (port 5173)
cd fronend_web
npm run dev
```

### **Kiểm tra services:**

```bash
# Check Python API
curl http://localhost:8000/

# Check Spring Boot
curl http://localhost:8080/api/auth/health

# Check Frontend
# Mở browser: http://localhost:5173
```

## 🎯 Kết Quả Mong Đợi

### **Test 1: Giới thiệu**
```
Input: "Tên tôi là Minh"
Output: "Chào Minh! Tôi có thể giúp gì cho bạn?"
Status: ✅ OK
```

### **Test 2: Nhớ tên (cùng session)**
```
Input: "Tên tôi là gì?"
Output: "Tên bạn là Minh!" (hoặc tương tự)
Status: ✅ AI NHỚ - SUCCESS!
```

### **Test 3: Session mới**
```
Input: "Tên tôi là gì?" (session mới)
Output: "Xin lỗi, tôi không biết tên bạn..."
Status: ✅ AI QUÊN - SUCCESS!
```

## 🔍 Kiểm Tra Backend Logs

### **Trong Python console, tìm:**

```
💬 Loading conversation history for session 999...
✅ Loaded 2 messages from session history
📝 Building conversation context from 2 messages...
```

Nếu thấy logs này = **Context memory đang hoạt động!** ✅

### **Nếu KHÔNG thấy logs:**

❌ Có thể:
- Spring Boot chưa chạy
- Session ID không được gửi
- Database không có messages

## 🐛 Troubleshooting

### **Issue 1: AI không nhớ**

**Kiểm tra:**
```bash
# 1. Check backend logs có "Loading conversation history"?
# 2. Check Network tab trong browser - có session_id?
# 3. Check Spring Boot có chạy không?
```

**Fix:**
```bash
# Restart Python service
cd backend/PythonService
py main.py
```

### **Issue 2: Error 500**

**Kiểm tra:**
```bash
# Spring Boot có chạy không?
curl http://localhost:8080/api/auth/health
```

**Fix:**
```bash
# Start Spring Boot
cd backend/SpringService/agentforedu
./mvnw spring-boot:run
```

### **Issue 3: Frontend không gửi session_id**

**Kiểm tra:**
```javascript
// Mở DevTools > Network > XHR
// Click vào request /api/chat
// Check Request Payload có "session_id"?
```

**Fix:**
```bash
# Restart frontend
cd fronend_web
npm run dev
```

## 📊 Test Cases Chi Tiết

### **Test Case 1: Basic Memory**
```
Step 1: Send "Tên tôi là Minh"
Step 2: Send "Tôi học lớp 10A"
Step 3: Send "Tên tôi là gì và tôi học lớp nào?"

Expected: AI nhớ cả tên và lớp
Result: ✅ / ❌
```

### **Test Case 2: Multi-Turn Context**
```
Step 1: Send "Giải thích về AI"
Step 2: Send "Cho ví dụ"
Step 3: Send "Còn ứng dụng nào khác?"

Expected: AI hiểu "ví dụ" và "ứng dụng" đang nói về AI
Result: ✅ / ❌
```

### **Test Case 3: Session Isolation**
```
Step 1: Send "Tên tôi là Minh" (session 1)
Step 2: Click "New Chat" (session 2)
Step 3: Send "Tên tôi là gì?" (session 2)

Expected: AI không nhớ (session khác)
Result: ✅ / ❌
```

### **Test Case 4: Long Conversation**
```
Step 1-10: Send 10 messages
Step 11: Reference message 1

Expected: AI nhớ message 1 (trong 10 messages gần nhất)
Result: ✅ / ❌
```

## 🎬 Video Demo (Tự ghi)

1. Mở OBS/Screen recorder
2. Mở chat page
3. Thực hiện Test 1, 2, 3
4. Show kết quả
5. Show backend logs

## ✅ Success Criteria

Để coi như **THÀNH CÔNG**, cần:

- [x] AI nhớ thông tin trong cùng session
- [x] AI quên thông tin khi chuyển session
- [x] Backend logs hiển thị "Loading conversation history"
- [x] Không có errors trong console
- [x] Response time < 3 giây

## 📝 Ghi Chú Kết Quả

```
Test Date: ___________
Tester: ___________

Test 1 (Basic Memory): ✅ / ❌
Test 2 (Session Isolation): ✅ / ❌
Test 3 (Multi-Turn): ✅ / ❌

Notes:
_________________________________
_________________________________
_________________________________

Overall: PASS / FAIL
```

## 🚀 Next Steps After Testing

### **Nếu PASS:**
✅ Feature hoàn thành!
✅ Có thể deploy
✅ Viết documentation

### **Nếu FAIL:**
❌ Check logs
❌ Debug issues
❌ Fix và test lại

---

**Sẵn sàng test!** 🎉

**Chạy ngay:**
```bash
./test_context_memory_manual.ps1
```

Hoặc test trong browser: http://localhost:5173/chat
