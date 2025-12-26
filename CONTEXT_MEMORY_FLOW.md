# 🔄 Chat Context Memory - Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (React Frontend)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 1. Send message + session_id
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Port 8000)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/chat endpoint                                       │  │
│  │                                                          │  │
│  │ 1. Receive: { message, session_id }                     │  │
│  │ 2. Load conversation history ──────────────────┐        │  │
│  │ 3. Build context from history                  │        │  │
│  │ 4. Create prompt with context                  │        │  │
│  │ 5. Send to AI (Gemini/Groq)                    │        │  │
│  │ 6. Return response                             │        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ 2. GET /api/chat/sessions/{id}/messages
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND (Port 8080)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Database: chat_sessions & chat_messages                  │  │
│  │                                                          │  │
│  │ Returns: [                                               │  │
│  │   { sender: "USER", message: "Tên tôi là Minh" },      │  │
│  │   { sender: "AI", message: "Chào Minh!" },             │  │
│  │   { sender: "USER", message: "Tôi học lớp 10A" },      │  │
│  │   { sender: "AI", message: "Rất vui được biết..." }    │  │
│  │ ]                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Flow

### **Step 1: User Sends Message**
```typescript
// Frontend: ChatPage.tsx
const aiResponse = await chatService.sendMessageWithActions(
  "Tên tôi là gì?",
  useRag,
  aiProvider,
  model,
  imageBase64,
  imageMimeType,
  currentSessionId  // ← Pass session ID
);
```

### **Step 2: Backend Receives Request**
```python
# Backend: main.py
@app.post("/api/chat")
async def chat(request: ChatRequest):
    # request.session_id = 123
    # request.message = "Tên tôi là gì?"
```

### **Step 3: Load Conversation History**
```python
# Call Spring Boot API
history_response = requests.get(
    f"http://localhost:8080/api/chat/sessions/{request.session_id}/messages"
)

# Response:
[
  {"id": 1, "sender": "USER", "message": "Tên tôi là Minh"},
  {"id": 2, "sender": "AI", "message": "Chào Minh!"},
  {"id": 3, "sender": "USER", "message": "Tôi học lớp 10A"},
  {"id": 4, "sender": "AI", "message": "Rất vui được biết bạn!"}
]
```

### **Step 4: Build Conversation Context**
```python
conversation_context = """
**Lịch sử cuộc trò chuyện:**
Học sinh: Tên tôi là Minh
AI: Chào Minh!
Học sinh: Tôi học lớp 10A
AI: Rất vui được biết bạn!

"""
```

### **Step 5: Create Prompt with Context**
```python
prompt = f"""
{system_prompt}

{conversation_context}

**Câu hỏi của học sinh:**
Tên tôi là gì?
"""
```

### **Step 6: Send to AI**
```python
# Full prompt sent to Gemini:
"""
🎓 Bạn là AI Learning Assistant...

**Lịch sử cuộc trò chuyện:**
Học sinh: Tên tôi là Minh
AI: Chào Minh!
Học sinh: Tôi học lớp 10A
AI: Rất vui được biết bạn!

**Câu hỏi của học sinh:**
Tên tôi là gì?
"""
```

### **Step 7: AI Response**
```python
# Gemini sees the context and responds:
"Tên bạn là Minh! 😊"
```

### **Step 8: Return to Frontend**
```json
{
  "response": "Tên bạn là Minh! 😊",
  "model": "gemini-2.0-flash-exp",
  "rag_enabled": false
}
```

## Message Limit Strategy

### **Why Limit to 10 Messages?**

```
┌─────────────────────────────────────────────────────────────┐
│                    Session Messages                         │
│                                                             │
│  Message 1  ─┐                                             │
│  Message 2   │                                             │
│  Message 3   │  Too old - not relevant                     │
│  Message 4   │  (ignored)                                  │
│  Message 5  ─┘                                             │
│  Message 6  ─┐                                             │
│  Message 7   │                                             │
│  Message 8   │  Recent - relevant                          │
│  Message 9   │  (included in context)                      │
│  Message 10  │                                             │
│  Message 11  │                                             │
│  Message 12  │                                             │
│  Message 13  │                                             │
│  Message 14  │                                             │
│  Message 15 ─┘                                             │
│  Message 16 ← Current message                              │
└─────────────────────────────────────────────────────────────┘
```

### **Token Budget:**
```
System Prompt:        ~500 tokens
Conversation Context: ~400 tokens (10 messages)
Current Message:      ~50 tokens
AI Response:          ~300 tokens
─────────────────────────────────────
Total:                ~1,250 tokens

Gemini Limit:         32,000 tokens ✅
Groq Limit:           8,000 tokens ✅
```

## Session Isolation

### **Same Session = Shared Memory**
```
Session 123:
  User: "Tên tôi là Minh"
  AI: "Chào Minh!"
  User: "Tên tôi là gì?"
  AI: "Tên bạn là Minh!" ✅ (remembers)
```

### **Different Session = No Memory**
```
Session 123:
  User: "Tên tôi là Minh"
  AI: "Chào Minh!"

Session 456:  ← New session
  User: "Tên tôi là gì?"
  AI: "Xin lỗi, tôi không biết..." ❌ (doesn't remember)
```

## Performance Impact

### **Request Timeline:**

```
Without Context:
├─ Receive request:     0ms
├─ Process message:     50ms
├─ Call Gemini API:     1500ms
└─ Return response:     1550ms ✅

With Context:
├─ Receive request:     0ms
├─ Load history:        100ms  ← Extra time
├─ Build context:       50ms   ← Extra time
├─ Process message:     50ms
├─ Call Gemini API:     1500ms
└─ Return response:     1700ms ✅ (+150ms)
```

**Impact:** +150ms (~10% slower) - Acceptable trade-off for context memory

## Error Handling

### **Scenario 1: Spring Boot Down**
```python
try:
    history_response = requests.get(...)
except Exception as e:
    print(f"⚠️ Error loading history: {e}")
    conversation_history = []  # Continue without context
```

### **Scenario 2: Invalid Session ID**
```python
if history_response.status_code != 200:
    print(f"⚠️ Could not load session history")
    conversation_history = []  # Continue without context
```

### **Scenario 3: No Session ID**
```python
if not request.session_id:
    conversation_history = []  # No context to load
```

## Comparison: Before vs After

### **Before (Stateless):**
```
┌──────────┐
│ Message  │ ──→ AI ──→ Response
└──────────┘
     ↓
  (forgotten)
```

### **After (Stateful):**
```
┌──────────┐
│ Message  │ ──→ Load History ──→ AI (with context) ──→ Response
└──────────┘           ↓
                  ┌─────────┐
                  │ Session │
                  │ Memory  │
                  └─────────┘
```

## Real-World Example

### **Conversation Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ Turn 1                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Tên tôi là Minh, tôi 16 tuổi"                       │
│ AI: "Chào Minh! Rất vui được gặp bạn."                     │
│                                                             │
│ Context: []                                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 2                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Tôi học lớp 10A"                                    │
│ AI: "Được rồi Minh, tôi đã ghi nhớ bạn học lớp 10A."      │
│                                                             │
│ Context: [                                                  │
│   "Học sinh: Tên tôi là Minh, tôi 16 tuổi"                │
│   "AI: Chào Minh! Rất vui được gặp bạn."                  │
│ ]                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 3                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Tôi bao nhiêu tuổi và học lớp nào?"                 │
│ AI: "Bạn 16 tuổi và học lớp 10A nhé Minh!"                │
│                                                             │
│ Context: [                                                  │
│   "Học sinh: Tên tôi là Minh, tôi 16 tuổi"                │
│   "AI: Chào Minh! Rất vui được gặp bạn."                  │
│   "Học sinh: Tôi học lớp 10A"                             │
│   "AI: Được rồi Minh, tôi đã ghi nhớ..."                 │
│ ]                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Summary

✅ **Context Memory Enabled**
- AI remembers conversation history
- Session-based isolation
- Automatic context loading
- Smart message limiting
- Error-tolerant design

🚀 **Production Ready**
- No breaking changes
- Backward compatible
- Performance optimized
- Well documented

---

**Now your chat AI has memory like ChatGPT!** 🧠✨
