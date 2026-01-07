# 🔧 FIX GMAIL SSL ERROR

## 🐛 VẤN ĐỀ

```
SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl.c:1006)'))
```

Lỗi SSL khi gửi email qua Gmail API trên Windows.

---

## ✅ GIẢI PHÁP

### Option 1: Update Certificates (Khuyến nghị)

```powershell
# 1. Update pip
python -m pip install --upgrade pip

# 2. Update certifi (SSL certificates)
pip install --upgrade certifi

# 3. Update requests và urllib3
pip install --upgrade requests urllib3

# 4. Restart Python service
```

### Option 2: Disable SSL Verification (Temporary - CHỈ cho development)

Sửa file `backend/PythonService/gmail_service.py`:

```python
# Tìm dòng:
response = requests.post(
    f"{self.gmail_api}/users/me/messages/send",
    headers=self._get_headers(access_token),
    json={"raw": raw_message},
    timeout=15
)

# Thay bằng:
response = requests.post(
    f"{self.gmail_api}/users/me/messages/send",
    headers=self._get_headers(access_token),
    json={"raw": raw_message},
    timeout=15,
    verify=False  # ⚠️ CHỈ cho development
)
```

### Option 3: Use Session với Retry

Tốt nhất - Thêm retry logic:

```python
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import requests

def create_session_with_retry():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.3,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session
```

---

## 🚀 QUICK FIX (Chạy Ngay)

```powershell
# Stop Python service
# Ctrl+C trong terminal đang chạy Python

# Update packages
cd backend/PythonService
pip install --upgrade certifi requests urllib3

# Restart
python main.py
```

---

## 🔍 KIỂM TRA

### 1. Test SSL Connection

```python
import ssl
import certifi

print(f"SSL Version: {ssl.OPENSSL_VERSION}")
print(f"Certifi path: {certifi.where()}")
```

### 2. Test Gmail API Direct

```python
import requests

response = requests.get(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    timeout=10
)
print(response.status_code)
```

---

## 📝 ROOT CAUSE

Lỗi này xảy ra vì:
1. **Outdated SSL certificates** trong Python
2. **Windows SSL/TLS issues** với Python requests
3. **Firewall/Antivirus** chặn SSL connection
4. **Proxy settings** không đúng

---

## ⚠️ LƯU Ý

- **KHÔNG disable SSL verification** trên production
- Nếu vẫn lỗi sau khi update → Check firewall/antivirus
- Có thể cần restart máy sau khi update certificates

---

**Hãy chạy lệnh update và test lại!**
