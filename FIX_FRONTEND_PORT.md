# 🔧 FIX: Frontend Port Issue

## ❌ VẤN ĐỀ PHÁT HIỆN

Script `start-fullstack.ps1` khởi động frontend ở port **5173** (Vite)
Nhưng có thể bạn đang mở browser ở port **3000** (Next.js - SAI!)

## ✅ GIẢI PHÁP

### Bước 1: Kiểm Tra Port Đang Chạy
Mở PowerShell và chạy:
```powershell
netstat -ano | findstr :5173
netstat -ano | findstr :3000
```

**Kết quả mong đợi:**
- Port 5173: Có process (frontend Vite)
- Port 3000: Không có gì

### Bước 2: Đóng Tất Cả Terminal
Đóng tất cả cửa sổ PowerShell mà script `start-fullstack.ps1` đã mở.

### Bước 3: Xóa Cache Frontend
```powershell
Remove-Item -Recurse -Force fronend_web\node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force fronend_web\dist -ErrorAction SilentlyContinue
```

### Bước 4: Khởi Động Lại
```powershell
.\start-fullstack.ps1
```

### Bước 5: Mở Browser Đúng Port
**QUAN TRỌNG:** Mở browser ở:
```
http://localhost:5173
```

**KHÔNG PHẢI:**
```
http://localhost:3000  ❌ SAI!
```

### Bước 6: Hard Refresh
Sau khi mở `http://localhost:5173`, nhấn:
```
Ctrl + Shift + R
```

### Bước 7: Test
Gửi tin nhắn:
```
gửi email cho test@gmail.com hỏi ăn cơm chưa
```

## 🔍 KIỂM TRA CONSOLE

Mở DevTools (F12) → Console tab

**Tìm các log này:**
```javascript
🔍 FULL API RESPONSE: {...}
🔍 Email draft from API (snake_case): {...}
📧 Final emailDraft: {...}
✅ emailDraft EXISTS!
📧 Message created with emailDraft: {...}
```

**Nếu KHÔNG thấy các log này:**
→ Frontend chưa load code mới
→ Vẫn đang dùng cache cũ

## 🚨 NẾU VẪN KHÔNG HIỆN FORM

### Kiểm Tra 1: Đang Ở Port Nào?
Nhìn vào thanh địa chỉ browser:
- ✅ `http://localhost:5173` → Đúng
- ❌ `http://localhost:3000` → SAI! Đóng và mở lại port 5173

### Kiểm Tra 2: Vite Dev Server Có Chạy Không?
Tìm cửa sổ PowerShell có text `[Frontend Server]`

**Phải thấy:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Nếu không thấy:**
→ Frontend chưa khởi động
→ Kiểm tra lỗi trong terminal

### Kiểm Tra 3: Console Có Lỗi Không?
Mở F12 → Console

**Tìm lỗi màu đỏ:**
- `Failed to fetch` → Backend không chạy
- `Cannot read property` → Code lỗi
- `404 Not Found` → API endpoint sai

### Kiểm Tra 4: Network Tab
F12 → Network → Gửi tin nhắn

**Tìm request:**
```
POST http://localhost:8000/api/chat
```

**Click vào → Response tab:**
```json
{
  "email_draft": {
    "to": "...",
    "subject": "...",
    "body": "..."
  }
}
```

**Nếu có `email_draft`:**
→ Backend OK
→ Vấn đề ở frontend rendering

**Nếu KHÔNG có `email_draft`:**
→ Backend không trả về
→ Kiểm tra backend logs

## 💡 TẠI SAO CẦN PORT 5173?

### Vite vs Next.js
- **Vite** (dự án này): Port 5173
- **Next.js**: Port 3000

Dự án này dùng **Vite** (xem `package.json`):
```json
{
  "scripts": {
    "dev": "vite"  ← Vite, không phải Next.js
  }
}
```

### Vite Cache
Vite cache ở:
```
fronend_web/
  node_modules/
    .vite/      ← Cache ở đây
  dist/         ← Build output
```

**Không có folder `.next`** vì không phải Next.js!

## 🎯 CHECKLIST

- [ ] Đóng tất cả terminal cũ
- [ ] Xóa cache: `node_modules/.vite` và `dist`
- [ ] Chạy: `.\start-fullstack.ps1`
- [ ] Đợi frontend khởi động (thấy "ready in xxx ms")
- [ ] Mở browser: `http://localhost:5173` (KHÔNG PHẢI 3000!)
- [ ] Hard refresh: `Ctrl + Shift + R`
- [ ] Gửi tin nhắn test
- [ ] Mở Console (F12) → Tìm debug logs
- [ ] Kiểm tra có thấy debug box màu vàng không
- [ ] Kiểm tra có thấy form email màu xanh không

## 📸 CHỤP MÀN HÌNH NẾU CẦN

Nếu vẫn không hoạt động:

1. **Thanh địa chỉ browser** (để xác nhận port)
2. **Console tab** (F12 → Console)
3. **Network tab** (F12 → Network → POST /api/chat → Response)
4. **Terminal frontend** (cửa sổ [Frontend Server])
5. **Màn hình chat** (có debug box không?)

---

**Cập nhật:** 26/12/2024
**Port đúng:** 5173 (Vite)
**Port sai:** 3000 (Next.js - không dùng trong dự án này)
