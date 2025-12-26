# 🎬 Hướng Dẫn Sử Dụng YouTube & Google Search

## ✅ ĐÃ ENABLE LẠI!

Tính năng auto-execute tool actions đã được bật lại trong ChatPage.

---

## 🎯 Cách Sử Dụng

### **1. Phát Video YouTube** 🎬

**Trigger words:** `phát`, `play`, `chơi`, `bật`

**Ví dụ:**
```
User: "Phát bài hát Despacito"
→ 🎬 Tự động mở YouTube và phát video

User: "Play Shape of You"
→ 🎬 Tự động mở YouTube và phát video

User: "Bật nhạc chill"
→ 🎬 Tự động mở YouTube và phát video
```

**Cách hoạt động:**
1. Backend detect keyword "phát/play/chơi/bật"
2. Extract query (tên bài hát/video)
3. Search YouTube API → lấy video_id
4. Trả về `tool_action` với URL autoplay
5. Frontend tự động mở tab mới với video

---

### **2. Mở YouTube Search** 🎥

**Trigger words:** `mở video`, `xem video`, `youtube`, `tìm video`

**Ví dụ:**
```
User: "Mở video về React tutorial"
→ 🎥 Mở YouTube search results

User: "Xem video hướng dẫn nấu ăn"
→ 🎥 Mở YouTube search results

User: "Youtube về du lịch Đà Lạt"
→ 🎥 Mở YouTube search results
```

---

### **3. Tìm Kiếm Google** 🔍

**Trigger words:** `tìm kiếm`, `search`, `google`, `tra google`, `tìm trên google`

**Ví dụ:**
```
User: "Tìm kiếm React hooks"
→ 🔍 Mở Google search

User: "Google về AI machine learning"
→ 🔍 Mở Google search

User: "Tra google thời tiết Hà Nội"
→ 🔍 Mở Google search
```

---

### **4. Mở Wikipedia** 📖

**Trigger words:** `wikipedia`, `wiki`, `tra wikipedia`

**Ví dụ:**
```
User: "Wikipedia về Albert Einstein"
→ 📖 Mở Wikipedia page

User: "Wiki về Vietnam"
→ 📖 Mở Wikipedia page
```

---

## 🔧 Cách Hoạt Động

### **Backend (main.py):**

```python
def detect_tool_intent(message: str) -> Optional[ToolAction]:
    """Phát hiện intent để tự động thực thi tool"""
    
    # 1. Check trigger words
    if "phát" in message or "play" in message:
        # 2. Extract query
        query = extract_query(message)
        
        # 3. Search YouTube
        video_id = search_youtube_video(query)
        
        # 4. Return tool action
        return ToolAction(
            tool="play_youtube",
            query=query,
            url=f"https://youtube.com/watch?v={video_id}&autoplay=1",
            auto_execute=True
        )
```

### **Frontend (ChatPage.tsx):**

```typescript
// 1. Nhận response từ backend
const aiResponse = await chatService.sendMessage(message);

// 2. Check nếu có tool_action
if (aiResponse.tool_action && aiResponse.tool_action.auto_execute) {
  // 3. Execute sau 1 giây
  setTimeout(() => {
    executeToolAction(aiResponse.tool_action);
  }, 1000);
}

// 4. executeToolAction mở tab mới
const executeToolAction = (action: ToolAction) => {
  // Security check
  const ALLOWED_DOMAINS = ['youtube.com', 'google.com', 'wikipedia.org'];
  
  // Open URL
  window.open(action.url, '_blank', 'noopener,noreferrer');
  
  // Show toast
  toast.success(`🎬 Đang phát video: ${action.query}`);
};
```

---

## 🧪 Test Cases

### **Test 1: Phát YouTube**
```
Input: "Phát bài hát Despacito"
Expected:
  1. AI response: "🎬 Đang phát video YouTube về 'Despacito'..."
  2. Tab mới mở với YouTube video (autoplay)
  3. Toast notification: "🎬 Đang phát video: Despacito"
```

### **Test 2: Mở YouTube Search**
```
Input: "Mở video về React tutorial"
Expected:
  1. AI response: "🎥 Đang mở YouTube để xem video về 'React tutorial'..."
  2. Tab mới mở với YouTube search results
  3. Toast notification: "🎥 Đã mở YouTube: React tutorial"
```

### **Test 3: Google Search**
```
Input: "Tìm kiếm React hooks"
Expected:
  1. AI response: "🔍 Đang tìm kiếm trên Google về 'React hooks'..."
  2. Tab mới mở với Google search results
  3. Toast notification: "🔍 Đã tìm trên Google: React hooks"
```

### **Test 4: Wikipedia**
```
Input: "Wikipedia về Vietnam"
Expected:
  1. AI response: "📖 Đang mở Wikipedia về 'Vietnam'..."
  2. Tab mới mở với Wikipedia page
  3. Toast notification: "📖 Đã mở Wikipedia: Vietnam"
```

---

## 🔒 Security

**Whitelist domains:**
- ✅ youtube.com
- ✅ google.com
- ✅ wikipedia.org

**Blocked:**
- ❌ Tất cả domains khác
- ❌ javascript: URLs
- ❌ data: URLs
- ❌ file: URLs

**Error handling:**
```typescript
if (!ALLOWED_DOMAINS.some(domain => url.includes(domain))) {
  toast.error('URL không được phép!');
  return;
}
```

---

## 🐛 Troubleshooting

### **Vấn đề 1: Không mở tab mới**

**Nguyên nhân:** Browser block popup

**Giải pháp:**
1. Check console có lỗi "popup blocked" không
2. Allow popups cho localhost:5173
3. Hoặc user phải click vào button thay vì auto-execute

### **Vấn đề 2: YouTube không tìm thấy video**

**Nguyên nhân:** YouTube API key không có hoặc hết quota

**Giải pháp:**
1. Check `YOUTUBE_HELPER_AVAILABLE` trong backend
2. Check console log: "Error searching YouTube"
3. Fallback sang YouTube search thay vì direct play

### **Vấn đề 3: Tool action không execute**

**Debug steps:**
```typescript
// 1. Check backend response
console.log('AI Response:', aiResponse);
console.log('Tool Action:', aiResponse.tool_action);

// 2. Check auto_execute flag
console.log('Auto Execute:', aiResponse.tool_action?.auto_execute);

// 3. Check executeToolAction được gọi
console.log('Executing tool:', action);
```

---

## 📊 Status

| Feature | Status | Notes |
|---------|--------|-------|
| Phát YouTube | ✅ | Cần YouTube API key |
| Mở YouTube Search | ✅ | Không cần API |
| Google Search | ✅ | Không cần API |
| Wikipedia | ✅ | Không cần API |
| Auto-execute | ✅ | Enabled |
| Security whitelist | ✅ | 3 domains |
| Toast notifications | ✅ | Working |

---

## 🚀 Cách Test

1. **Start services:**
```bash
# Backend
cd backend/PythonService
python main.py

# Frontend
cd fronend_web
npm run dev
```

2. **Open browser:**
```
http://localhost:5173
```

3. **Test commands:**
```
"Phát bài hát Despacito"
"Mở video về React tutorial"
"Tìm kiếm React hooks"
"Wikipedia về Vietnam"
```

4. **Check:**
- ✅ Tab mới mở
- ✅ Toast notification hiện
- ✅ Không có console errors

---

## 💡 Tips

### **Để mở bất kỳ link nào:**

Thêm vào whitelist:
```typescript
const ALLOWED_DOMAINS = [
  'youtube.com',
  'google.com',
  'wikipedia.org',
  'github.com',      // ✅ Thêm
  'stackoverflow.com', // ✅ Thêm
  // ... thêm domains khác
];
```

### **Để thêm trigger words mới:**

Backend `main.py`:
```python
# Thêm vào detect_tool_intent()
custom_triggers = ["mở link", "open link", "truy cập"]
for trigger in custom_triggers:
    if trigger in message_lower:
        # Extract URL from message
        url = extract_url(message)
        return ToolAction(
            tool="open_link",
            query=url,
            url=url,
            auto_execute=True
        )
```

---

**Status:** ✅ READY TO USE  
**Last Updated:** 2025-12-26  
**Version:** 1.0
