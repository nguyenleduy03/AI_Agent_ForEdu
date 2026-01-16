# 🚀 HƯỚNG DẪN TRIỂN KHAI - AGENT FOR EDU

## Yêu cầu hệ thống
- Docker Desktop 4.0+
- RAM: 8GB+
- Disk: 10GB free space

## Khởi động hệ thống

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd CN_DA22TTD_NguyenLeDuy_Xaydungaiagenthotrohoctap
```

### Bước 2: Cấu hình môi trường
```bash
# Copy file .env mẫu
cp .env.example .env

# Chỉnh sửa các biến môi trường nếu cần
# MYSQL_ROOT_PASSWORD=1111
# MYSQL_DATABASE=Agent_Db
```

### Bước 3: Build và khởi động containers
```bash
# Build tất cả images
docker-compose build

# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Bước 4: Kiểm tra health
```bash
# Kiểm tra containers đang chạy
docker-compose ps

# Kết quả mong đợi:
# NAME                    STATUS              PORTS
# mysql                   Up (healthy)        3306
# spring-boot             Up (healthy)        8080
# fastapi                 Up (healthy)        8000, 8001
# frontend                Up                  5173
```

### Bước 5: Truy cập ứng dụng
- **Frontend:** http://localhost:5173
- **Spring Boot API:** http://localhost:8080
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **FastAPI Docs:** http://localhost:8000/docs
- **MySQL:** localhost:3306

## Dừng hệ thống
```bash
# Dừng tất cả containers
docker-compose down

# Dừng và xóa volumes (reset database)
docker-compose down -v
```

## Troubleshooting

### Lỗi: Port already in use
```bash
# Kiểm tra port đang sử dụng
netstat -ano | findstr :8080
netstat -ano | findstr :3306

# Kill process hoặc đổi port trong docker-compose.yml
```

### Lỗi: Container không start
```bash
# Xem logs chi tiết
docker-compose logs <service-name>

# Ví dụ:
docker-compose logs spring-boot
docker-compose logs mysql
```

### Lỗi: Database connection failed
```bash
# Đợi MySQL khởi động hoàn toàn (30-60s)
# Hoặc restart Spring Boot container
docker-compose restart spring-boot
```

## Kiến trúc Containers

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│              React + Vite + TypeScript                   │
│              Port: 5173                                  │
│              Image: node:20-alpine                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST API
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼─────────┐
│  SPRING BOOT     │    │    FASTAPI       │
│  Java 17         │◄───┤  Python 3.11     │
│  Port: 8080      │    │  Port: 8000/8001 │
│  Image: openjdk  │    │  Image: python   │
└───────┬──────────┘    └────────┬─────────┘
        │                        │
        └────────┬───────────────┘
                 │
        ┌────────▼──────────┐
        │   MYSQL 8.0       │
        │   Port: 3306      │
        │   Image: mysql    │
        └───────────────────┘
```

## Monitoring

### Kiểm tra resource usage
```bash
docker stats
```

### Kiểm tra logs real-time
```bash
# Tất cả services
docker-compose logs -f

# Một service cụ thể
docker-compose logs -f spring-boot
```

## Production Deployment

### Sử dụng Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-compose.yml eduagent
```

### Sử dụng Kubernetes
```bash
# Convert docker-compose to k8s
kompose convert

# Deploy to k8s
kubectl apply -f .
```

## Backup & Restore

### Backup database
```bash
docker exec mysql mysqldump -u root -p1111 Agent_Db > backup.sql
```

### Restore database
```bash
docker exec -i mysql mysql -u root -p1111 Agent_Db < backup.sql
```
