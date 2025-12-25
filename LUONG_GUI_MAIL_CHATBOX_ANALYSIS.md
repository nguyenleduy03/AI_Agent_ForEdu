# 📧 PHÂN TÍCH LUỒNG GỬI MAIL TỪ CHATBOX

## 🎯 TỔNG QUAN

Ứng dụng có hệ thống gửi email thông minh qua chatbox với 2 luồng chính:
1. **Luồng có địa chỉ email** - User cung cấp đầy đủ thông tin
2. **Luồng gợi ý contacts** - AI gợi ý danh bạ từ Gmail

---

## 📊 KIẾN TRÚC TỔNG THỂ

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌──────────────┐    ┌──────────────────────────────────┐  │
│  │  ChatPage    │───▶│  EmailDraftPreview Component     │  │
│  │  (User Input)│    │  (Edit & Send Email)             │  │
│  └──────────────┘    └──────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND - Python FastAPI (Port 8000)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py                                              │  │
│  │  • POST /api/chat (Detect email intent)              │  │
│  │  • POST /api/email/send (Send confirmed email)       │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  agent_features.py                                    │  │
│  │  • detect_email_intent()                              │  │
│  │  • detect_gmail_send_intent()                         │  │
│  │  • handle_gmail_send() ◀── CORE LOGIC                │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  gmail_service.py                                     │  │
│  │  • ai_create_draft_email() - Generate with AI        │  │
│  │  • ai_send_email() - Send via Gmail API              │  │
│  │  • ai_get_contacts() - Get frequent contacts         │  │
│  └────────────────┬─────────────────────────────────────┘  │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           EXTERNAL SERVICES                                  │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Gmail API       │    │  Groq AI (Llama 3.3 70B)     │  │
│  │  (OAuth 2.0)     │    │  (Generate email content)    │  │
│  └──────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 LUỒNG XỬ LÝ CHI TIẾT

### **BƯỚC 1: User nhập tin nhắn trong chatbox**

**Frontend: `ChatPage.tsx`**
```typescript
// User gõ: "gửi mail xin nghỉ học đến teacher@tvu.edu.vn"
const handleSendMessage = async () => {
  const response = await fetch('http://localhost:8000/api/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: userMessage,
      model: selectedModel,
      ai_provider: aiProvider,
      use_rag: true
    })
  });
};
```

---

### **BƯỚC 2: Backend nhận request và phát hiện intent**

**Backend: `main.py` - Endpoint `/api/chat`**

```python
@app.post("/api/chat", tags=["Chat"])
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    # 1. Extract token và user_id
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id_from_token(token)
    
    # 2. Detect email intent
    if agent_features.detect_email_intent(request.message):
        print(f"✅ 📧 Detected email intent")
        
        # 3. Route to Gmail handler
        if agent_features.detect_gmail_send_intent(request.message):
            result = agent_features.handle_gmail_send(
                request.message, 
                token, 
                user_id=user_id
            )
```

**Các pattern phát hiện email intent:**

```python
# agent_features.py - detect_gmail_send_intent()
patterns = [
    r'gửi email',      # Có dấu
    r'gui email',      # Không dấu
    r'send email',     # English
    r'email cho',      # Email cho ai đó
    r'mail den',       # Mail đến
    r'soạn email',     # Soạn thảo
    r'viết email'      # Viết email
]
```

---

### **BƯỚC 3: Xử lý logic gửi email**

**Backend: `agent_features.py` - `handle_gmail_send()`**

#### **3.1. Parse thông tin từ message**

```python
def handle_gmail_send(self, message: str, token: str, user_id: int = None):
    message_lower = message.lower()
    
    # Extract email address
    to_match = re.search(
        r'(?:cho|to|tới|đến)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', 
        message_lower
    )
    
    # Extract subject
    subject_match = re.search(
        r'(?:chủ đề|subject|tiêu đề)\s*[:\"]?\s*(.+?)(?:\s*nội dung|\s*body|$)', 
        message
    )
    
    # Extract body
    body_match = re.search(
        r'(?:nội dung|body|content|nói|về)\s*[:\"]?\s*(.+)', 
        message
    )
```

#### **3.2. Trường hợp 1: Có đầy đủ thông tin**

```python
if to_match:
    to_email = to_match.group(1)
    subject = subject_match.group(1) if subject_match else None
    body = body_match.group(1) if body_match else None
    
    # Nếu thiếu subject hoặc body → Generate bằng AI
    if not subject or not body:
        draft_result = ai_create_draft_email(
            subject_keyword=subject_keyword,
            recipient_name=to_email.split('@')[0]
        )
```

#### **3.3. Trường hợp 2: Chỉ có chủ đề, chưa có email**

```python
# VD: "gửi mail xin nghỉ học"
if subject_keyword and not has_email:
    if not user_id:
        return {
            "message": "Vui lòng cung cấp địa chỉ email người nhận"
        }
    
    # Get contacts from Gmail
    contacts_result = ai_get_contacts(user_id, max_results=10)
    
    return {
        "success": True,
        "message": "📧 Chọn người nhận:\n1. teacher@tvu.edu.vn\n2. ...",
        "action": "select_recipient",
        "contacts": contacts,
        "awaiting_selection": True
    }
```

---

### **BƯỚC 4: Generate email content bằng AI**

**Backend: `gmail_service.py` - `ai_create_draft_email()`**

```python
def ai_create_draft_email(subject_keyword: str, recipient_name: str = None):
    from groq_helper import GroqClient
    
    groq_client = GroqClient(GROQ_API_KEY)
    
    prompt = f"""Viết một email chuyên nghiệp gửi đến {recipient_name} 
về chủ đề: {subject_keyword}

Yêu cầu:
- Tone: Lịch sự, trang trọng
- Độ dài: Ngắn gọn (4-6 câu)
- Cấu trúc: Lời chào → Nội dung → Kết thúc

Trả về JSON:
{{
    "subject": "Tiêu đề email",
    "body": "Nội dung email"
}}
"""
    
    ai_response = groq_client.generate_text(
        prompt=prompt,
        model="llama-3.3-70b-versatile"
    )
    
    # Parse JSON
    email_data = json.loads(ai_response)
    return {
        "success": True,
        "subject": email_data["subject"],
        "body": email_data["body"]
    }
```

**Ví dụ output:**
```json
{
  "subject": "Xin phép nghỉ học",
  "body": "Kính gửi thầy,\n\nEm xin phép được nghỉ học buổi học ngày mai do có việc gia đình đột xuất. Em sẽ tự học bài và làm bài tập đầy đủ.\n\nEm xin chân thành cảm ơn thầy.\n\nTrân trọng."
}
```

---

### **BƯỚC 5: Trả về email draft cho frontend**

**Backend: `agent_features.py`**

```python
# Return email_draft object
email_draft_obj = {
    "to": to_email,
    "subject": subject,
    "body": body,
    "user_id": user_id
}

return {
    "success": True,
    "message": "📧 Email draft đã được tạo. Vui lòng kiểm tra và gửi.",
    "action": "email_draft",
    "email_draft": email_draft_obj
}
```

**Backend: `main.py` - Response**

```python
# Extract email_draft from result
email_draft_data = result.get('email_draft')
email_draft = EmailDraft(**email_draft_data) if email_draft_data else None

chat_response = ChatResponse(
    response=response_text,
    model=request.model,
    rag_enabled=False,
    email_draft=email_draft  # ← Trả về cho frontend
)

return chat_response.model_dump()
```

---

### **BƯỚC 6: Frontend hiển thị email draft**

**Frontend: `ChatPage.tsx`**

```typescript
// Parse response
const aiResponse = await response.json();
const emailDraft = aiResponse.email_draft || aiResponse.emailDraft;

// Create AI message with email draft
const aiMessage: Message = {
  id: Date.now().toString(),
  sender: 'ai',
  text: emailDraft ? '📧 Email draft đã được tạo' : responseText,
  emailDraft: emailDraft,  // ← Attach draft
  timestamp: new Date()
};

// Add to messages
setMessages(prev => [...prev, aiMessage]);
```

**Render email draft component:**

```tsx
{message.sender === 'ai' && message.emailDraft && (
  <EmailDraftPreview
    draft={message.emailDraft}
    userId={user?.id}
    onSent={() => {
      toast.success('Email đã gửi!');
    }}
  />
)}
```

---

### **BƯỚC 7: User chỉnh sửa và gửi email**

**Frontend: `EmailDraftPreview.tsx`**

```tsx
export const EmailDraftPreview = ({ draft, userId, onSent }) => {
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    
    const token = localStorage.getItem('token');
    
    // Call API to send email
    const response = await fetch('http://localhost:8000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        user_id: userId,  // ← Current logged-in user
      }),
    });

    if (response.ok) {
      toast.success('✅ Email đã được gửi!');
      onSent?.();
    }
  };

  return (
    <form onSubmit={handleSend}>
      <input value={to} onChange={(e) => setTo(e.target.value)} />
      <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit">📨 Gửi Email</button>
    </form>
  );
};
```

---

### **BƯỚC 8: Backend gửi email qua Gmail API**

**Backend: `main.py` - Endpoint `/api/email/send`**

```python
@app.post("/api/email/send", tags=["Email"])
async def send_email_confirmed(
    request: SendEmailRequest, 
    authorization: Optional[str] = Header(None)
):
    # Get user_id from request or token
    user_id = request.user_id
    
    if not user_id and authorization:
        token = authorization.replace("Bearer ", "")
        user_id = get_user_id_from_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Không thể xác thực")
    
    # Send email via Gmail API
    from gmail_service import ai_send_email
    
    result = ai_send_email(
        user_id=user_id,
        to=request.to,
        subject=request.subject,
        body=request.body
    )
    
    if result.get('success'):
        return {
            "success": True,
            "message": f"✅ Email đã gửi thành công tới {request.to}!"
        }
```

**Backend: `gmail_service.py` - `ai_send_email()`**

```python
def ai_send_email(user_id: int, to: str, subject: str, body: str) -> Dict:
    result = gmail_service.send_email(user_id, to, subject, body)
    
    if result.get("success"):
        return {"success": True}
    else:
        return {"success": False, "error": result.get("error")}
```

**Backend: `gmail_service.py` - `GmailService.send_email()`**

```python
class GmailService:
    def send_email(self, user_id: int, to: str, subject: str, body: str):
        # 1. Get OAuth access token
        access_token = self._get_access_token(user_id)
        
        # 2. Get sender email from Gmail profile
        profile_response = requests.get(
            f"{GMAIL_API_URL}/users/me/profile",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        sender_email = profile_response.json()["emailAddress"]
        
        # 3. Create MIME message
        message = MIMEText(body)
        message["to"] = to
        message["from"] = sender_email
        message["subject"] = subject
        
        # 4. Encode to base64
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        # 5. Send via Gmail API
        response = requests.post(
            f"{GMAIL_API_URL}/users/me/messages/send",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"raw": raw_message}
        )
        
        if response.status_code == 200:
            return {"success": True, "message": f"✅ Đã gửi email đến {to}"}
```

---

## 🔐 XÁC THỰC VÀ BẢO MẬT

### **OAuth 2.0 Flow**

```
┌──────────┐                                    ┌──────────────┐
│  User    │                                    │ OAuth Service│
│          │                                    │ (Port 8003)  │
└────┬─────┘                                    └──────┬───────┘
     │                                                  │
     │ 1. Login & Connect Google                       │
     ├─────────────────────────────────────────────────▶
     │                                                  │
     │ 2. Redirect to Google OAuth                     │
     │◀─────────────────────────────────────────────────┤
     │                                                  │
     │ 3. User grants permissions                       │
     │                                                  │
     │ 4. Google returns auth code                      │
     ├─────────────────────────────────────────────────▶
     │                                                  │
     │ 5. Exchange code for tokens                      │
     │                                                  │
     │ 6. Store tokens in database                      │
     │◀─────────────────────────────────────────────────┤
     │                                                  │
     │ 7. Return success                                │
     │◀─────────────────────────────────────────────────┤
     │                                                  │
```

### **Token Management**

```python
# gmail_service.py
def _get_access_token(self, user_id: int) -> Optional[str]:
    """
    Lấy access token từ OAuth service
    Tự động refresh nếu expired
    """
    response = requests.get(
        f"{OAUTH_SERVICE_URL}/api/oauth/google/token/{user_id}"
    )
    
    if response.status_code == 200:
        data = response.json()
        return data.get('access_token')
```

**Scopes yêu cầu:**
- `https://www.googleapis.com/auth/gmail.send` - Gửi email
- `https://www.googleapis.com/auth/gmail.readonly` - Đọc email
- `https://www.googleapis.com/auth/gmail.modify` - Sửa labels

---

## 📝 CÁC TRƯỜNG HỢP SỬ DỤNG

### **Case 1: Gửi email đầy đủ thông tin**

**Input:**
```
"gửi email cho teacher@tvu.edu.vn chủ đề Xin nghỉ học nội dung Em xin phép nghỉ học ngày mai"
```

**Flow:**
1. ✅ Detect email intent
2. ✅ Parse: to, subject, body
3. ✅ Return email draft
4. ✅ User confirm & send

---

### **Case 2: Gửi email thiếu nội dung - AI generate**

**Input:**
```
"gửi mail xin nghỉ học đến teacher@tvu.edu.vn"
```

**Flow:**
1. ✅ Detect email intent
2. ✅ Parse: to = "teacher@tvu.edu.vn", subject_keyword = "xin nghỉ học"
3. 🤖 AI generate subject + body
4. ✅ Return email draft
5. ✅ User edit & send

**AI Generated:**
```
Subject: Xin phép nghỉ học
Body: Kính gửi thầy,

Em xin phép được nghỉ học buổi học ngày mai do có việc gia đình đột xuất...
```

---

### **Case 3: Chỉ có chủ đề - Gợi ý contacts**

**Input:**
```
"gửi mail xin nghỉ học"
```

**Flow:**
1. ✅ Detect email intent
2. ❌ No email address found
3. 📋 Get contacts from Gmail
4. ✅ Show contact list
5. ⏳ Wait for user selection

**Response:**
```
📧 Gửi email: xin nghỉ học

📋 Chọn người nhận:
1. Nguyễn Văn A (teacher@tvu.edu.vn) _5 emails_
2. Trần Thị B (admin@tvu.edu.vn) _3 emails_
3. ...

💡 Cách chọn:
• Nhắn số: "1" hoặc "chọn 1"
• Hoặc gõ email trực tiếp
```

---

### **Case 4: Không có quyền Gmail - Yêu cầu kết nối**

**Input:**
```
"gửi mail xin nghỉ học đến teacher@tvu.edu.vn"
```

**Flow (user chưa connect Google):**
1. ✅ Detect email intent
2. ✅ Parse email info
3. 🤖 AI generate draft
4. ✅ Return draft
5. ❌ User click Send → Error: Need OAuth

**Response:**
```
🔐 Cần kết nối Gmail

Để gửi email, bạn cần kết nối Google Account trong Settings.

👉 Vào Settings → Connect Google
```

---

## 🐛 XỬ LÝ LỖI

### **Lỗi 1: Không có token**

```python
if not user_id:
    raise HTTPException(
        status_code=401,
        detail="Không thể xác thực người dùng. Vui lòng đăng nhập lại!"
    )
```

### **Lỗi 2: Chưa kết nối Google**

```python
if result.get('need_auth'):
    return {
        "success": False,
        "message": "🔐 Cần kết nối Google Account trong Settings",
        "need_auth": True,
        "auth_url": f"{OAUTH_SERVICE_URL}/auth/google"
    }
```

### **Lỗi 3: Gmail API error**

```python
if response.status_code != 200:
    return {
        "success": False,
        "error": f"Lỗi Gmail API: {response.status_code}"
    }
```

### **Lỗi 4: AI generation failed**

```python
if not draft_result.get("success"):
    # Fallback to placeholder
    fallback_body = f"Kính gửi {to_email.split('@')[0]},\n\n[Nội dung về: {subject_keyword}]\n\nTrân trọng."
    
    return {
        "success": True,
        "email_draft": {
            "to": to_email,
            "subject": subject_keyword.title(),
            "body": fallback_body
        }
    }
```

---

## 🎨 UI/UX FLOW

### **Giao diện Email Draft Preview**

```
┌─────────────────────────────────────────────────────┐
│  📧 Xem trước Email                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📧 Người nhận                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │ teacher@tvu.edu.vn                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  📌 Chủ đề                                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ Xin phép nghỉ học                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  📄 Nội dung                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Kính gửi thầy,                                 │ │
│  │                                                 │ │
│  │ Em xin phép được nghỉ học buổi học ngày mai   │ │
│  │ do có việc gia đình đột xuất. Em sẽ tự học    │ │
│  │ bài và làm bài tập đầy đủ.                     │ │
│  │                                                 │ │
│  │ Em xin chân thành cảm ơn thầy.                 │ │
│  │                                                 │ │
│  │ Trân trọng.                                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │          📨 Gửi Email                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  💡 Bạn có thể chỉnh sửa nội dung trước khi gửi     │
└─────────────────────────────────────────────────────┘
```

### **States của component**

```typescript
interface EmailDraftState {
  to: string;           // Editable
  subject: string;      // Editable
  body: string;         // Editable
  sending: boolean;     // Loading state
}
```

---

## 🔧 CẤU HÌNH VÀ DEPENDENCIES

### **Backend Dependencies**

```python
# requirements.txt
fastapi
pydantic
requests
google-generativeai
python-dotenv
groq  # For AI generation
```

### **Environment Variables**

```bash
# .env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OAUTH_SERVICE_URL=http://localhost:8003
```

### **Frontend Dependencies**

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-hot-toast": "^2.4.1",
    "typescript": "^5.0.0"
  }
}
```

---

## 📊 PERFORMANCE & OPTIMIZATION

### **Caching Strategies**

1. **Contact List Caching**
   - Cache frequent contacts trong 1 giờ
   - Giảm số lần gọi Gmail API

2. **Token Caching**
   - OAuth service tự động cache access token
   - Refresh token khi expired

### **Rate Limiting**

```python
# Gmail API limits
- 250 emails/day (free tier)
- 1 billion emails/day (paid)
- 25 MB attachment size limit
```

### **Error Retry Logic**

```python
# Retry failed Gmail API calls
max_retries = 3
for attempt in range(max_retries):
    try:
        result = gmail_service.send_email(...)
        break
    except Exception as e:
        if attempt == max_retries - 1:
            raise
        time.sleep(2 ** attempt)  # Exponential backoff
```

---

## 🧪 TESTING

### **Unit Tests**

```python
# test_email_intent.py
def test_detect_email_intent():
    agent = AgentFeatures()
    
    assert agent.detect_email_intent("gửi email cho teacher@tvu.edu.vn")
    assert agent.detect_email_intent("gui mail xin nghỉ học")
    assert not agent.detect_email_intent("hôm nay tôi học gì?")

def test_parse_email_info():
    message = "gửi email cho teacher@tvu.edu.vn chủ đề Test nội dung Hello"
    result = agent.handle_gmail_send(message, token="", user_id=1)
    
    assert result["email_draft"]["to"] == "teacher@tvu.edu.vn"
    assert result["email_draft"]["subject"] == "Test"
    assert "Hello" in result["email_draft"]["body"]
```

### **Integration Tests**

```python
# test_email_flow.py
async def test_full_email_flow():
    # 1. Send chat message
    response = await client.post("/api/chat", json={
        "message": "gửi mail test đến test@example.com"
    })
    
    # 2. Verify draft returned
    assert response.json()["email_draft"] is not None
    
    # 3. Send email
    draft = response.json()["email_draft"]
    send_response = await client.post("/api/email/send", json=draft)
    
    # 4. Verify sent
    assert send_response.json()["success"] == True
```

---

## 🚀 FUTURE IMPROVEMENTS

### **1. Email Templates**
- Lưu templates thường dùng
- Quick select template khi compose

### **2. Scheduled Emails**
- Hẹn giờ gửi email
- Recurring emails

### **3. Email Tracking**
- Track email opened
- Track link clicks

### **4. Attachments**
- Support file attachments
- Drag & drop files

### **5. Rich Text Editor**
- HTML email formatting
- Inline images
- Emoji picker

### **6. Email History**
- View sent emails
- Resend previous emails
- Email analytics

---

## 📚 TÀI LIỆU THAM KHẢO

1. **Gmail API Documentation**
   - https://developers.google.com/gmail/api

2. **OAuth 2.0 Flow**
   - https://developers.google.com/identity/protocols/oauth2

3. **Groq AI API**
   - https://console.groq.com/docs

4. **FastAPI Documentation**
   - https://fastapi.tiangolo.com/

---

## ✅ CHECKLIST TRIỂN KHAI

- [x] Backend detect email intent
- [x] Parse email info từ message
- [x] AI generate email content
- [x] Return email draft to frontend
- [x] Frontend display email preview
- [x] User edit email draft
- [x] Send email via Gmail API
- [x] OAuth 2.0 authentication
- [x] Error handling
- [x] Loading states
- [x] Success/error toasts
- [ ] Email templates
- [ ] Scheduled emails
- [ ] Attachments support
- [ ] Rich text editor

---

## 🎯 KẾT LUẬN

Hệ thống gửi mail từ chatbox đã được triển khai hoàn chỉnh với các tính năng:

✅ **Thông minh**: AI tự động generate nội dung email
✅ **Linh hoạt**: Hỗ trợ nhiều cú pháp nhập liệu
✅ **An toàn**: OAuth 2.0 authentication
✅ **User-friendly**: Preview & edit trước khi gửi
✅ **Robust**: Error handling đầy đủ

**Luồng chính:**
```
User Input → Detect Intent → Parse Info → AI Generate → 
Preview Draft → User Edit → Send via Gmail API → Success
```

Hệ thống hoạt động ổn định và sẵn sàng cho production! 🚀
