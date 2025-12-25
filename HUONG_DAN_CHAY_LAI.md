# 🚀 HƯỚNG DẪN CHẠY LẠI

## ✅ ĐÃ DỌN DẸP

Tôi đã:
- ✅ Dừng tất cả process Node.js
- ✅ Giải phóng port 5173 và 5174
- ✅ Xóa cache Vite

## 🔧 BÂY GIỜ HÃY CHẠY

### Cách 1: Chạy Script Fullstack (Khuyến nghị)
```powershell
.\start-fullstack.ps1
```

Script này sẽ tự động:
1. Khởi động Spring Boot (port 8080)
2. Khởi động OAuth Service (port 8003)
3. Khởi động Google Cloud Service (port 8004)
4. Khởi động AI Service (port 8000)
5. Khởi động Frontend (port 5173)

### Cách 2: Chỉ Chạy Frontend
```powershell
cd fronend_web
npm run dev
```

## 🧪 SAU KHI CHẠY

### 1. Đợi Frontend Khởi Động
Tìm dòng:
```
✓ Ready in X.Xs
○ Local: http://localhost:5173/
```

### 2. Mở Browser
```
http://localhost:5173
```

### 3. Hard Refresh
```
Ctrl + Shift + R
```

### 4. Test Email Draft
Gửi tin nhắn:
```
gửi email cho test@gmail.com hỏi ăn cơm chưa
```

### 5. Overlay Sẽ TỰ ĐỘNG MỞ! 🎉
- Không cần click gì
- Form email hiện ngay
- Chỉnh sửa và gửi
- Tự động đóng sau 1 giây

## 🔍 KIỂM TRA

### Nếu Frontend Không Khởi Động
```powershell
# Kiểm tra port 5173 có bị chiếm không
netstat -ano | findstr :5173

# Nếu có process, kill nó
# Lấy PID từ cột cuối cùng
taskkill /PID <PID> /F
```

### Nếu Vẫn Lỗi
```powershell
# Xóa cache và node_modules
Remove-Item -Recurse -Force fronend_web\node_modules\.vite
Remove-Item -Recurse -Force fronend_web\node_modules

# Cài lại
cd fronend_web
npm install
npm run dev
```

## 📋 CHECKLIST

- [ ] Chạy `.\start-fullstack.ps1`
- [ ] Đợi tất cả service khởi động
- [ ] Mở `http://localhost:5173`
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Gửi tin nhắn test
- [ ] Overlay tự động mở
- [ ] Gửi email
- [ ] Overlay tự động đóng

## 🎯 KẾT QUẢ MONG ĐỢI

```
User: "gửi email cho test@gmail.com hỏi ăn cơm chưa"
  ↓
AI: "📧 Email draft đã được tạo..."
  ↓
Overlay TỰ ĐỘNG MỞ! 🚀
  ↓
User: Click "📨 Gửi Email"
  ↓
Toast: "✅ Email đã được gửi!"
  ↓
Overlay TỰ ĐỘNG ĐÓNG sau 1s
  ↓
Quay lại Chat! ✅
```

---

**Hãy chạy `.\start-fullstack.ps1` ngay bây giờ!** 🚀
