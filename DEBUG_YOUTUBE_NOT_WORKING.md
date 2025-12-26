# 🐛 Debug: YouTube Không Phát

## 🔍 Các Bước Debug

### **Bước 1: Test Backend**

```bash
# Terminal 1: Start backend với logs
cd backend/PythonService
python main.py
```

**Xem logs khi gửi message:**
```
🔍 Detecting tool intent for message: Phát bài hát Despacito
✅ Tool action detected: play_youtube - Despacito
   URL: https://youtube.com/watch?v=...&autoplay=1
```

Nếu **KHÔNG** thấy logs này → Backend không detect được intent.

---

### **Bước 2: Test API Trực Tiếp**

```bash
# Terminal 2: Run test script
python test_youtube_tool.py
```

**Expected output:**
```
✅ Backend is running
📝 Testing: Phát bài hát Despacito
✅ Status: 200
🎯 Tool Action Detected:
   Tool: play_youtube
   Query: Despacito
   URL: https://youtube.com/watch?v=...
   Auto Execute: True
```

Nếu **KHÔNG** có tool action → Vấn đề ở backend.

---

### **Bước 3: Check Frontend Console**

Mở browser console (F12) và gửi message "Phát bài hát Despacito"

**Expected logs:**
```javascript
AI response received: 🎬 Đang phát video YouTube...
🔍 FULL API RESPONSE: { response: "...", tool_action: {...} }
Auto-executing tool: { tool: "play_youtube", ... }
Executing tool: play_youtube
```

Nếu **KHÔNG** thấy "Auto-executing tool" → Frontend không execute.

---

### **Bước 4: Check Browser Popup Blocker**

1. Mở browser settings
2. Search "popup"
3. Allow popups cho `localhost:5173`

**Chrome:**
```
Settings → Privacy and security → Site settings → Pop-ups and redirects
→ Add localhost:5173 to "Allowed to send pop-ups"
```

**Firefox:**
```
Settings → Privacy & Security → Permissions → Block pop-up windows
→ Exceptions → Add localhost:5173
```

---

## 🔧 Các Vấn Đề Thường Gặp

### **Vấn đề 1: Backend không detect intent**

**Triệu chứng:**
```
🔍 Detecting tool intent for message: Phát bài hát Despacito
❌ No tool action detected
```

**Nguyên nhân:** Trigger words không match

**Giải pháp:** Kiểm tra trigger words trong `main.py`:
```python
play_triggers = ["phát", "play", "chơi", "bật"]
```

Thử với các từ khác:
- "play Despacito"
- "bật Despacito"
- "chơi Despacito"

---

### **Vấn đề 2: YouTube API không available**

**Triệu chứng:**
```
⚠️  YouTube helper not available. Video search will use fallback.
```

**Nguyên nhân:** `youtube_helper.py` không import được

**Giải pháp:**
```bash
# Check file tồn tại
ls backend/PythonService/youtube_helper.py

# Check import
cd backend/PythonService
python -c "from youtube_helper import search_youtube_video; print('OK')"
```

Nếu lỗi → Cài dependencies:
```bash
pip install google-api-python-client
```

---

### **Vấn đề 3: Frontend không execute tool action**

**Triệu chứng:**
Console log có `tool_action` nhưng không mở tab mới

**Nguyên nhân:** Code bị comment hoặc popup blocked

**Giải pháp:**

1. **Check code enabled:**
```typescript
// fronend_web/src/pages/ChatPage.tsx line ~538
if (aiResponse.tool_action && aiResponse.tool_action.auto_execute) {
  console.log('Auto-executing tool:', aiResponse.tool_action); // ← Phải thấy log này
  executeToolAction(aiResponse.tool_action);
}
```

2. **Check popup blocker:**
- Xem có icon popup blocked trên address bar không
- Allow popups cho localhost

3. **Manual test:**
```javascript
// Paste vào browser console
window.open('https://youtube.com', '_blank', 'noopener,noreferrer');
```

Nếu không mở → Popup bị block.

---

### **Vấn đề 4: URL không hợp lệ**

**Triệu chứng:**
```
❌ Invalid URL
```

**Nguyên nhân:** URL không có trong whitelist

**Giải pháp:** Check whitelist:
```typescript
const ALLOWED_DOMAINS = ['youtube.com', 'google.com', 'wikipedia.org'];
```

Thêm domain nếu cần:
```typescript
const ALLOWED_DOMAINS = [
  'youtube.com',
  'youtu.be',      // ✅ Thêm short URL
  'google.com',
  'wikipedia.org'
];
```

---

## 🧪 Test Checklist

### **Backend:**
- [ ] Backend running (port 8000)
- [ ] Logs show "Detecting tool intent"
- [ ] Logs show "Tool action detected"
- [ ] Response có `tool_action` field

### **Frontend:**
- [ ] Frontend running (port 5173)
- [ ] Console log "Auto-executing tool"
- [ ] Console log "Executing tool"
- [ ] No errors in console

### **Browser:**
- [ ] Popup blocker disabled cho localhost
- [ ] No security warnings
- [ ] Tab mới có thể mở thủ công

---

## 🔬 Advanced Debug

### **1. Check Request Payload:**

Browser console → Network tab → Filter "chat" → Click request → Payload:
```json
{
  "message": "Phát bài hát Despacito",
  "use_rag": false,
  "ai_provider": "gemini",
  "model": "models/gemini-2.0-flash-exp"
}
```

### **2. Check Response:**

Response tab:
```json
{
  "response": "🎬 Đang phát video YouTube về 'Despacito'...",
  "tool_action": {
    "tool": "play_youtube",
    "query": "Despacito",
    "url": "https://youtube.com/watch?v=...",
    "auto_execute": true,
    "video_id": "..."
  }
}
```

Nếu **KHÔNG** có `tool_action` → Backend issue.

### **3. Check executeToolAction:**

Add breakpoint hoặc log:
```typescript
const executeToolAction = (action: ToolAction) => {
  console.log('🎯 executeToolAction called:', action);
  
  if (!action || !action.url) {
    console.error('❌ Invalid action:', action);
    return;
  }
  
  console.log('🔓 Checking URL:', action.url);
  
  // ... rest of code
  
  console.log('🚀 Opening URL:', action.url);
  window.open(action.url, '_blank', 'noopener,noreferrer');
  console.log('✅ window.open called');
};
```

---

## 💡 Quick Fixes

### **Fix 1: Force enable auto-execute**

```typescript
// ChatPage.tsx
if (aiResponse.tool_action) { // Remove && auto_execute check
  executeToolAction(aiResponse.tool_action);
}
```

### **Fix 2: Remove security check (testing only)**

```typescript
const executeToolAction = (action: ToolAction) => {
  // Comment out whitelist check
  // const ALLOWED_DOMAINS = [...];
  
  // Direct open
  window.open(action.url, '_blank');
  toast.success('Opened!');
};
```

### **Fix 3: Add manual button**

```typescript
{message.toolAction && (
  <button onClick={() => executeToolAction(message.toolAction)}>
    🎬 Click to Play
  </button>
)}
```

---

## 📞 Still Not Working?

1. **Restart everything:**
```bash
# Kill all
Ctrl+C (backend)
Ctrl+C (frontend)

# Start fresh
cd backend/PythonService && python main.py
cd fronend_web && npm run dev
```

2. **Clear browser cache:**
```
Ctrl+Shift+Delete → Clear cache
```

3. **Try different browser:**
- Chrome
- Firefox
- Edge

4. **Check firewall:**
- Allow localhost:8000
- Allow localhost:5173

---

## ✅ Success Criteria

Khi hoạt động đúng, bạn sẽ thấy:

1. **Backend logs:**
```
🔍 Detecting tool intent for message: Phát bài hát Despacito
✅ Tool action detected: play_youtube - Despacito
```

2. **Frontend console:**
```
Auto-executing tool: {tool: "play_youtube", ...}
🎬 Đang phát video: Despacito
```

3. **Browser:**
- Tab mới mở với YouTube
- Video tự động phát
- Toast notification hiện

---

**Good luck!** 🚀
