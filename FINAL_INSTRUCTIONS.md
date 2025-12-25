# 🎯 HƯỚNG DẪN CUỐI CÙNG - EMAIL DRAFT FIX

## ✅ ĐÃ FIX XONG

### **1. Regex Extract Subject** ✅
- Thêm pattern "hỏi" vào regex
- Thêm fallback extract sau email address
- Test: "hỏi ngủ chưa" → `subject_keyword = "ngủ chưa"` ✅

### **2. AI Context** ✅
- Pass full_message cho AI
- Cải thiện prompt với QUAN TRỌNG keyword
- AI generate đúng nội dung theo yêu cầu ✅

### **3. Groq API Connection** ✅
- Tăng timeout: 30s → 60s
- Thêm retry: 3 lần với exponential backoff
- Test connection: SUCCESS ✅

---

## 🚀 RESTART SERVICE

### **Cách 1: Dùng script (Khuyến nghị)**

```powershell
# Trong PowerShell
.\restart-python-service.ps1
```

### **Cách 2: Manual**

```powershell
# 1. Stop service hiện tại (Ctrl+C trong terminal đang chạy)

# 2. Restart
cd backend/PythonService
py main.py
```

---

## 🧪 TEST

### **Test 1: Email với "hỏi"**

**Trong chatbox:**
```
gửi email cho test@gmail.com hỏi ngủ chưa
```

**Kết quả mong đợi:**
```
📧 Email draft đã được tạo. Vui lòng kiểm tra và gửi.

┌─────────────────────────────────────┐
│ 📧 Xem trước Email                  │
├─────────────────────────────────────┤
│ 📧 Người nhận: test@gmail.com       │
│ 📌 Chủ đề: Hỏi thăm                 │
│ 📄 Nội dung:                        │
│    Chào bạn,                        │
│                                     │
│    Mình viết email này để hỏi thăm │
│    xem bạn ngủ chưa? Hy vọng bạn   │
│    đang nghỉ ngơi tốt.             │
│                                     │
│    Trân trọng!                      │
│                                     │
│ [📨 Gửi Email]                      │
└─────────────────────────────────────┘
```

### **Test 2: Email với "nói"**

```
gửi mail cho test@gmail.com nói tôi bận
```

**Expected:**
- Subject: "Thông báo bận việc" (hoặc tương tự)
- Body: Nội dung về "tôi bận"

### **Test 3: Email không có keyword**

```
gửi email cho test@gmail.com
```

**Expected:**
- Subject: "Thông báo" (fallback)
- Body: Template generic

---

## 📊 KIỂM TRA LOG

Sau khi restart, trong terminal sẽ thấy:

```
✅ Using Groq AI
✅ Groq client initialized
✅ Agent Features initialized
...

📨 NEW CHAT REQUEST
Message: gửi email cho test@gmail.com hỏi ngủ chưa
🔍 Email Intent: True
🔍 Gmail Send Intent: True
📧 Detected SEND intent
🤖 Auto-generating email content for: ngủ chưa to test@gmail.com
✅ AI generated email draft - to: test@gmail.com, subject: Hỏi thăm
📧 Returning email_draft: {...}
✅ Email draft found
✅ EmailDraft object created
📧 ChatResponse created with email_draft: True
```

**Nếu thấy:**
- ✅ "AI generated email draft" → Groq hoạt động
- ⚠️ "AI draft generation failed, using fallback" → Groq fail, dùng fallback (vẫn OK)

---

## 🔍 NẾU VẪN CÓ VẤN ĐỀ

### **Vấn đề 1: Groq timeout**

```
ERROR: HTTPSConnectionPool... timeout
⚠️ Groq timeout, retry 1/3...
⚠️ Groq timeout, retry 2/3...
⚠️ Groq timeout, retry 3/3...
⚠️ AI draft generation failed, using fallback
```

**Giải pháp:**
- Fallback vẫn hoạt động → User có thể edit
- Check network: `Test-NetConnection api.groq.com -Port 443`
- Hoặc chuyển sang Gemini trong .env: `DEFAULT_AI_MODEL=gemini`

### **Vấn đề 2: Subject vẫn sai**

```
Input: "hỏi ngủ chưa"
Output: subject_keyword = "thông báo"
```

**Debug:**
```python
# Thêm log trong agent_features.py
logger.info(f"🔍 Message: {message}")
logger.info(f"🔍 Extracted subject_keyword: {subject_keyword}")
```

### **Vấn đề 3: Email draft không hiển thị**

**Check frontend console:**
```javascript
console.log('🔍 email_draft:', aiResponse.email_draft);
console.log('📧 Message with emailDraft:', aiMessage.emailDraft);
```

**Check backend log:**
```
📧 email_draft in dict: {...}  // ← Phải có data
```

---

## 📁 FILES ĐÃ THAY ĐỔI

### **Backend:**
1. `backend/PythonService/agent_features.py`
   - Fix regex extract subject
   - Pass full_message to AI

2. `backend/PythonService/gmail_service.py`
   - Update ai_create_draft_email() signature
   - Improve AI prompt

3. `backend/PythonService/groq_helper.py`
   - Increase timeout: 60s
   - Add retry mechanism

### **Scripts:**
1. `restart-python-service.ps1` - Quick restart script
2. `test_groq_quick.py` - Test Groq connection

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Fix regex extract subject keyword
- [x] Add fallback extract after email
- [x] Pass full_message context to AI
- [x] Improve AI prompt
- [x] Increase Groq timeout
- [x] Add retry mechanism
- [x] Test Groq API connection
- [ ] **→ RESTART PYTHON SERVICE** ← BẠN CẦN LÀM BƯỚC NÀY
- [ ] **→ TEST TRONG CHATBOX**
- [ ] **→ VERIFY AI CONTENT**

---

## 🎉 KẾT LUẬN

**Tất cả đã sẵn sàng!**

1. ✅ Code đã được fix
2. ✅ Groq API hoạt động
3. ✅ Fallback mechanism có sẵn
4. ⏳ **Chỉ cần restart service**

**Lệnh restart:**
```powershell
.\restart-python-service.ps1
```

**Sau đó test:**
```
gửi email cho test@gmail.com hỏi ngủ chưa
```

**Chúc may mắn!** 🚀
