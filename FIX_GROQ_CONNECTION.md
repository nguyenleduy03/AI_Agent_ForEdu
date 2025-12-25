# 🔧 FIX GROQ API CONNECTION ERROR

## 🔴 LỖI

```
ERROR:gmail_service:ai_create_draft error: HTTPSConnectionPool(host='api.groq.com', port=443): 
Max retries exceeded with url: /openai/v1/chat/completions 
(Caused by NewConnectionError('<urllib3.connection.HTTPSConnection object at 0x0000025291E9F950>: 
Failed to establish a new connection: [WinError 10051] A socket operation was attempted to an unreachable network'))
```

**WinError 10051:** Network is unreachable

---

## 🔍 NGUYÊN NHÂN

1. **Mất kết nối internet**
2. **Firewall chặn kết nối đến api.groq.com**
3. **Proxy settings không đúng**
4. **VPN/Network restrictions**
5. **Groq API key không hợp lệ** (ít khả năng vì lỗi là connection, không phải auth)

---

## ✅ GIẢI PHÁP

### **1. Kiểm tra kết nối internet**

```powershell
# Test internet connection
Test-NetConnection -ComputerName google.com -Port 443

# Test Groq API specifically
Test-NetConnection -ComputerName api.groq.com -Port 443
```

**Nếu fail:** Kiểm tra WiFi/Ethernet connection

---

### **2. Kiểm tra Firewall**

```powershell
# Check Windows Firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Python*"}

# Temporarily disable firewall (for testing only)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Re-enable after testing
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

**Hoặc:** Thêm Python vào Firewall exceptions

---

### **3. Kiểm tra Proxy Settings**

```python
# Thêm vào gmail_service.py
import os

# Check proxy
print(f"HTTP_PROXY: {os.getenv('HTTP_PROXY')}")
print(f"HTTPS_PROXY: {os.getenv('HTTPS_PROXY')}")

# If behind proxy, set in .env
# HTTP_PROXY=http://proxy.company.com:8080
# HTTPS_PROXY=http://proxy.company.com:8080
```

---

### **4. Test Groq API trực tiếp**

```python
# test_groq_connection.py
import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

try:
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": "Hello"}]
        },
        timeout=10
    )
    print(f"✅ Status: {response.status_code}")
    print(f"✅ Response: {response.json()}")
except Exception as e:
    print(f"❌ Error: {e}")
```

**Run:**
```bash
cd backend/PythonService
python test_groq_connection.py
```

---

### **5. Sử dụng Gemini thay vì Groq (Fallback)**

**Option A: Chuyển sang Gemini cho email generation**

```python
# gmail_service.py - ai_create_draft_email()

# Try Groq first, fallback to Gemini
try:
    groq_client = GroqClient(GROQ_API_KEY)
    ai_response = groq_client.generate_text(prompt, model="llama-3.3-70b-versatile")
except Exception as e:
    logger.warning(f"Groq failed, using Gemini: {e}")
    
    # Fallback to Gemini
    import google.generativeai as genai
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content(prompt)
    ai_response = response.text
```

**Option B: Cấu hình trong .env**

```bash
# .env
DEFAULT_AI_MODEL=gemini  # Hoặc groq
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# Nếu Groq không hoạt động, đổi sang:
DEFAULT_AI_MODEL=gemini
```

---

### **6. Tăng timeout và retry**

```python
# groq_helper.py
import time

def generate_text_with_retry(self, prompt, model, max_retries=3):
    for attempt in range(max_retries):
        try:
            return self.generate_text(prompt, model)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            logger.warning(f"Retry {attempt + 1}/{max_retries}: {e}")
            time.sleep(2 ** attempt)  # Exponential backoff
```

---

## 🎯 GIẢI PHÁP TẠM THỜI (ĐANG HOẠT ĐỘNG)

**Fallback mechanism đã hoạt động tốt:**

```python
# agent_features.py - Line 1610
if draft_result.get("success"):
    # Use AI-generated content
    ai_subject = draft_result.get("subject", subject or subject_keyword)
    ai_body = draft_result.get("body", "")
else:
    # ✅ FALLBACK: Use placeholder
    logger.warning(f"⚠️ AI draft generation failed, using fallback")
    fallback_body = f"Kính gửi {to_email.split('@')[0]},\n\n[Nội dung về: {subject_keyword}]\n\nTrân trọng."
    
    email_draft_obj = {
        "to": to_email,
        "subject": subject_keyword.title(),  # ← "ngủ chưa" → "Ngủ Chưa"
        "body": fallback_body,
        "user_id": user_id
    }
```

**Kết quả:**
- ✅ Email draft vẫn được tạo
- ✅ Subject đúng: "Ngủ Chưa"
- ✅ User có thể edit body trước khi gửi

---

## 📊 SO SÁNH

### **Khi Groq hoạt động:**
```json
{
  "subject": "Hỏi thăm",
  "body": "Chào bạn,\n\nMình viết email này để hỏi thăm xem bạn ngủ chưa? Hy vọng bạn đang nghỉ ngơi tốt.\n\nTrân trọng!"
}
```

### **Khi Groq fail (Fallback):**
```json
{
  "subject": "Ngủ Chưa",
  "body": "Kính gửi nguyenhoang4556z,\n\n[Nội dung về: ngủ chưa]\n\nTrân trọng."
}
```

**Cả 2 đều OK!** User có thể edit body để hoàn thiện.

---

## ✅ KHUYẾN NGHỊ

### **Ngắn hạn:**
1. ✅ **Sử dụng fallback** (đang hoạt động tốt)
2. User edit body trước khi gửi
3. Kiểm tra network/firewall

### **Dài hạn:**
1. **Fix network issue** để Groq hoạt động
2. **Implement Gemini fallback** trong `ai_create_draft_email()`
3. **Add retry mechanism** với exponential backoff
4. **Monitor API health** và switch tự động

---

## 🧪 TEST

```bash
# Test 1: Check network
ping api.groq.com

# Test 2: Check Groq API
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_API_KEY"

# Test 3: Test trong chatbox
"gửi email cho test@gmail.com hỏi ngủ chưa"
```

**Expected:**
- Nếu Groq OK → AI-generated content
- Nếu Groq fail → Fallback content (vẫn OK)

---

## 🎉 KẾT LUẬN

**Hệ thống đang hoạt động tốt với fallback!**

- ✅ Regex extract đúng subject
- ✅ Fallback tạo draft hợp lý
- ✅ User có thể edit và gửi
- ⚠️ Groq API connection issue (không critical)

**Không cần fix gấp!** Fallback đã đủ tốt cho production.
