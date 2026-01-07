# 🔐 ADMIN - QUICK REFERENCE

## ⚡ TÀI KHOẢN ADMIN MẶC ĐỊNH

```
Username: admin
Password: admin123
Email: admin@agentforedu.com
Role: ADMIN
```

**Tự động tạo khi Spring Boot khởi động lần đầu!**

---

## 🚀 QUICK START

### 1. Start Services
```bash
.\start-fullstack.ps1
```

### 2. Login
```
http://localhost:5173
Username: admin
Password: admin123
```

### 3. Change Password
```
Profile → Change Password
```

---

## 👥 TẠO DEMO USERS

```bash
mysql -u root -p Agent_Db < create-demo-users.sql
```

**Tạo:**
- 1 Admin
- 3 Teachers (teacher1, teacher2, teacher3)
- 5 Students (student1-5)
- 2 Users (user1, user2)

**Passwords:**
- Teachers: `teacher123`
- Students: `student123`
- Users: `user123`

---

## 📚 TÀI LIỆU

| File | Mục Đích |
|------|----------|
| `DEFAULT_ADMIN_ACCOUNT.md` | Chi tiết admin account |
| `CREATE_DEMO_USERS.md` | Hướng dẫn tạo demo users |
| `create-demo-users.sql` | SQL script tạo users |
| `DataInitializer.java` | Code tự động tạo admin |

---

## 🔍 VERIFY

```sql
USE Agent_Db;

-- Xem tất cả users
SELECT username, email, role FROM users;

-- Đếm theo role
SELECT role, COUNT(*) FROM users GROUP BY role;
```

---

## 🔒 BẢO MẬT

### Development
✅ Dùng admin/admin123  
✅ Tạo demo users  

### Production
❌ ĐỔI PASSWORD NGAY!  
✅ Xóa demo users  
✅ Tạo admin mới  

---

## 📞 SUPPORT

- Check logs: Spring Boot console
- Verify DB: `SELECT * FROM users WHERE role='ADMIN'`
- Reset password: Xem `DEFAULT_ADMIN_ACCOUNT.md`

---

**⚠️ REMEMBER: Change password after first login!**
