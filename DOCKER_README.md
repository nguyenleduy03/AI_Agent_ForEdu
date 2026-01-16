# 🐳 Docker Deployment Guide - Agent For Edu

## 📋 Yêu cầu hệ thống

- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose v2.0+
- RAM: Tối thiểu 4GB
- Disk: Tối thiểu 10GB trống

## 🚀 Hướng dẫn triển khai

### Bước 1: Cấu hình biến môi trường

```powershell
# Copy file mẫu
cp .env.docker .env

# Mở file .env và điền GEMINI_API_KEY
notepad .env
```

**Bắt buộc phải có:**
- `GEMINI_API_KEY`: Lấy từ https://aistudio.google.com/app/apikey

### Bước 2: Build và chạy

```powershell
# Build tất cả images
docker-compose build

# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Bước 3: Kiểm tra

Sau khi khởi động xong (khoảng 1-2 phút):

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend | http://localhost | Giao diện web |
| Spring Boot API | http://localhost:8080 | Core API |
| Spring Boot Swagger | http://localhost:8080/swagger-ui/index.html | API Docs |
| FastAPI | http://localhost:8000 | AI Service |
| FastAPI Docs | http://localhost:8000/docs | AI API Docs |

## 📦 Các lệnh Docker thường dùng

```powershell
# Xem trạng thái containers
docker-compose ps

# Xem logs của service cụ thể
docker-compose logs -f spring-service
docker-compose logs -f fastapi-service
docker-compose logs -f frontend

# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (reset database)
docker-compose down -v

# Rebuild một service cụ thể
docker-compose build spring-service
docker-compose up -d spring-service

# Vào shell của container
docker exec -it agentforedu-spring sh
docker exec -it agentforedu-fastapi bash
```

## 🏗️ Kiến trúc Docker

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                  (agentforedu-network)                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Frontend   │  │   Spring    │  │   FastAPI   │        │
│  │   (Nginx)   │  │    Boot     │  │  (Python)   │        │
│  │   :80       │  │   :8080     │  │   :8000     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│         │                │                │                │
│         │         ┌──────┴──────┐        │                │
│         │         │    MySQL    │        │                │
│         │         │    :3306    │        │                │
│         │         └─────────────┘        │                │
│         │                                │                │
│         │         ┌─────────────┐        │                │
│         │         │  ChromaDB   │◄───────┘                │
│         │         │  (Volume)   │                         │
│         │         └─────────────┘                         │
└─────────┴───────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### Lỗi: MySQL không khởi động được
```powershell
# Xóa volume cũ và tạo lại
docker-compose down -v
docker-compose up -d
```

### Lỗi: Spring Boot không kết nối được MySQL
```powershell
# Đợi MySQL healthy trước
docker-compose logs mysql
# Nếu thấy "ready for connections" thì restart spring
docker-compose restart spring-service
```

### Lỗi: Frontend không gọi được API
```powershell
# Kiểm tra nginx config
docker exec -it agentforedu-frontend cat /etc/nginx/conf.d/default.conf
```

### Lỗi: Out of memory
```powershell
# Tăng memory cho Docker Desktop
# Settings > Resources > Memory > 4GB+
```

## 📊 Monitoring

```powershell
# Xem resource usage
docker stats

# Xem disk usage
docker system df
```

## 🧹 Cleanup

```powershell
# Xóa containers đã dừng
docker container prune

# Xóa images không dùng
docker image prune

# Xóa tất cả (cẩn thận!)
docker system prune -a
```
