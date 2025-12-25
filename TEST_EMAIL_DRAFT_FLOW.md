# 🔍 KIỂM TRA LUỒNG EMAIL DRAFT

## ✅ PHÁT HIỆN VẤN ĐỀ

Sau khi kiểm tra chi tiết code, tôi phát hiện luồng hoạt động **ĐÚNG** nhưng có một số điểm cần lưu ý:

---

## 📊 LUỒNG HIỆN TẠI

### **BACKEND → FRONTEND**

#### **1. Backend trả về (main.py)**

```python
# Line 929-958 trong main.py
email_draft_data = result.get('email_draft')  # ← Lấy từ agent_features
email_draft = None

if email_draft_data:
    print(f"✅ Email draft found: {email_draft_data}")
    email_draft = EmailDraft(**email_draft_data)  # ← Tạo Pydantic model
    print(f"✅ EmailDraft object created: {email_draft}")

chat_response = ChatResponse(
    response=response_text,
    model=request.model,
    rag_enabled=False,
    email_draft=email_draft  # ← Gán vào response
)

response_dict = chat_response.model_dump()  # ← Convert to dict

# Ensure email_draft is in response
if 'email_draft' not in response_dict:
    response_dict['email_draft'] = None

return response_dict  # ← Trả về JSON
```

**Output JSON:**
```json
{
  "response": "📧 Email draft đã được tạo...",
  "model": "gemini-2.5-flash",
  "rag_enabled": false,
  "email_draft": {
    "to": "teacher@tvu.edu.vn",
    "subject": "Xin phép nghỉ học",
    "body": "Kính gửi thầy,...",
    "user_id": 1
  }
}
```

---

#### **2. Frontend nhận response (ChatPage.tsx)**

```typescript
// Line 430-459 trong ChatPage.tsx
const aiResponse = await response.json();

console.log('🔍 FULL API RESPONSE:', JSON.stringify(aiResponse, null, 2));
console.log('🔍 Email draft from API (snake_case):', aiResponse.email_draft);
console.log('🔍 Email draft from API (camelCase):', aiResponse.emailDraft);

// ✅ Check both snake_case and camelCase
let emailDraft = aiResponse.email_draft || aiResponse.emailDraft;

// ⚠️ FALLBACK: Parse from text if API didn't return email_draft
if (!emailDraft && responseText.includes('**Người nhận:**')) {
  // Parse từ text response (backup plan)
  const toMatch = responseText.match(/\*\*Người nhận:\*\*\s*([^\n*]+)/);
  const subjectMatch = responseText.match(/\*\*Chủ đề:\*\*\s*([^\n*]+)/);
  
  if (toMatch && subjectMatch) {
    emailDraft = {
      to: toMatch[1].trim(),
      subject: subjectMatch[1].trim(),
      body: bodyMatch ? bodyMatch[1].trim() : '',
      user_id: user?.id
    };
  }
}

console.log('📧 Final emailDraft:', emailDraft);
```

---

#### **3. Tạo message với emailDraft**

```typescript
// Line 462-471
const aiMessage: Message = {
  id: (Date.now() + 1).toString(),
  sender: 'ai',
  text: emailDraft ? '📧 Email draft đã được tạo. Vui lòng kiểm tra và gửi.' : responseText,
  timestamp: new Date(),
  actions: aiResponse.suggested_actions || [],
  toolAction: aiResponse.tool_action,
  emailDraft: emailDraft,  // ← Attach email draft
};

console.log('📧 Message created with emailDraft:', aiMessage.emailDraft);

// Add to messages state
setMessages((prev) => [...prev, aiMessage]);
```

---

#### **4. Render EmailDraftPreview component**

```tsx
// Line 1021-1040
{message.sender === 'ai' && message.emailDraft && (
  <div className="mt-2">
    <ErrorBoundary fallback={
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">⚠️ Không thể hiển thị email draft</p>
      </div>
    }>
      <EmailDraftPreview
        draft={message.emailDraft}  // ← Pass draft
        userId={user?.id}            // ← Pass current user ID
        onSent={() => {
          toast.success('Email đã được gửi!');
        }}
      />
    </ErrorBoundary>
  </div>
)}
```

---

## ✅ ĐIỂM MẠNH

### **1. Xử lý cả snake_case và camelCase**
```typescript
let emailDraft = aiResponse.email_draft || aiResponse.emailDraft;
```
- Pydantic v2 có thể trả về `email_draft` (snake_case)
- Hoặc `emailDraft` (camelCase) tùy config
- Frontend check cả 2 → **An toàn**

### **2. Fallback parsing từ text**
```typescript
if (!emailDraft && responseText.includes('**Người nhận:**')) {
  // Parse từ text nếu API không trả về email_draft
}
```
- Nếu backend không trả về `email_draft` object
- Frontend vẫn có thể parse từ text response
- **Backup plan tốt**

### **3. ErrorBoundary bảo vệ**
```tsx
<ErrorBoundary fallback={...}>
  <EmailDraftPreview ... />
</ErrorBoundary>
```
- Nếu component crash → Hiển thị fallback UI
- Không làm crash toàn bộ chat

### **4. Skip database save cho email draft**
```typescript
if (!aiResponse.email_draft) {
  // Only save normal messages
  await saveMessageMutation.mutateAsync({...});
} else {
  console.log('⏭️ Skipping database save for email draft message');
}
```
- Email draft không lưu vào database
- Tránh spam database với draft messages

---

## ⚠️ VẤN ĐỀ TIỀM ẨN

### **1. Pydantic model_dump() có thể trả về snake_case**

**Backend:**
```python
class EmailDraft(BaseModel):
    to: str
    subject: str
    body: str
    user_id: Optional[int] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        # Ensure snake_case in JSON output  ← Comment này
    )
```

**Vấn đề:**
- Pydantic v2 mặc định serialize thành `snake_case`
- `user_id` → `user_id` (OK)
- Nhưng nếu có field `userId` → sẽ thành `user_id`

**Giải pháp hiện tại:**
- Frontend check cả 2: `aiResponse.email_draft || aiResponse.emailDraft` ✅

---

### **2. Fallback parsing có thể fail nếu format text thay đổi**

**Code:**
```typescript
if (!emailDraft && responseText.includes('**Người nhận:**')) {
  const toMatch = responseText.match(/\*\*Người nhận:\*\*\s*([^\n*]+)/);
  // ...
}
```

**Vấn đề:**
- Nếu AI response format thay đổi → Regex fail
- VD: "Người nhận" → "To" (English)
- VD: "**Người nhận:**" → "Người nhận:" (không bold)

**Giải pháp:**
- Luôn ưu tiên `email_draft` object từ API
- Fallback chỉ là backup

---

### **3. user_id có thể undefined**

**Frontend:**
```typescript
emailDraft = {
  to: toMatch[1].trim(),
  subject: subjectMatch[1].trim(),
  body: bodyMatch ? bodyMatch[1].trim() : '',
  user_id: user?.id  // ← Có thể undefined nếu chưa login
};
```

**Vấn đề:**
- Nếu user chưa login → `user?.id` = `undefined`
- Backend cần `user_id` để gửi email

**Giải pháp:**
- Backend đã handle: lấy `user_id` từ token nếu không có trong request
- EmailDraftPreview component cũng pass `userId={user?.id}`

---

## 🔧 KIỂM TRA THỰC TẾ

### **Test Case 1: Email draft trả về đúng**

**Input:**
```
"gửi mail xin nghỉ học đến teacher@tvu.edu.vn"
```

**Expected Backend Response:**
```json
{
  "response": "📧 Email draft đã được tạo. Vui lòng kiểm tra và gửi.",
  "email_draft": {
    "to": "teacher@tvu.edu.vn",
    "subject": "Xin phép nghỉ học",
    "body": "Kính gửi thầy,...",
    "user_id": 1
  }
}
```

**Frontend Flow:**
1. ✅ `aiResponse.email_draft` exists
2. ✅ `emailDraft` assigned
3. ✅ Message created with `emailDraft`
4. ✅ `EmailDraftPreview` rendered

---

### **Test Case 2: Backend không trả về email_draft (fallback)**

**Backend Response:**
```json
{
  "response": "📧 **Người nhận:** teacher@tvu.edu.vn\n**Chủ đề:** Xin nghỉ học\n**Nội dung:** Kính gửi thầy,..."
}
```

**Frontend Flow:**
1. ❌ `aiResponse.email_draft` is `null`
2. ✅ Fallback: Parse từ text
3. ✅ `emailDraft` created from regex
4. ✅ `EmailDraftPreview` rendered

---

### **Test Case 3: Cả 2 đều fail**

**Backend Response:**
```json
{
  "response": "Xin lỗi, tôi không thể tạo email draft."
}
```

**Frontend Flow:**
1. ❌ `aiResponse.email_draft` is `null`
2. ❌ Text không match regex
3. ❌ `emailDraft` = `undefined`
4. ✅ Chỉ hiển thị text response (không có EmailDraftPreview)

---

## 🎯 KẾT LUẬN

### ✅ **LUỒNG HOẠT ĐỘNG ĐÚNG**

1. **Backend trả về email_draft** trong ChatResponse ✅
2. **Frontend nhận và parse** email_draft ✅
3. **Tạo message** với emailDraft attached ✅
4. **Render component** EmailDraftPreview ✅

### ✅ **CÁC CƠ CHẾ BẢO VỆ**

- Check cả snake_case và camelCase ✅
- Fallback parsing từ text ✅
- ErrorBoundary bảo vệ component ✅
- Skip database save cho draft ✅

### ⚠️ **ĐIỂM CẦN LƯU Ý**

1. **Pydantic serialization**: Đảm bảo trả về đúng format
2. **Fallback regex**: Có thể fail nếu format thay đổi
3. **user_id handling**: Cần token hợp lệ để gửi email

---

## 🔍 DEBUG CHECKLIST

Nếu EmailDraftPreview không hiển thị, check:

### **Backend:**
```python
# 1. Check agent_features.py trả về đúng format
return {
    "success": True,
    "message": "...",
    "email_draft": {  # ← Phải có key này
        "to": "...",
        "subject": "...",
        "body": "...",
        "user_id": 1
    }
}

# 2. Check main.py extract đúng
email_draft_data = result.get('email_draft')  # ← Phải có data
if email_draft_data:
    email_draft = EmailDraft(**email_draft_data)  # ← Phải tạo được

# 3. Check response dict
response_dict = chat_response.model_dump()
print(f"email_draft in dict: {response_dict.get('email_draft')}")  # ← Phải có
```

### **Frontend:**
```typescript
// 1. Check API response
console.log('🔍 FULL API RESPONSE:', JSON.stringify(aiResponse, null, 2));
console.log('🔍 email_draft:', aiResponse.email_draft);

// 2. Check emailDraft assigned
console.log('📧 Final emailDraft:', emailDraft);

// 3. Check message created
console.log('📧 Message with emailDraft:', aiMessage.emailDraft);

// 4. Check render condition
console.log('Render condition:', message.sender === 'ai' && message.emailDraft);
```

---

## 🚀 KHUYẾN NGHỊ

### **1. Thêm validation**
```python
# agent_features.py
def validate_email_draft(draft: Dict) -> bool:
    required_fields = ['to', 'subject', 'body']
    return all(field in draft and draft[field] for field in required_fields)

if validate_email_draft(email_draft_obj):
    return {"email_draft": email_draft_obj}
else:
    logger.error("Invalid email draft")
```

### **2. Thêm type checking**
```typescript
// ChatPage.tsx
interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  user_id?: number;
}

function isValidEmailDraft(draft: any): draft is EmailDraft {
  return draft &&
    typeof draft.to === 'string' &&
    typeof draft.subject === 'string' &&
    typeof draft.body === 'string';
}

if (isValidEmailDraft(emailDraft)) {
  // Safe to use
}
```

### **3. Thêm error logging**
```typescript
if (!emailDraft) {
  console.warn('⚠️ No email draft found in response');
  console.warn('Response keys:', Object.keys(aiResponse));
  console.warn('Response text:', responseText.substring(0, 200));
}
```

---

## ✅ TÓM TẮT

**Luồng hiện tại hoạt động ĐÚNG và ĐẦY ĐỦ:**

```
Backend (agent_features.py)
  ↓ return {"email_draft": {...}}
Backend (main.py)
  ↓ ChatResponse(email_draft=EmailDraft(...))
  ↓ response_dict = chat_response.model_dump()
  ↓ return response_dict
Frontend (ChatPage.tsx)
  ↓ aiResponse = await response.json()
  ↓ emailDraft = aiResponse.email_draft || aiResponse.emailDraft
  ↓ aiMessage = {..., emailDraft: emailDraft}
  ↓ setMessages([...prev, aiMessage])
Frontend (Render)
  ↓ {message.emailDraft && <EmailDraftPreview draft={message.emailDraft} />}
```

**Không có vấn đề nghiêm trọng!** 🎉
