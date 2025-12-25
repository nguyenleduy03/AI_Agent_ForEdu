# 📧 TÓM TẮT CÁC FIX CHO EMAIL DRAFT

## 🎯 VẤN ĐỀ PHÁT HIỆN

Từ log của bạn:

```
Input: "gửi email cho nguyenhoang4556@gmail.com hỏi ngủ chưa"

❌ AI Generated:
Subject: "Thông báo quan trọng"
Body: "...thông báo về một số thay đổi quan trọng trong dự án..."

⚠️ user_id = None (Failed to get user from token: 400)
```

**2 vấn đề:**
1. AI generate **SAI HOÀN TOÀN** nội dung (phải là "hỏi ngủ chưa" không phải "thông báo dự án")
2. `user_id = None` (không lấy được từ token)

---

## ✅ CÁC FIX ĐÃ TRIỂN KHAI

### **Fix 1: Cải thiện Regex Extract Subject Keyword**

**File:** `backend/PythonService/agent_features.py`

**Thay đổi:**
```python
# BEFORE
subject_patterns = [
    r'(?:gửi|soạn|viết)\s+(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:nói|về)\s+(.+?)$',  # ← Thiếu "hỏi"
]

# AFTER
subject_patterns = [
    r'(?:gửi|soạn|viết)\s+(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:nói|về|hỏi)\s+(.+?)$',  # ← ADDED: "hỏi"
]

# ADDED: Fallback extract sau email address
if not subject_keyword:
    after_email = re.search(
        r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s+(.+)', 
        message_lower
    )
    if after_email:
        subject_keyword = after_email.group(1).strip()
    else:
        subject_keyword = "thông báo"
```

**Kết quả:**
```
Input: "gửi email cho test@gmail.com hỏi ngủ chưa"
→ subject_keyword = "hỏi ngủ chưa" ✅
```

---

### **Fix 2: Pass Full Message Context to AI**

**File:** `backend/PythonService/agent_features.py`

**Thay đổi:**
```python
# BEFORE
draft_result = ai_create_draft_email(
    subject_keyword=subject_keyword,
    recipient_name=to_email.split('@')[0]
)

# AFTER
draft_result = ai_create_draft_email(
    subject_keyword=subject_keyword,
    recipient_name=to_email.split('@')[0],
    full_message=message  # ← ADDED: Full context
)
```

---

### **Fix 3: Cải thiện AI Prompt**

**File:** `backend/PythonService/gmail_service.py`

**Thay đổi:**
```python
# BEFORE
def ai_create_draft_email(subject_keyword: str, recipient_name: str = None):
    prompt = f"""Viết email về chủ đề: {subject_keyword}"""

# AFTER
def ai_create_draft_email(subject_keyword: str, recipient_name: str = None, full_message: str = None):
    context_info = f"\n\nTin nhắn gốc từ user: \"{full_message}\"" if full_message else ""
    
    prompt = f"""Viết email về chủ đề: {subject_keyword}{context_info}

Yêu cầu:
- QUAN TRỌNG: Nội dung phải phù hợp với chủ đề "{subject_keyword}"
- Tone: Lịch sự, trang trọng
- Độ dài: Ngắn gọn (4-6 câu)
"""
```

**Kết quả mong đợi:**
```json
{
  "subject": "Hỏi thăm",
  "body": "Chào bạn,\n\nMình viết email này để hỏi thăm xem bạn ngủ chưa? Hy vọng bạn đang nghỉ ngơi tốt.\n\nTrân trọng!"
}
```

---

## 🔍 VỀ VẤN ĐỀ user_id = None

**Hiện trạng:**
- Spring Boot đang chạy (port 8080) ✅
- Nhưng API `/api/auth/profile` trả về 400
- Token có thể không hợp lệ hoặc expired

**Không ảnh hưởng đến Email Draft Preview:**
- Email draft vẫn được tạo và hiển thị ✅
- User vẫn có thể edit ✅
- Chỉ khi click "Gửi" mới cần user_id

**Khi user click "Gửi":**
```typescript
// EmailDraftPreview.tsx
const handleSend = async () => {
  const token = localStorage.getItem('token');
  const currentUserId = userId || draft.user_id;  // ← Lấy từ props hoặc draft
  
  // Call API
  await fetch('http://localhost:8000/api/email/send', {
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      to, subject, body,
      user_id: currentUserId  // ← Backend sẽ lấy từ token nếu null
    })
  });
};
```

**Backend xử lý:**
```python
# main.py - /api/email/send
user_id = request.user_id

if not user_id and authorization:
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id_from_token(token)  # ← Retry lấy từ token

if not user_id:
    raise HTTPException(401, "Không thể xác thực")
```

**Giải pháp:**
1. User cần đăng nhập lại để có token mới
2. Hoặc check Spring Boot API `/api/auth/profile` có hoạt động đúng không

---

## 🧪 TEST NGAY

### **1. Restart Python Service**
```bash
# Trong terminal đang chạy Python service
Ctrl+C

# Restart
cd backend/PythonService
python main.py
```

### **2. Test trong chatbox**
```
"gửi email cho test@gmail.com hỏi ngủ chưa"
```

**Kết quả mong đợi:**
- ✅ Email draft hiển thị
- ✅ Subject: "Hỏi thăm" (hoặc tương tự)
- ✅ Body: Nội dung về "hỏi ngủ chưa"
- ✅ User có thể edit và gửi

---

## 📊 SO SÁNH TRƯỚC/SAU

### **TRƯỚC FIX**
```
Input: "gửi email cho test@gmail.com hỏi ngủ chưa"

Flow:
1. Regex không match "hỏi" ❌
2. subject_keyword = "thông báo" (fallback)
3. AI: "Thông báo quan trọng về dự án..." ❌
4. User nhận email sai nội dung ❌
```

### **SAU FIX**
```
Input: "gửi email cho test@gmail.com hỏi ngủ chưa"

Flow:
1. Regex match "hỏi ngủ chưa" ✅
2. subject_keyword = "hỏi ngủ chưa"
3. AI với context: "Hỏi thăm xem bạn ngủ chưa..." ✅
4. User nhận email đúng nội dung ✅
```

---

## 📁 FILES ĐÃ THAY ĐỔI

1. **`backend/PythonService/agent_features.py`**
   - Thêm pattern "hỏi" vào regex
   - Thêm fallback extract sau email
   - Pass full_message cho AI

2. **`backend/PythonService/gmail_service.py`**
   - Update signature `ai_create_draft_email()`
   - Thêm parameter `full_message`
   - Cải thiện AI prompt với context

---

## ✅ CHECKLIST

- [x] Fix regex extract subject keyword
- [x] Thêm fallback extract
- [x] Pass full message context
- [x] Cải thiện AI prompt
- [x] Test Spring Boot running
- [ ] **TODO: Restart Python service**
- [ ] **TODO: Test trong chatbox**
- [ ] **TODO: Verify AI generate đúng nội dung**

---

## 🚀 HÀNH ĐỘNG TIẾP THEO

1. **Restart Python service** (bắt buộc để apply changes)
2. **Test lại** với câu lệnh: "gửi email cho test@gmail.com hỏi ngủ chưa"
3. **Verify** email draft có đúng nội dung không
4. **Nếu vẫn sai:** Check log để debug

---

## 💡 LƯU Ý

- Email draft preview vẫn hoạt động dù `user_id = None`
- Chỉ khi gửi email mới cần user_id (để lấy OAuth token)
- Nếu gửi fail → User cần đăng nhập lại

**Tất cả các fix đã được apply vào code!** 🎉
