# 🚀 Calendar Sync - Quick Start (5 phút)

## ✅ Đã Làm Xong

Tính năng **Auto Sync TKB → Google Calendar** đã hoàn thành!

---

## 🎯 Làm Được Gì?

Tự động đồng bộ Thời Khóa Biểu từ TVU Portal lên Google Calendar

**1 câu lệnh → Toàn bộ lịch học lên Calendar!** 🎉

---

## 🚀 Cách Dùng (3 Bước)

### **Bước 1: Kết Nối Google Account**
- Vào **Settings** → **Connect Google**
- Authorize Calendar permissions
- ✅ Done!

### **Bước 2: Cấu Hình TVU**
- Vào **Settings** → **Credentials**
- Thêm MSSV và Password
- ✅ Done!

### **Bước 3: Sync!**
Nói với AI:
```
"Đồng bộ TKB lên Calendar"
```

Hoặc:
```
"Sync schedule to calendar"
"Thêm lịch học vào Google Calendar"
```

**Kết quả:**
```
✅ Đồng bộ thành công!
📅 Đã thêm 15 lớp học vào Google Calendar
```

---

## 📱 Demo Flow

```
User: "Đồng bộ TKB lên Calendar"
   ↓
AI: "✅ Đã thêm 15 lớp học vào Google Calendar"
   ↓
[Mở Google Calendar]
   ↓
→ Tất cả lớp học đã có sẵn! 🎉
→ Notifications tự động
→ Sync với phone
```

---

## 🔧 Chạy Services (Nếu Chưa Chạy)

### **Terminal 1: Main AI Service**
```bash
cd backend/PythonService
python main.py
```

### **Terminal 2: Calendar API**
```bash
cd backend/PythonService
python google_cloud_service_oauth.py
```

### **Terminal 3: OAuth Service**
```bash
cd backend/PythonService
python google_oauth_service.py
```

### **Terminal 4: Spring Boot**
```bash
cd backend
./mvnw spring-boot:run
```

---

## 🧪 Test

```bash
cd backend/PythonService
python test_calendar_sync.py
```

(Cần update `TEST_TOKEN` trong file trước)

---

## 📊 API Endpoint

```bash
POST http://localhost:8000/api/calendar/sync-schedule
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "week": null,      // null = tuần hiện tại
  "hoc_ky": null     // null = học kỳ hiện tại
}
```

---

## 📝 Files Đã Tạo/Sửa

1. ✅ `backend/PythonService/agent_features.py` - Added sync logic
2. ✅ `backend/PythonService/main.py` - Added endpoint + intent detection
3. ✅ `backend/PythonService/test_calendar_sync.py` - Test script
4. ✅ `CALENDAR_SYNC_FEATURE.md` - Full documentation
5. ✅ `CALENDAR_SYNC_QUICK_START.md` - This file

---

## 🎯 Use Cases

### **1. Sync Tuần Hiện Tại**
```
"Đồng bộ TKB lên Calendar"
```

### **2. Sync Tuần Cụ Thể**
```bash
curl -X POST http://localhost:8000/api/calendar/sync-schedule \
  -H "Authorization: Bearer TOKEN" \
  -d '{"week": 10, "hoc_ky": "20251"}'
```

### **3. Xem Lịch**
Mở Google Calendar → Tất cả lớp học đã có!

---

## ⚠️ Lưu Ý

- ✅ Cần connect Google Account trước
- ✅ Cần cấu hình TVU credentials
- ⚠️ Sync nhiều lần có thể tạo duplicate events
- 💡 Mỗi lớp học = 1 event với đầy đủ thông tin

---

## 📈 Benefits

✅ Không cần nhập lịch thủ công
✅ 1 câu lệnh sync toàn bộ
✅ Notifications tự động
✅ Cross-platform (phone, web, desktop)
✅ Luôn đồng bộ với TVU Portal

---

## 🎉 Done!

**Chức năng đã sẵn sàng sử dụng!**

Test ngay: `python test_calendar_sync.py`

Hoặc chat với AI: "Đồng bộ TKB lên Calendar"

**Enjoy!** 🚀

---

## 📖 Full Documentation

Xem chi tiết: `CALENDAR_SYNC_FEATURE.md`
