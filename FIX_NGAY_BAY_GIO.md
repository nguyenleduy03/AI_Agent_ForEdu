# ⚡ FIX NGAY - Email Form Không Hiện

## 🎯 VẤN ĐỀ TÌM RA

Bạn đang mở browser ở **PORT SAI**!

- ✅ Port đúng: **5173** (Vite)
- ❌ Port sai: **3000** (Next.js - không dùng)

## 🔧 GIẢI PHÁP (3 BƯỚC)

### Bước 1: Đóng Tất Cả Terminal
Đóng tất cả cửa sổ PowerShell mà `start-fullstack.ps1` đã mở.

### Bước 2: Chạy Script Mới
```powershell
.\restart-frontend-vite.ps1
```

### Bước 3: Mở Browser Đúng Port
**QUAN TRỌNG:** Mở browser tại:
```
http://localhost:5173
```

**KHÔNG PHẢI:**
```
http://localhost:3000  ❌ SAI!
```

Sau đó nhấn: `Ctrl + Shift + R`

## 🧪 TEST

Gửi tin nhắn:
```
gửi email cho test@gmail.com hỏi ăn cơm chưa
```

## ✨ KẾT QUẢ

Bạn sẽ thấy:
1. ✅ Debug box màu vàng
2. ✅ Form email màu xanh
3. ✅ Có thể chỉnh sửa và gửi

## 🔍 KIỂM TRA

### Xác Nhận Port
Nhìn thanh địa chỉ browser:
- ✅ `localhost:5173` → Đúng
- ❌ `localhost:3000` → SAI!

### Xem Console (F12)
Phải thấy các log:
```
✅ emailDraft EXISTS!
📧 Message created with emailDraft: {...}
```

### Xem Network (F12)
POST `/api/chat` → Response phải có `email_draft`

## 🚨 NẾU VẪN KHÔNG ĐƯỢC

Chụp màn hình:
1. Thanh địa chỉ browser (xác nhận port)
2. Console tab (F12)
3. Network tab (Response của /api/chat)
4. Màn hình chat

---

**TÓM TẮT:**
1. Đóng tất cả terminal
2. Chạy: `.\restart-frontend-vite.ps1`
3. Mở: `http://localhost:5173` (KHÔNG PHẢI 3000!)
4. Nhấn: `Ctrl + Shift + R`
5. Test: Gửi email

**Port đúng: 5173 ✅**
**Port sai: 3000 ❌**
