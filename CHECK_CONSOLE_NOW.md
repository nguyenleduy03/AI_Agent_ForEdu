# 🔍 KIỂM TRA CONSOLE NGAY

## ⚠️ VẤN ĐỀ HIỆN TẠI

Bạn chỉ thấy **OPTIONS request** (preflight) mà không thấy **POST request** thực sự.

Điều này có nghĩa là:
1. Request bị block trước khi gửi
2. Có lỗi JavaScript trong Console
3. Hoặc CORS preflight failed

## 🔍 KIỂM TRA NGAY

### Bước 1: Mở Console
1. Mở browser: `http://localhost:5173`
2. Nhấn `F12`
3. Chọn tab **Console**

### Bước 2: Tìm Lỗi Màu Đỏ
Tìm các lỗi như:
- ❌ `CORS policy`
- ❌ `Failed to fetch`
- ❌ `Network error`
- ❌ `Cannot read property`
- ❌ `undefined is not an object`

### Bước 3: Gửi Tin Nhắn Test
```
gửi email cho test@gmail.com hỏi ăn cơm chưa
```

### Bước 4: Xem Console Output
Tìm các log:
- ✅ `🔍 FULL API RESPONSE:` → Request thành công
- ❌ Lỗi màu đỏ → Request failed

## 🚨 CÁC LỖI THƯỜNG GẶP

### Lỗi 1: CORS Error
```
Access to XMLHttpRequest at 'http://localhost:8000/api/chat' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Nguyên nhân:** Backend không cho phép CORS từ port 5173

**Giải pháp:** Kiểm tra backend CORS config

### Lỗi 2: Network Error
```
POST http://localhost:8000/api/chat net::ERR_CONNECTION_REFUSED
```

**Nguyên nhân:** Backend không chạy hoặc chạy sai port

**Giải pháp:** Kiểm tra backend có chạy không

### Lỗi 3: JavaScript Error
```
Cannot read property 'emailDraft' of undefined
```

**Nguyên nhân:** Code lỗi khi xử lý response

**Giải pháp:** Cần fix code

## 📸 CHỤP MÀN HÌNH

Vui lòng chụp:
1. **Console tab** (F12 → Console) - Toàn bộ logs và errors
2. **Network tab** (F12 → Network) - Cả OPTIONS và POST requests
3. **Màn hình chat** - Có hiện gì không

## 🎯 ĐIỀU TÔI CẦN BIẾT

1. **Console có lỗi màu đỏ không?**
   - Có → Lỗi gì? (chụp màn hình)
   - Không → Có thấy log "🔍 FULL API RESPONSE" không?

2. **Network tab có POST request không?**
   - Có → Status code bao nhiêu? Response là gì?
   - Không → Chỉ có OPTIONS → Request bị block

3. **Backend có chạy không?**
   - Kiểm tra terminal backend
   - Có thấy log "POST /api/chat" không?

---

**QUAN TRỌNG:** 
Hãy mở Console (F12) và chụp màn hình cho tôi xem!
Không có Console logs thì tôi không thể debug được.
