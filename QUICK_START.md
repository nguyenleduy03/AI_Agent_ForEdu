# 🚀 QUICK START - Chạy Dự Án Ngay

## ✅ ĐÃ SETUP SẴN

Tất cả các file `.env` và keys đã được tạo sẵn:
- ✅ `backend/PythonService/.env` - AI & OAuth keys
- ✅ `fronend_web/.env` - Frontend config
- ✅ `application.yaml` - Spring Boot config (JWT, Database)

---

## 🔥 CHẠY NGAY (3 BƯỚC)

### 1️⃣ Verify Setup (30 giây)

```powershell
.\verify-setup.ps1
```

Nếu có lỗi → Đọc `SETUP_ENVIRONMENT_GUIDE.md`

### 2️⃣ Start MySQL (10 giây)

```cmd
net start MySQL80
```

### 3️⃣ Chạy Tất Cả Services (2 phút)

```powershell
.\start-fullstack.ps1
```

Script này sẽ tự động:
- ✅ Start Spring Boot (port 8080)
- ✅ Start Python AI Service (port 8000)
- ✅ Start OAuth Service (port 8003)
- ✅ Start Frontend (port 5173)

---

## 🌐 MỞ TRÌNH DUYỆT

```
http://localhost:5173
```

1. Register tài khoản mới
2. Login
3. Test chat với AI
4. Thử các tính năng:
   - 📧 Email draft
   - 📅 Calendar sync
   - 📚 Quiz generation
   - 🎓 Course management

---

## 🐛 NẾU GẶP LỖI

### Lỗi: Port đã được sử dụng

```powershell
# Kill tất cả process
.\kill-and-restart.cmd

# Hoặc kill từng port
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Lỗi: MySQL không chạy

```cmd
net start MySQL80
```

### Lỗi: node_modules thiếu

```bash
cd fronend_web
npm install
```

### Lỗi: Python dependencies thiếu

```bash
cd backend/PythonService
pip install -r requirements.txt
```

---

## 📚 TÀI LIỆU CHI TIẾT

| Nhu Cầu | File |
|---------|------|
| Setup môi trường đầy đủ | `SETUP_ENVIRONMENT_GUIDE.md` |
| Hướng dẫn chạy lại | `HUONG_DAN_CHAY_LAI.md` |
| Tổng quan dự án | `README.md` |
| Bắt đầu từ đây | `00_START_HERE.md` |

---

## ✅ CHECKLIST

- [ ] Chạy `.\verify-setup.ps1` → Tất cả ✅
- [ ] Start MySQL → Running
- [ ] Chạy `.\start-fullstack.ps1` → Tất cả services khởi động
- [ ] Mở http://localhost:5173 → Frontend hiển thị
- [ ] Register & Login → Thành công
- [ ] Test chat → AI phản hồi

---

**🎉 XONG! Dự án đã chạy thành công!**

**Thời gian setup**: ~5 phút  
**Status**: ✅ READY TO USE
