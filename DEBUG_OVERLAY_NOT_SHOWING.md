# 🔍 DEBUG: Overlay Không Hiện

## ✅ BACKEND OK
Backend đã trả về `email_draft` đúng:
```json
{
  "email_draft": {
    "to": "canhnghithuongthan@gmail.com",
    "subject": "Báo Cáo Điểm Số",
    "body": "...",
    "user_id": null
  }
}
```

## ❌ VẤN ĐỀ
Overlay không hiện lên.

## 🔍 KIỂM TRA NGAY

### Bước 1: Mở Console (F12)
1. Nhấn `F12` trong browser
2. Chọn tab "Console"
3. Gửi lại tin nhắn test

### Bước 2: Tìm Các Log Này

**Phải thấy:**
```javascript
✅ emailDraft EXISTS!
📧 Message created with emailDraft: {...}
📝 Adding AI message to UI
📝 New message has emailDraft? true
🚀 Auto-opening email draft overlay
```

**Nếu KHÔNG thấy log "🚀 Auto-opening":**
→ Code không chạy đến phần mở overlay
→ Có thể do:
  - Frontend chưa reload code mới
  - Cache chưa xóa
  - Hoặc có lỗi JavaScript

### Bước 3: Kiểm Tra Lỗi
Tìm lỗi màu đỏ trong Console:
- `Cannot read property`
- `undefined is not a function`
- `setEmailDraftOverlay is not defined`

## 🔧 GIẢI PHÁP

### Giải pháp 1: Hard Refresh
```
Ctrl + Shift + R
```

### Giải pháp 2: Clear Cache Thủ Công
1. Mở DevTools (F12)
2. Click chuột phải vào nút Refresh
3. Chọn "Empty Cache and Hard Reload"

### Giải pháp 3: Restart Frontend
```powershell
# Dừng frontend (Ctrl+C trong terminal)
# Xóa cache
Remove-Item -Recurse -Force fronend_web\node_modules\.vite

# Khởi động lại
cd fronend_web
npm run dev
```

### Giải pháp 4: Kiểm Tra Code
Mở file: `fronend_web/src/pages/ChatPage.tsx`

Tìm dòng này (khoảng line 500):
```typescript
// Auto-open overlay if email draft exists
if (emailDraft) {
  console.log('🚀 Auto-opening email draft overlay');
  setEmailDraftOverlay(emailDraft);
}
```

**Nếu KHÔNG TÌM THẤY:**
→ Code chưa được apply
→ Cần đọc lại file

## 🧪 TEST ĐƠN GIẢN

### Test 1: Kiểm Tra State
Mở Console và gõ:
```javascript
// Kiểm tra component có render không
document.querySelector('[class*="EmailDraftOverlay"]')
```

**Nếu trả về `null`:**
→ Component không render
→ State `emailDraftOverlay` là `null`

### Test 2: Force Open Overlay
Mở Console và gõ:
```javascript
// Tạo fake draft
const fakeDraft = {
  to: 'test@gmail.com',
  subject: 'Test',
  body: 'Test body'
};

// Lưu vào localStorage
localStorage.setItem('testDraft', JSON.stringify(fakeDraft));
```

Sau đó refresh trang và xem overlay có mở không.

## 📸 CHỤP MÀN HÌNH

Vui lòng chụp:
1. **Console tab** - Toàn bộ logs sau khi gửi tin nhắn
2. **Elements tab** - Search "EmailDraftOverlay"
3. **Network tab** - Response của POST /api/chat

## 🎯 CHECKLIST DEBUG

- [ ] Mở Console (F12)
- [ ] Gửi tin nhắn test
- [ ] Tìm log "🚀 Auto-opening email draft overlay"
- [ ] Nếu có log → Kiểm tra Elements tab
- [ ] Nếu không có log → Code chưa chạy
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Nếu vẫn không → Restart frontend
- [ ] Nếu vẫn không → Chụp màn hình Console

---

**QUAN TRỌNG:** Hãy mở Console và cho tôi biết có thấy log "🚀 Auto-opening" không!
