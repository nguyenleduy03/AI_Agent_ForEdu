# ⚡ QUICK FIX - Email Draft Form Not Showing

## 🎯 PROBLEM
Backend trả về `email_draft` đúng nhưng frontend không hiện form.

## ✅ ĐÃ FIX CODE
- Fixed variable references in `ChatPage.tsx`
- Added debug logs and debug box
- EmailDraftPreview component đã được đặt đúng vị trí

## 🔧 GIẢI PHÁP: XÓA CACHE VÀ RESTART

### Cách 1: Tự động (Khuyến nghị)
Chạy script này:
```powershell
.\restart-frontend-clean.ps1
```

Script sẽ tự động:
1. ✅ Dừng frontend
2. ✅ Xóa cache `.next`
3. ✅ Khởi động lại frontend

### Cách 2: Thủ công
```powershell
# 1. Dừng frontend (Ctrl+C trong terminal đang chạy frontend)

# 2. Xóa cache
Remove-Item -Recurse -Force fronend_web/.next

# 3. Khởi động lại
cd fronend_web
npm run dev
```

## 🌐 SAU KHI FRONTEND KHỞI ĐỘNG

1. **Mở browser:** http://localhost:3000
2. **Hard refresh:** Nhấn `Ctrl + Shift + R`
3. **Test:** Gửi tin nhắn
   ```
   gửi email cho test@gmail.com hỏi ăn cơm chưa
   ```

## ✨ KẾT QUẢ MONG ĐỢI

Bạn sẽ thấy:

1. **Tin nhắn AI:**
   ```
   📧 Email draft đã được tạo. Vui lòng kiểm tra và gửi.
   ```

2. **Debug box (màu vàng):**
   ```
   🔍 DEBUG: EmailDraft detected!
   To: test@gmail.com
   Subject: Hỏi thăm bữa ăn
   ```

3. **Form email (màu xanh):**
   - 📧 Người nhận: test@gmail.com
   - 📌 Chủ đề: Hỏi thăm bữa ăn
   - 📄 Nội dung: (có thể chỉnh sửa)
   - 📨 Gửi Email (button)

## 🔍 NẾU VẪN KHÔNG HIỆN

### Kiểm tra Console (F12)
Tìm các log này:
```
🔍 FULL API RESPONSE: {...}
📧 Final emailDraft: {...}
✅ emailDraft EXISTS!
📧 Message created with emailDraft: {...}
```

### Kiểm tra Network Tab
1. Mở DevTools → Network
2. Gửi tin nhắn test
3. Tìm request POST `/api/chat`
4. Xem Response → phải có `email_draft`

### Kiểm tra Elements Tab
1. Mở DevTools → Elements
2. Tìm kiếm (Ctrl+F): "EmailDraftPreview"
3. Nếu không tìm thấy → component không render
4. Nếu tìm thấy → có thể là vấn đề CSS

## 📸 CHỤP MÀN HÌNH NẾU CẦN HỖ TRỢ

Nếu vẫn không hoạt động, chụp:
1. Console tab (F12)
2. Network tab (response của `/api/chat`)
3. Màn hình chat (có thấy debug box không?)

---

**Lưu ý:** Đảm bảo backend đang chạy trước khi test!
