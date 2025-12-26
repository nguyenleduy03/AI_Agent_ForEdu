# 🧪 Test Chat Context Memory

## Quick Test Guide

### **1. Start Services**
```bash
# Terminal 1: Start Spring Boot (port 8080)
cd backend/SpringService/agentforedu
./mvnw spring-boot:run

# Terminal 2: Start Python FastAPI (port 8000)
cd backend/PythonService
py main.py

# Terminal 3: Start Frontend (port 5173)
cd fronend_web
npm run dev
```

### **2. Test in Browser**

#### **Test Case 1: Basic Memory**
1. Open http://localhost:5173/chat
2. Send: "Tên tôi là Minh"
3. Wait for AI response
4. Send: "Tên tôi là gì?"
5. ✅ **Expected:** AI should say "Tên bạn là Minh"

#### **Test Case 2: Multi-Turn Context**
1. Send: "Tôi học lớp 10A"
2. Send: "Môn yêu thích của tôi là Toán"
3. Send: "Tôi học lớp nào và thích môn gì?"
4. ✅ **Expected:** AI should remember both class and subject

#### **Test Case 3: Session Isolation**
1. Click "New Chat" button (creates new session)
2. Send: "Tên tôi là gì?"
3. ✅ **Expected:** AI should NOT remember (new session)

### **3. Check Backend Logs**

Look for these logs in Python console:
```
💬 Loading conversation history for session 123...
✅ Loaded 4 messages from session history
📝 Building conversation context from 4 messages...
```

### **4. API Test (Optional)**

```bash
# Test with curl
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tên tôi là gì?",
    "session_id": 1,
    "ai_provider": "gemini"
  }'
```

## Expected Behavior

### **With Context (session_id provided):**
```json
{
  "response": "Tên bạn là Minh! 😊",
  "model": "gemini-2.0-flash-exp",
  "rag_enabled": false
}
```

### **Without Context (no session_id):**
```json
{
  "response": "Xin lỗi, tôi không biết tên bạn. Bạn có thể cho tôi biết không?",
  "model": "gemini-2.0-flash-exp",
  "rag_enabled": false
}
```

## Troubleshooting

### **Issue: AI doesn't remember**
- Check backend logs for "Loading conversation history"
- Verify session_id is being sent (check Network tab)
- Ensure Spring Boot is running (port 8080)

### **Issue: Error loading history**
- Check Spring Boot is accessible at http://localhost:8080
- Verify session exists in database
- Check backend logs for error messages

### **Issue: Context too long**
- Reduce message limit in main.py (line ~850):
  ```python
  recent_messages = messages[-5:]  # Only 5 messages
  ```

## Success Criteria

✅ AI remembers information from previous messages
✅ Context is maintained within same session
✅ New session = fresh context (no memory)
✅ No errors in console logs
✅ Response time < 3 seconds

---

**Ready to test!** 🚀
