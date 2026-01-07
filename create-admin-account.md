# 👤 TẠO TÀI KHOẢN ADMIN

## 🔍 KIỂM TRA TÀI KHOẢN HIỆN TẠI

### Cách 1: Qua MySQL Command Line

```bash
mysql -u root -p
```

```sql
USE Agent_Db;

-- Xem tất cả users
SELECT id, username, email, full_name, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- Xem chỉ admin
SELECT id, username, email, full_name, role 
FROM users 
WHERE role = 'ADMIN';
```

### Cách 2: Qua API (nếu đã có tài khoản)

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get profile
curl http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ TẠO TÀI KHOẢN ADMIN MỚI

### Option 1: Qua API Register (Khuyến nghị)

1. **Mở frontend**: http://localhost:5173
2. **Click "Sign Up"**
3. **Điền thông tin:**
   - Full Name: `Admin User`
   - Username: `admin`
   - Email: `admin@agentforedu.com`
   - Password: `admin123` (hoặc password mạnh hơn)
   - Role: **STUDENT** (