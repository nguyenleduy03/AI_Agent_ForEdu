# 🔄 Auto Sync TKB → Google Calendar

## ✅ **Hoàn Thành!**

Chức năng **tự động đồng bộ Thời Khóa Biểu lên Google Calendar** đã sẵn sàng!

---

## 🎯 **Tính Năng**

### **Làm Được Gì?**
- ✅ Tự động lấy TKB từ TVU Portal
- ✅ Tạo events trên Google Calendar cho tất cả lớp học
- ✅ Bao gồm đầy đủ thông tin: Môn học, Giảng viên, Phòng học, Thời gian
- ✅ Hỗ trợ sync tuần cụ thể hoặc tuần hiện tại
- ✅ Có thể gọi qua API hoặc Chat với AI

### **Yêu Cầu:**
1. ✅ Đã kết nối Google Account (OAuth) trong Settings
2. ✅ Đã cấu hình tài khoản TVU trong Settings → Credentials

---

## 🚀 **Cách Sử Dụng**

### **1. Qua Chat với AI** (Dễ nhất!)

Chỉ cần nói với AI:

```
"Đồng bộ TKB lên Calendar"
"Sync schedule to calendar"
"Thêm lịch học vào Google Calendar"
"Đưa TKB tuần này lên calendar"
```

AI sẽ tự động:
1. Lấy TKB từ TVU Portal
2. Tạo events trên Google Calendar
3. Báo kết quả

**Ví dụ Response:**
```
✅ Đồng bộ thành công!

📅 Đã thêm 15 lớp học vào Google Calendar

📚 Chi tiết:
• Tuần: hiện tại
• Học kỳ: hiện tại

🔗 Xem lịch tại: Google Calendar
```

---

### **2. Qua API Endpoint**

**Endpoint:** `POST /api/calendar/sync-schedule`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "week": 5,           // Optional: Tuần học (null = tuần hiện tại)
  "hoc_ky": "20251"    // Optional: Học kỳ (null = học kỳ hiện tại)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✅ Đồng bộ thành công!\n\n📅 Đã thêm 15 lớp học vào Google Calendar...",
  "events_created": 15,
  "events_failed": 0
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "❌ Chưa cấu hình tài khoản TVU...",
  "events_created": 0
}
```

---

### **3. Test Script**

Chạy test script để kiểm tra:

```bash
cd backend/PythonService
python test_calendar_sync.py
```

**Lưu ý:** Cần update `TEST_TOKEN` trong file trước khi chạy.

---

## 📋 **Chi Tiết Kỹ Thuật**

### **Flow Hoạt Động:**

```
User Request
    ↓
1. Detect Intent (chat) hoặc API call
    ↓
2. Get TVU Credentials từ MySQL
    ↓
3. Login TVU Portal
    ↓
4. Get Schedule (TKB) từ TVU API
    ↓
5. Parse Schedule Data
    ↓
6. For each class:
   - Calculate date (next occurrence of day_of_week)
   - Format datetime (ISO 8601 + timezone)
   - Create event on Google Calendar
    ↓
7. Return result (events_created, events_failed)
```

### **Files Modified:**

1. **`backend/PythonService/agent_features.py`**
   - Added: `sync_schedule_to_calendar()` - Main sync logic
   - Added: `detect_calendar_sync_intent()` - Intent detection

2. **`backend/PythonService/main.py`**
   - Added: `/api/calendar/sync-schedule` endpoint
   - Added: Calendar sync intent detection in chat handler

3. **`backend/PythonService/test_calendar_sync.py`** (NEW)
   - Test script for calendar sync feature

4. **`CALENDAR_SYNC_FEATURE.md`** (NEW)
   - This documentation file

---

## 🔧 **API Services Required**

Chức năng này cần 3 services chạy đồng thời:

### **1. Main AI Service (Port 8000)**
```bash
cd backend/PythonService
python main.py
```

### **2. Google Cloud Service (Port 8004)**
```bash
cd backend/PythonService
python google_cloud_service_oauth.py
```

### **3. OAuth Service (Port 8003)**
```bash
cd backend/PythonService
python google_oauth_service.py
```

### **4. Spring Boot Backend (Port 8080)**
```bash
cd backend
./mvnw spring-boot:run
```

---

## 📊 **Event Format**

Mỗi lớp học được tạo thành 1 event với format:

**Summary:** `📚 Tên Môn Học`

**Description:**
```
Giảng viên: Tên GV
Lớp: Mã Lớp
```

**Start Time:** `2025-12-23T07:00:00+07:00` (ISO 8601 + timezone)

**End Time:** `2025-12-23T09:00:00+07:00`

**Location:** `Phòng A101` (nếu có)

---

## 🎯 **Use Cases**

### **Use Case 1: Sync Tuần Hiện Tại**
```
User: "Đồng bộ TKB lên Calendar"
AI: ✅ Đã thêm 15 lớp học vào Google Calendar
```

### **Use Case 2: Sync Tuần Cụ Thể**
```bash
curl -X POST http://localhost:8000/api/calendar/sync-schedule \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"week": 10, "hoc_ky": "20251"}'
```

### **Use Case 3: Sync Toàn Bộ Học Kỳ**
Gọi API nhiều lần với week từ 1-20:
```python
for week in range(1, 21):
    sync_schedule(week=week, hoc_ky="20251")
```

---

## ⚠️ **Lưu Ý**

### **1. Duplicate Events**
- Nếu sync nhiều lần, có thể tạo duplicate events
- Google Calendar không tự động detect duplicates
- **Giải pháp:** Xóa events cũ trước khi sync lại

### **2. Date Calculation**
- Tính ngày dựa trên `day_of_week` (MONDAY, TUESDAY, ...)
- Lấy ngày gần nhất trong tuần tới
- **Lưu ý:** Nếu hôm nay là Thứ 3, lớp Thứ 2 sẽ được tạo cho Thứ 2 tuần sau

### **3. Timezone**
- Mặc định: `Asia/Ho_Chi_Minh` (+07:00)
- Đảm bảo timezone đúng để events hiển thị đúng giờ

### **4. Error Handling**
- Nếu 1 event fail, các events khác vẫn tiếp tục
- Response trả về `events_created` và `events_failed`

---

## 🔮 **Future Enhancements**

### **Phase 2:**
- [ ] Recurring events (lặp lại hàng tuần)
- [ ] Smart duplicate detection
- [ ] Batch delete old events
- [ ] Color coding by subject
- [ ] Reminders (30 phút trước lớp)

### **Phase 3:**
- [ ] Sync 2-way (Calendar → TKB)
- [ ] Share calendar với bạn bè
- [ ] Group study planning
- [ ] Exam countdown

---

## 🧪 **Testing**

### **Manual Test:**

1. **Kết nối Google Account:**
   - Vào Settings → Connect Google
   - Authorize Calendar permissions

2. **Cấu hình TVU:**
   - Vào Settings → Credentials
   - Thêm MSSV và Password

3. **Test Sync:**
   - Chat: "Đồng bộ TKB lên Calendar"
   - Hoặc gọi API endpoint

4. **Verify:**
   - Mở Google Calendar
   - Kiểm tra events đã được tạo

### **Automated Test:**
```bash
python test_calendar_sync.py
```

---

## 📈 **Benefits**

✅ **Tiện lợi:** Không cần nhập lịch thủ công
✅ **Tự động:** 1 câu lệnh sync toàn bộ TKB
✅ **Đồng bộ:** Lịch luôn cập nhật với TVU Portal
✅ **Cross-platform:** Xem lịch trên phone, web, desktop
✅ **Notifications:** Google Calendar tự động nhắc nhở

---

## 🎉 **Demo**

### **Before:**
```
User: "Hôm nay tôi học gì?"
AI: [Shows schedule from TVU Portal]
```

### **After:**
```
User: "Đồng bộ TKB lên Calendar"
AI: ✅ Đã thêm 15 lớp học vào Google Calendar

[User mở Google Calendar]
→ Tất cả lớp học đã có sẵn
→ Notifications tự động
→ Sync với phone
```

---

## 📞 **Support**

Nếu gặp lỗi:

1. **Check Services:**
   ```bash
   # Main AI Service
   curl http://localhost:8000/
   
   # Calendar API
   curl http://localhost:8004/
   
   # OAuth Service
   curl http://localhost:8003/
   ```

2. **Check Logs:**
   - Xem console output của các services
   - Tìm error messages

3. **Common Issues:**
   - `401 Unauthorized`: Chưa connect Google Account
   - `400 Bad Request`: Chưa cấu hình TVU credentials
   - `503 Service Unavailable`: Calendar API chưa chạy

---

## ✨ **Summary**

**Chức năng Auto Sync TKB → Google Calendar đã hoàn thành!** 🎉

**Cách dùng:**
1. Connect Google Account
2. Cấu hình TVU credentials
3. Nói với AI: "Đồng bộ TKB lên Calendar"
4. Done! ✅

**Test ngay:** `python test_calendar_sync.py`

**Enjoy!** 🚀
