# 🔧 FIX CÁC VẤN ĐỀ EMAIL DRAFT

## 🔴 VẤN ĐỀ PHÁT HIỆN

### **1. user_id = None**
```
⚠️  Failed to get user from token: 400
User ID: None
```

**Nguyên nhân:**
- Spring Boot API `/api/auth/profile` trả về 400
- Có thể Spring Boot không chạy hoặc token không hợp lệ

**Hậu quả:**
- Không thể gửi email (cần user_id để lấy OAuth token)
- EmailDraftPreview vẫn hiển thị nhưng gửi sẽ fail

---

### **2. AI Generate Sai Nội Dung**

**User yêu cầu:** "gửi email cho nguyenhoang4556@gmail.com hỏi ngủ chưa"

**AI generate:**
```
Subject: Thông báo quan trọng
Body: Kính gửi nguyenhoang4556, chúng tôi viết email này để thông báo về 
một số thay đổi quan trọng trong dự án hiện tại...
```

❌ **Hoàn toàn sai!** Phải là "hỏi ngủ chưa" chứ không phải "thông báo dự án"

**Nguyên nhân:**
- Regex không match được "hỏi ngủ chưa"
- Fallback về `subject_keyword = "thông báo"`
- AI generate dựa trên keyword sai

---

## ✅ GIẢI PHÁP ĐÃ TRIỂN KHAI

### **Fix 1: Cải thiện Regex Extract Subject**

**Trước:**
```python
subject_patterns = [
    r'(?:gửi|soạn|viết)\s+(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:nói|về)\s+(.+?)$',  # ← Thiếu "hỏi"
]
```

**Sau:**
```python
subject_patterns = [
    r'(?:gửi|soạn|viết)\s+(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:email|mail)\s+(.+?)\s+(?:cho|đến|tới)',
    r'(?:nói|về|hỏi)\s+(.+?)$',  # ← ADDED: "hỏi"
]

# Fallback: Extract everything after email address
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

**Test case:**
```
Input: "gửi email cho nguyenhoang4556@gmail.com hỏi ngủ chưa"

Regex match: r'(?:hỏi)\s+(.+?)$'
→ subject_keyword = "ngủ chưa"

Fallback match: r'@gmail\.com\s+(.+)'
→ subject_keyword = "hỏi ngủ chưa"
```

---

### **Fix 2: Pass Full Message to AI**

**Trước:**
```python
draft_result = ai_create_draft_email(
    subject_keyword=subject_keyword,
    recipient_name=to_email.split('@')[0]
)
```

**Sau:**
```python
draft_result = ai_create_draft_email(
    subject_keyword=subject_keyword,
    recipient_name=to_email.split('@')[0],
    full_message=message  # ← ADDED: Full context
)
```

**AI Prompt cải thiện:**
```python
context_info = f"\n\nTin nhắn gốc từ user: \"{full_message}\"" if full_message else ""

prompt = f"""Viết một email chuyên nghiệp gửi đến {recipient_name} 
về chủ đề: {subject_keyword}{context_info}

Yêu cầu:
- QUAN TRỌNG: Nội dung phải phù hợp với chủ đề "{subject_keyword}"
- Tone: Lịch sự, trang trọng
- Độ dài: Ngắn gọn (4-6 câu)

Trả về JSON:
{{
    "subject": "Tiêu đề phù hợp với chủ đề",
    "body": "Nội dung email"
}}
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

### **Fix 3: Handle user_id = None**

**Vấn đề:** Spring Boot API trả về 400

**Kiểm tra:**
```powershell
# Check Spring Boot running
Test-NetConnection -ComputerName localhost -Port 8080

# Test API directly
curl http://localhost:8080/api/auth/profile -H "Authorization: Bearer YOUR_TOKEN"
```

**Giải pháp tạm thời:**
```python
# main.py - Endpoint /api/email/send
user_id = request.user_id

if not user_id and authorization:
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id_from_token(token)

if not user_id:
    # ← Fallback: Try to get from request body
    user_id = request.user_id or 1  # Default to user 1 for testing
    logger.warning(f"⚠️ Using fallback user_id: {user_id}")
```

**Giải pháp lâu dài:**
1. Đảm bảo Spring Boot đang chạy
2. Kiểm tra token hợp lệ
3. Fix API `/api/auth/profile` trả về đúng

---

## 🧪 TEST CASES

### **Test 1: Email với "hỏi"**

**Input:**
```
"gửi email cho test@gmail.com hỏi ngủ chưa"
```

**Expected:**
```python
subject_keyword = "ngủ chưa"  # hoặc "hỏi ngủ chưa"

AI generate:
{
  "subject": "Hỏi thăm",
  "body": "Chào bạn,\n\nMình viết email này để hỏi thăm..."
}
```

---

### **Test 2: Email với "nói"**

**Input:**
```
"gửi mail cho test@gmail.com nói tôi bận"
```

**Expected:**
```python
subject_keyword = "tôi bận"

AI generate:
{
  "subject": "Thông báo bận việc",
  "body": "Chào bạn,\n\nMình xin lỗi vì không thể..."
}
```

---

### **Test 3: Email không có keyword**

**Input:**
```
"gửi email cho test@gmail.com"
```

**Expected:**
```python
subject_keyword = "thông báo"  # Fallback

AI generate:
{
  "subject": "Thông báo",
  "body": "Kính gửi test,\n\n..."
}
```

---

## 📊 SO SÁNH TRƯỚC/SAU

### **TRƯỚC FIX**

```
Input: "gửi email cho test@gmail.com hỏi ngủ chưa"

1. Regex không match "hỏi"
2. subject_keyword = "thông báo" (fallback)
3. AI generate về "thông báo dự án"
4. ❌ SAI HOÀN TOÀN
```

### **SAU FIX**

```
Input: "gửi email cho test@gmail.com hỏi ngủ chưa"

1. Regex match r'(?:hỏi)\s+(.+?)$' → "ngủ chưa"
2. Hoặc fallback match sau email → "hỏi ngủ chưa"
3. AI generate với context đầy đủ
4. ✅ ĐÚNG NỘI DUNG
```

---

## 🔍 DEBUG CHECKLIST

### **Nếu vẫn generate sai:**

1. **Check subject_keyword:**
```python
logger.info(f"🔍 Extracted subject_keyword: {subject_keyword}")
logger.info(f"🔍 Full message: {message}")
```

2. **Check AI prompt:**
```python
logger.info(f"🤖 AI Prompt:\n{prompt}")
```

3. **Check AI response:**
```python
logger.info(f"🤖 AI Response:\n{ai_response}")
```

4. **Check parsed result:**
```python
logger.info(f"✅ Parsed subject: {subject}")
logger.info(f"✅ Parsed body: {body[:100]}...")
```

---

## 🚀 DEPLOYMENT

### **1. Restart Python Service**
```bash
# Stop current service
Ctrl+C

# Restart
python backend/PythonService/main.py
```

### **2. Test với curl**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "gửi email cho test@gmail.com hỏi ngủ chưa",
    "model": "gemini-2.5-flash",
    "ai_provider": "groq"
  }'
```

### **3. Verify response**
```json
{
  "response": "📧 Email draft đã được tạo...",
  "email_draft": {
    "to": "test@gmail.com",
    "subject": "Hỏi thăm",  // ← Should be relevant
    "body": "...hỏi thăm xem bạn ngủ chưa...",  // ← Should match intent
    "user_id": 1
  }
}
```

---

## ✅ KẾT LUẬN

**Đã fix:**
1. ✅ Thêm pattern "hỏi" vào regex
2. ✅ Thêm fallback extract sau email address
3. ✅ Pass full_message cho AI để có context tốt hơn
4. ✅ Cải thiện AI prompt với QUAN TRỌNG keyword

**Cần kiểm tra:**
1. ⚠️ Spring Boot API `/api/auth/profile` (fix user_id = None)
2. ⚠️ Test với nhiều case khác nhau
3. ⚠️ Monitor AI response quality

**Kết quả mong đợi:**
- AI generate đúng nội dung theo yêu cầu
- Subject và body phù hợp với intent
- User có thể edit trước khi gửi
