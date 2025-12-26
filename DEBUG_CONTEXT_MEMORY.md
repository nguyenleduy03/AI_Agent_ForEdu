# 🐛 Debug Context Memory Issue

## ❌ Vấn Đề

AI không nhớ tên "Duy" mặc dù đã nói:
```
User: "tôi tên duy"
AI: "Chào Duy!"

User: "tôi tên gì"
AI: "Bạn chưa cung cấp thông tin về tên..." ❌
```

## 🔍 Debug Steps

### **Step 1: Kiểm tra Frontend Console**

Mở DevTools (F12) > Console, tìm logs:

```javascript
🔍 DEBUG: Sending session_id: 123
```

**Nếu thấy:**
- ✅ `session_id: 123` (hoặc số khác) → Frontend OK
- ❌ `session_id: null` hoặc `undefined` → Frontend có vấn đề

### **Step 2: Kiểm tra Backend Logs**

Trong terminal Python, tìm logs:

```
============================================================
📨 NEW CHAT REQUEST
Message: tôi tên gì
Session ID: 123          ← Phải có số, không phải None
AI Provider: groq
============================================================

💬 Loading conversation history for session 123...
✅ Loaded 2 messages from session history
📝 Building conversation context from 2 messages...
```

**Nếu thấy:**
- ✅ `Session ID: 123` → Session ID được gửi
- ✅ `Loaded 2 messages` → History được load
- ✅ `Building conversation context` → Context được build
- ❌ `Session ID: None` → Frontend không gửi session_id
- ❌ Không có logs "Loading conversation history" → Backend không load

### **Step 3: Kiểm tra Groq Prompt**

Tìm logs:

```
📝 DEBUG: Groq prompt includes 2 messages of context
📝 DEBUG: Prompt preview: 🎓 Bạn là AI Learning Assistant...

**Lịch sử cuộc trò chuyện:**
Học sinh: tôi tên duy
AI: Chào Duy!
...
```

**Nếu thấy:**
- ✅ "Groq prompt includes X messages" → Context được gửi cho Groq
- ✅ Thấy "Lịch sử cuộc trò chuyện" trong prompt → OK
- ❌ "No conversation history for Groq" → Context không được build
- ❌ Không thấy "Lịch sử" trong prompt → Prompt không có context

### **Step 4: Kiểm tra Network Tab**

DevTools > Network > XHR > Click request `/api/chat`

**Request Payload:**
```json
{
  "message": "tôi tên gì",
  "session_id": 123,        ← Phải có
  "ai_provider": "groq",
  "use_rag": false
}
```

**Nếu:**
- ✅ `session_id: 123` → Frontend gửi đúng
- ❌ `session_id: null` → Frontend có bug

## 🔧 Possible Fixes

### **Fix 1: Session ID không được gửi**

**Nguyên nhân:** `currentSessionId` là `null`

**Kiểm tra:**
```typescript
// ChatPage.tsx
console.log('Current session ID:', currentSessionId);
```

**Fix:**
- Đảm bảo session được tạo khi load page
- Check `useEffect` tạo session

### **Fix 2: Spring Boot không chạy**

**Nguyên nhân:** Backend không load được history từ database

**Kiểm tra:**
```bash
curl http://localhost:8080/api/auth/health
```

**Fix:**
```bash
cd backend/SpringService/agentforedu
./mvnw spring-boot:run
```

### **Fix 3: Database không có messages**

**Nguyên nhân:** Messages không được save vào database

**Kiểm tra:**
- Xem logs Spring Boot có "Message saved"?
- Check database có table `chat_messages`?

**Fix:**
- Restart Spring Boot
- Check database connection

### **Fix 4: Groq không nhận context**

**Nguyên nhân:** `content_parts[0]` không có conversation_context

**Kiểm tra logs:**
```
📝 DEBUG: Groq prompt includes 0 messages of context
⚠️ DEBUG: No conversation history for Groq
```

**Fix đã áp dụng:**
- Added debug logs
- Verify `prompt` variable có `conversation_context`

## 🧪 Test Lại

### **Test Case 1: Verify Session ID**

1. Mở chat page
2. Mở DevTools Console
3. Gửi tin nhắn
4. Tìm log: `🔍 DEBUG: Sending session_id: XXX`
5. ✅ Phải thấy số, không phải null

### **Test Case 2: Verify Backend Receives**

1. Mở terminal Python
2. Gửi tin nhắn từ frontend
3. Tìm log: `Session ID: XXX`
4. ✅ Phải thấy số, không phải None

### **Test Case 3: Verify History Loading**

1. Gửi: "tôi tên duy"
2. Gửi: "tôi tên gì"
3. Tìm logs:
   ```
   💬 Loading conversation history for session XXX...
   ✅ Loaded 2 messages from session history
   ```
4. ✅ Phải thấy "Loaded 2 messages"

### **Test Case 4: Verify Groq Context**

1. Gửi tin nhắn với Groq
2. Tìm log:
   ```
   📝 DEBUG: Groq prompt includes 2 messages of context
   ```
3. ✅ Phải thấy số messages > 0

## 📝 Checklist

Để context memory hoạt động, cần:

- [ ] Frontend gửi `session_id` (check Console)
- [ ] Backend nhận `session_id` (check Python logs)
- [ ] Spring Boot đang chạy (port 8080)
- [ ] History được load (check "Loaded X messages")
- [ ] Context được build (check "Building conversation context")
- [ ] Groq nhận context (check "Groq prompt includes X messages")

## 🎯 Expected Logs (Success)

### **Frontend Console:**
```
🔍 DEBUG: Sending session_id: 28886
Getting AI response... text only
✅ DEBUG: AI response received
```

### **Backend Logs:**
```
============================================================
📨 NEW CHAT REQUEST
Message: tôi tên gì
Session ID: 28886
AI Provider: groq
============================================================

💬 Loading conversation history for session 28886...
✅ Loaded 2 messages from session history
📝 Building conversation context from 2 messages...

🚀 Using Groq model: llama-3.3-70b-versatile
📝 DEBUG: Groq prompt includes 2 messages of context
📝 DEBUG: Prompt preview: 🎓 Bạn là AI Learning Assistant...

**Lịch sử cuộc trò chuyện:**
Học sinh: tôi tên duy
AI: Chào Duy!
...

✅ Groq response received: 150 chars
```

## 🚀 Next Steps

1. **Gửi lại tin nhắn** với debug logs enabled
2. **Copy logs** từ Console và Terminal
3. **So sánh** với expected logs ở trên
4. **Tìm** điểm khác biệt
5. **Fix** theo hướng dẫn

---

**Sau khi fix, test lại:**
```
User: "tôi tên duy"
AI: "Chào Duy!"

User: "tôi tên gì"
AI: "Tên bạn là Duy!" ✅
```
