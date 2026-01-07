# 🐛 DEBUG REGISTER 400 ERROR

## 🔍 PHÂN TÍCH VẤN ĐỀ

### Request từ Frontend
```typescript
// RegisterRequest interface
{
  username: string;
  password: string;
  email: string;
  fullName: string;
  role?: string;  // Optional: "STUDENT" hoặc "TEACHER"
}
```

### Backend Expects (RegisterRequest.java)
```java
@NotBlank(message = "Username không được để trống")
@Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
private String username;

@NotBlank(message = "Password không được để trống")
@Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
private String password;

@NotBlank(message = "Email không được để trống")
@Email(message = "Email không hợp lệ")
private String email;

@NotBlank(message = "Full name không được để trống")
private String fullName;

private String role; // Optional
```

---

## 🔧 CÁCH DEBUG

### 1. Mở Browser Console (F12)

Khi bạn click "Create Account", xem tab **Network**:

1. Click vào request `/api/auth/register`
2. Xem tab **Payload** hoặc **Request**
3. Kiểm tra data gửi đi

### 2. Kiểm Tra Response

Trong tab **Response**, xem error message chi tiết:

```json
{
  "message": "Validation failed",
  "errors": {
    "username": "Username phải từ 3-50 ký tự",
    "email": "Email không hợp lệ"
  }
}
```

---

## ✅ GIẢI PHÁP

### Nguyên Nhân Có Thể:

1. **Username quá ngắn** (< 3 ký tự)
2. **Password quá ngắn** (< 6 ký tự)
3. **Email không hợp lệ** (thiếu @, domain)
4. **Full name để trống**
5. **CORS issue** (nhưng không phải vì đã thấy request đến server)

### Test Với Data Hợp Lệ:

```
Full Name: John Doe
Username: johndoe (ít nhất 3 ký tự)
Email: john@example.com (phải có @ và domain)
Password: 123456 (ít nhất 6 ký tự)
Role: STUDENT
```

---

## 🚀 QUICK FIX

### Option 1: Kiểm Tra Spring Boot Logs

```powershell
# Xem logs trong console Spring Boot
# Tìm dòng có "Validation failed" hoặc "400"
```

### Option 2: Test API Trực Tiếp

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "STUDENT"
  }'
```

### Option 3: Thêm Validation Message trong Frontend

Sửa file `fronend_web/src/pages/LoginPage.tsx`:

```typescript
// Thêm validation trước khi submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate trước khi gửi
  if (!isLogin) {
    if (formData.username.length < 3) {
      toast.error('Username phải có ít nhất 3 ký tự');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password phải có ít nhất 6 ký tự');
      return;
    }
    if (!formData.email.includes('@')) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error('Full name không được để trống');
      return;
    }
  }
  
  setLoading(true);
  // ... rest of code
};
```

---

## 📊 CHECKLIST DEBUG

- [ ] Mở Browser Console (F12)
- [ ] Vào tab Network
- [ ] Click "Create Account"
- [ ] Xem request `/api/auth/register`
- [ ] Check Payload data
- [ ] Check Response error message
- [ ] Verify:
  - [ ] Username >= 3 ký tự
  - [ ] Password >= 6 ký tự
  - [ ] Email có @ và domain
  - [ ] Full name không trống
- [ ] Xem Spring Boot console logs

---

## 🎯 NEXT STEPS

1. **Mở Browser Console** và xem error message chi tiết
2. **Copy error message** và gửi cho tôi
3. Tôi sẽ fix chính xác vấn đề

Hoặc thử test với data này:
- Username: `testuser123`
- Password: `password123`
- Email: `test@gmail.com`
- Full Name: `Test User`
- Role: `STUDENT`

---

**Hãy cho tôi biết error message chi tiết trong Response tab!**
