# 🔐 TÀI KHOẢN ADMIN MẶC ĐỊNH

## ✅ TỰ ĐỘNG TẠO KHI KHỞI ĐỘNG

Khi Spring Boot khởi động lần đầu, hệ thống sẽ **tự động tạo** tài khoản admin nếu chưa tồn tại.

---

## 👤 THÔNG TIN TÀI KHOẢN

```
Username: admin
Password: admin123
Email: admin@agentforedu.com
Role: ADMIN
```

---

## 🚀 CÁCH SỬ DỤNG

### 1. Khởi Động Spring Boot

```bash
cd backend/SpringService/agentforedu
./mvnw spring-boot:run
```

### 2. Xem Logs

Khi khởi động, bạn sẽ thấy:

```
========================================
✅ DEFAULT ADMIN USER CREATED
========================================
Username: admin
Password: admin123
Email: admin@agentforedu.com
Role: ADMIN
========================================
⚠️  PLEASE CHANGE PASSWORD AFTER FIRST LOGIN!
========================================
```

### 3. Login

1. Mở http://localhost:5173
2. Click "Sign In"
3. Nhập:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Click "Sign In"

---

## 🔒 BẢO MẬT

### ⚠️ QUAN TRỌNG

1. **ĐỔI MẬT KHẨU NGAY SAU KHI LOGIN LẦN ĐẦU**
   - Vào Profile → Change Password
   - Đặt mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, số, ký tự đặc biệt)

2. **KHÔNG SỬ DỤNG MẬT KHẨU MẶC ĐỊNH TRÊN PRODUCTION**
   - Mật khẩu `admin123` chỉ dùng cho development
   - Production phải đổi ngay

3. **TẠO ADMIN MỚI VÀ XÓA ADMIN MẶC ĐỊNH**
   - Tạo admin mới với thông tin thật
   - Xóa tài khoản `admin` mặc định

---

## 🔧 CODE IMPLEMENTATION

File: `backend/SpringService/agentforedu/src/main/java/aiagent/dacn/agentforedu/config/DataInitializer.java`

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdminIfNotExists();
    }

    private void createDefaultAdminIfNotExists() {
        // Check if admin already exists
        if (userRepository.existsByUsername("admin")) {
            log.info("✅ Admin user already exists");
            return;
        }

        // Create default admin user
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setEmail("admin@agentforedu.com");
        admin.setFullName("Administrator");
        admin.setRole(UserRole.ADMIN);

        userRepository.save(admin);

        log.info("✅ DEFAULT ADMIN USER CREATED");
        // ... logs
    }
}
```

---

## 📊 CÁC TÀI KHOẢN MẪU KHÁC

Nếu muốn tạo thêm user mẫu cho testing, xem file:
- `CREATE_DEMO_USERS.md` - Hướng dẫn tạo user demo
- `backend/SpringService/agentforedu/insert_demo_data.sql` - SQL script

---

## 🔍 KIỂM TRA TÀI KHOẢN

### Cách 1: Qua MySQL

```sql
USE Agent_Db;

SELECT id, username, email, full_name, role, created_at 
FROM users 
WHERE role = 'ADMIN';
```

### Cách 2: Qua API

```bash
# Login để lấy token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response sẽ có token và user info
```

### Cách 3: Qua Swagger UI

1. Mở http://localhost:8080/swagger-ui/index.html
2. Tìm endpoint `POST /api/auth/login`
3. Click "Try it out"
4. Nhập username và password
5. Click "Execute"

---

## 🛠️ TROUBLESHOOTING

### Admin không được tạo?

**Kiểm tra:**

1. **Database đã tồn tại chưa?**
   ```sql
   SHOW DATABASES LIKE 'Agent_Db';
   ```

2. **Table users đã được tạo chưa?**
   ```sql
   USE Agent_Db;
   SHOW TABLES LIKE 'users';
   ```

3. **Xem logs Spring Boot**
   ```
   Tìm dòng: "✅ DEFAULT ADMIN USER CREATED"
   Hoặc: "✅ Admin user already exists"
   ```

4. **Admin đã tồn tại rồi**
   ```sql
   SELECT * FROM users WHERE username = 'admin';
   ```

### Quên mật khẩu admin?

**Reset password qua SQL:**

```sql
USE Agent_Db;

-- Reset password về "admin123"
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE username = 'admin';
```

**Hoặc xóa và tạo lại:**

```sql
-- Xóa admin cũ
DELETE FROM users WHERE username = 'admin';

-- Restart Spring Boot để tự động tạo lại
```

---

## 📝 THAY ĐỔI MẬT KHẨU MẶC ĐỊNH

Nếu muốn đổi mật khẩu mặc định trong code:

File: `DataInitializer.java`

```java
// Thay đổi dòng này:
admin.setPassword(passwordEncoder.encode("admin123"));

// Thành:
admin.setPassword(passwordEncoder.encode("your_secure_password"));
```

**Lưu ý:** Phải rebuild và restart Spring Boot.

---

## 🎯 BEST PRACTICES

### Development
```
✅ Dùng admin/admin123
✅ Tạo thêm user test
✅ Không cần bảo mật cao
```

### Production
```
❌ KHÔNG dùng admin/admin123
✅ Đổi password ngay
✅ Tạo admin mới với email thật
✅ Xóa admin mặc định
✅ Enable 2FA (nếu có)
✅ Log tất cả admin actions
```

---

## 📞 SUPPORT

Nếu gặp vấn đề:

1. Check logs Spring Boot
2. Check database connection
3. Verify table `users` exists
4. Check `application.yaml` config

---

**Tạo**: 2026-01-07  
**Status**: ✅ AUTO-CREATED ON STARTUP  
**Default Password**: admin123 (⚠️ CHANGE IMMEDIATELY!)
