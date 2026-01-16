# 🐳 DOCKER - GIẢI THÍCH CHI TIẾT CHO THUYẾT TRÌNH

## 📚 MỤC LỤC
1. Docker là gì?
2. Các khái niệm cơ bản
3. So sánh Docker vs Virtual Machine
4. Docker trong dự án của bạn
5. Câu hỏi thường gặp

---

## 1️⃣ DOCKER LÀ GÌ?

### Định nghĩa đơn giản:
**Docker là nền tảng để đóng gói, phân phối và chạy ứng dụng trong các container.**

### Ví dụ dễ hiểu:
```
Tưởng tượng Docker như một "container vận chuyển hàng hóa":

🚢 Container vận chuyển:
- Đóng gói hàng hóa an toàn
- Vận chuyển đi khắp nơi
- Mở ra ở đâu cũng giống nhau

🐳 Docker Container:
- Đóng gói ứng dụng + dependencies
- Chạy trên mọi máy tính
- Môi trường giống hệt nhau
```

### Vấn đề Docker giải quyết:
**"It works on my machine" problem**

```
❌ Trước khi có Docker:
Developer: "Code chạy tốt trên máy tôi!"
Tester: "Sao trên máy tôi lỗi?"
DevOps: "Deploy lên server lại lỗi khác nữa!"

✅ Với Docker:
Developer: "Đây là Docker image, chạy đi!"
Tester: "OK, chạy y hệt!"
DevOps: "Deploy xong, chạy ngon!"
```

---

## 2️⃣ CÁC KHÁI NIỆM CƠ BẢN

### A. Docker Image (Khuôn mẫu)

**Định nghĩa:**
- Image là **template** (khuôn mẫu) chứa mọi thứ cần để chạy ứng dụng
- Bao gồm: code, runtime, libraries, dependencies, config files

**Ví dụ:**
```dockerfile
# Dockerfile - Công thức tạo Image
FROM node:20-alpine          # Nền tảng: Node.js 20
WORKDIR /app                 # Thư mục làm việc
COPY package*.json ./        # Copy file dependencies
RUN npm install              # Cài đặt dependencies
COPY . .                     # Copy source code
EXPOSE 5173                  # Mở port 5173
CMD ["npm", "run", "dev"]    # Lệnh chạy ứng dụng
```

**Tương tự:**
```
Image giống như:
- 📀 Đĩa CD cài Windows (chưa cài)
- 📋 Công thức nấu ăn (chưa nấu)
- 🏗️ Bản thiết kế nhà (chưa xây)
```

**Lệnh thường dùng:**
```bash
# Xem danh sách images
docker images

# Build image từ Dockerfile
docker build -t my-app:1.0 .

# Pull image từ Docker Hub
docker pull mysql:8.0

# Xóa image
docker rmi my-app:1.0
```

---

### B. Docker Container (Thực thể chạy)

**Định nghĩa:**
- Container là **instance** (thực thể) đang chạy của Image
- Một Image có thể tạo nhiều Container

**Ví dụ:**
```
Image: mysql:8.0
  ↓ docker run
Container 1: mysql_dev (port 3306)
Container 2: mysql_test (port 3307)
Container 3: mysql_prod (port 3308)
```

**Tương tự:**
```
Container giống như:
- 💻 Windows đã cài và đang chạy
- 🍜 Món ăn đã nấu xong
- 🏠 Ngôi nhà đã xây xong
```

**Lệnh thường dùng:**
```bash
# Chạy container từ image
docker run -d -p 8080:8080 --name my-app my-app:1.0

# Xem containers đang chạy
docker ps

# Xem tất cả containers (cả đã dừng)
docker ps -a

# Dừng container
docker stop my-app

# Khởi động lại container
docker start my-app

# Xóa container
docker rm my-app

# Xem logs
docker logs my-app

# Vào bên trong container
docker exec -it my-app bash
```

---

### C. Dockerfile (Công thức)

**Định nghĩa:**
- File text chứa các lệnh để build Docker Image
- Giống như "công thức nấu ăn" để tạo Image

**Cấu trúc:**
```dockerfile
# 1. Base Image - Nền tảng
FROM openjdk:17-slim

# 2. Metadata
LABEL maintainer="your-email@example.com"
LABEL version="1.0"

# 3. Environment Variables
ENV APP_HOME=/app
ENV SPRING_PROFILES_ACTIVE=production

# 4. Working Directory
WORKDIR $APP_HOME

# 5. Copy files
COPY target/app.jar app.jar

# 6. Expose Port
EXPOSE 8080

# 7. Health Check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# 8. Run Command
CMD ["java", "-jar", "app.jar"]
```

**Các lệnh quan trọng:**

| Lệnh | Ý nghĩa | Ví dụ |
|------|---------|-------|
| `FROM` | Image nền tảng | `FROM node:20` |
| `WORKDIR` | Thư mục làm việc | `WORKDIR /app` |
| `COPY` | Copy file vào image | `COPY . .` |
| `RUN` | Chạy lệnh khi build | `RUN npm install` |
| `EXPOSE` | Mở port | `EXPOSE 8080` |
| `CMD` | Lệnh chạy container | `CMD ["npm", "start"]` |
| `ENV` | Biến môi trường | `ENV NODE_ENV=production` |

---

### D. Docker Compose (Điều phối nhiều container)

**Định nghĩa:**
- Tool để định nghĩa và chạy **nhiều container** cùng lúc
- Sử dụng file YAML để cấu hình

**Vấn đề giải quyết:**
```
❌ Không có Docker Compose:
docker run mysql ...
docker run spring-boot ...
docker run fastapi ...
docker run frontend ...
→ Phải chạy 4 lệnh, khó quản lý!

✅ Với Docker Compose:
docker-compose up
→ Chỉ 1 lệnh, chạy tất cả!
```

**Ví dụ docker-compose.yml:**
```yaml
version: '3.8'

services:
  # Service 1: MySQL Database
  mysql:
    image: mysql:8.0
    container_name: eduagent-mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: 1111
      MYSQL_DATABASE: Agent_Db
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - eduagent-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Service 2: Spring Boot
  spring-boot:
    build: ./backend/SpringService/agentforedu
    container_name: eduagent-spring
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/Agent_Db
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: 1111
    networks:
      - eduagent-network

  # Service 3: FastAPI
  fastapi:
    build: ./backend/PythonService
    container_name: eduagent-fastapi
    ports:
      - "8000:8000"
      - "8001:8001"
    depends_on:
      - mysql
    environment:
      MYSQL_HOST: mysql
      MYSQL_PORT: 3306
      MYSQL_USER: root
      MYSQL_PASSWORD: 1111
      MYSQL_DATABASE: Agent_Db
    networks:
      - eduagent-network

  # Service 4: Frontend
  frontend:
    build: ./fronend_web
    container_name: eduagent-frontend
    ports:
      - "5173:5173"
    depends_on:
      - spring-boot
      - fastapi
    networks:
      - eduagent-network

# Định nghĩa volumes (lưu trữ dữ liệu)
volumes:
  mysql_data:
    driver: local

# Định nghĩa networks (mạng nội bộ)
networks:
  eduagent-network:
    driver: bridge
```

**Lệnh Docker Compose:**
```bash
# Build tất cả images
docker-compose build

# Khởi động tất cả services
docker-compose up

# Chạy background (detached mode)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Xem logs của 1 service
docker-compose logs -f spring-boot

# Dừng tất cả
docker-compose down

# Dừng và xóa volumes (reset database)
docker-compose down -v

# Xem trạng thái
docker-compose ps

# Restart 1 service
docker-compose restart spring-boot
```

---

### E. Docker Volume (Lưu trữ dữ liệu)

**Định nghĩa:**
- Cơ chế lưu trữ dữ liệu **bền vững** (persistent)
- Dữ liệu không mất khi container bị xóa

**Vấn đề:**
```
❌ Không có Volume:
Container MySQL → Lưu data bên trong
Container bị xóa → Data mất hết!

✅ Có Volume:
Container MySQL → Lưu data vào Volume
Container bị xóa → Data vẫn còn!
```

**Ví dụ:**
```yaml
services:
  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql  # Mount volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # Mount file

volumes:
  mysql_data:  # Định nghĩa volume
```

**Lệnh:**
```bash
# Xem danh sách volumes
docker volume ls

# Tạo volume
docker volume create my-data

# Xóa volume
docker volume rm my-data

# Xóa tất cả volumes không dùng
docker volume prune
```

---

### F. Docker Network (Mạng nội bộ)

**Định nghĩa:**
- Cho phép các container **giao tiếp** với nhau
- Cô lập mạng giữa các nhóm container

**Ví dụ:**
```
Network: eduagent-network
  ├── mysql (hostname: mysql)
  ├── spring-boot (hostname: spring-boot)
  ├── fastapi (hostname: fastapi)
  └── frontend (hostname: frontend)

Spring Boot connect MySQL:
jdbc:mysql://mysql:3306/Agent_Db
         ↑ hostname trong network
```

**Lệnh:**
```bash
# Xem danh sách networks
docker network ls

# Tạo network
docker network create my-network

# Xem chi tiết network
docker network inspect eduagent-network

# Xóa network
docker network rm my-network
```

---

## 3️⃣ SO SÁNH DOCKER VS VIRTUAL MACHINE

### Sơ đồ kiến trúc:

```
┌─────────────────────────────────────────────────────────┐
│                  VIRTUAL MACHINE                         │
├─────────────────────────────────────────────────────────┤
│  App A  │  App B  │  App C                              │
│  Libs   │  Libs   │  Libs                               │
├─────────┼─────────┼─────────┐                           │
│ Guest OS│ Guest OS│ Guest OS│  ← Mỗi VM có OS riêng     │
├─────────┴─────────┴─────────┤                           │
│      Hypervisor (VMware)     │                           │
├──────────────────────────────┤                           │
│         Host OS              │                           │
├──────────────────────────────┤                           │
│      Physical Hardware       │                           │
└──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     DOCKER                               │
├─────────────────────────────────────────────────────────┤
│  App A  │  App B  │  App C                              │
│  Libs   │  Libs   │  Libs                               │
├─────────┼─────────┼─────────┤                           │
│ Container│Container│Container│  ← Chia sẻ OS kernel     │
├─────────┴─────────┴─────────┤                           │
│      Docker Engine           │                           │
├──────────────────────────────┤                           │
│         Host OS              │                           │
├──────────────────────────────┤                           │
│      Physical Hardware       │                           │
└──────────────────────────────┘
```

### Bảng so sánh:

| Tiêu chí | Virtual Machine | Docker Container |
|----------|----------------|------------------|
| **Kích thước** | Lớn (GB) | Nhỏ (MB) |
| **Khởi động** | Chậm (phút) | Nhanh (giây) |
| **Hiệu năng** | Overhead cao | Gần native |
| **Cô lập** | Hoàn toàn | Process-level |
| **Chia sẻ OS** | Không | Có |
| **Use case** | Chạy nhiều OS khác nhau | Chạy nhiều app trên cùng OS |

### Ví dụ thực tế:

```
Virtual Machine:
- Máy Windows chạy Ubuntu VM → 2GB RAM, 20GB disk
- Khởi động: 2-3 phút
- Dùng cho: Test OS khác, môi trường hoàn toàn cô lập

Docker Container:
- Máy Windows chạy MySQL container → 200MB RAM, 500MB disk
- Khởi động: 2-3 giây
- Dùng cho: Microservices, CI/CD, development
```

---

## 4️⃣ DOCKER TRONG DỰ ÁN CỦA BẠN

### Kiến trúc hệ thống:

```
┌─────────────────────────────────────────────────────────┐
│                    HOST MACHINE                          │
│                  (Windows/Mac/Linux)                     │
├─────────────────────────────────────────────────────────┤
│                   Docker Engine                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Frontend    │  │ Spring Boot  │  │   FastAPI    │ │
│  │  Container   │  │  Container   │  │  Container   │ │
│  │              │  │              │  │              │ │
│  │ Node:20      │  │ OpenJDK:17   │  │ Python:3.11  │ │
│  │ Port: 5173   │  │ Port: 8080   │  │ Port: 8000   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │  MySQL Container│                    │
│                  │  Port: 3306     │                    │
│                  │  Volume: mysql  │                    │
│                  └─────────────────┘                    │
│                                                          │
│  Network: eduagent-network (bridge)                     │
└─────────────────────────────────────────────────────────┘
```

### Lợi ích cụ thể:

#### 1. **Tính nhất quán môi trường**
```
Developer (Windows):
docker-compose up → Chạy OK

Tester (Mac):
docker-compose up → Chạy OK

Server (Linux):
docker-compose up → Chạy OK

→ Môi trường giống hệt nhau!
```

#### 2. **Dễ dàng setup**
```
❌ Không có Docker:
1. Cài MySQL → 30 phút
2. Cài Java 17 → 15 phút
3. Cài Python 3.11 → 10 phút
4. Cài Node.js 20 → 10 phút
5. Config từng cái → 1 giờ
→ Tổng: 2+ giờ

✅ Với Docker:
docker-compose up
→ Tổng: 5 phút!
```

#### 3. **Cô lập dependencies**
```
Dự án A: MySQL 5.7, Java 11
Dự án B: MySQL 8.0, Java 17

Không Docker:
→ Conflict! Chỉ cài được 1 version

Với Docker:
→ Mỗi dự án 1 container riêng!
```

#### 4. **Scale dễ dàng**
```bash
# Chạy 3 instances của Spring Boot
docker-compose up --scale spring-boot=3

# Load balancer tự động phân phối request
```

#### 5. **Rollback nhanh**
```bash
# Version 1.0 có bug
docker-compose down

# Rollback về version 0.9
docker-compose up -d my-app:0.9
```

---

## 5️⃣ CÂU HỎI THƯỜNG GẶP

### Q1: Docker khác gì Virtual Machine?

**Trả lời:**
```
Virtual Machine:
- Mỗi VM có OS riêng → Nặng, chậm
- Cô lập hoàn toàn
- Dùng cho: Chạy nhiều OS khác nhau

Docker Container:
- Chia sẻ OS kernel → Nhẹ, nhanh
- Cô lập process-level
- Dùng cho: Microservices, CI/CD
```

### Q2: Tại sao dùng Docker cho dự án này?

**Trả lời:**
```
1. Tính nhất quán: Dev = Test = Production
2. Dễ setup: 1 lệnh khởi động toàn bộ hệ thống
3. Cô lập: Mỗi service 1 container riêng
4. Phù hợp Microservices: Mỗi service scale độc lập
5. CI/CD: Dễ dàng deploy và rollback
```

### Q3: Container có mất dữ liệu không?

**Trả lời:**
```
Không, nhờ Docker Volume:
- Data lưu trong Volume (bên ngoài container)
- Container bị xóa → Data vẫn còn
- Có thể backup/restore Volume dễ dàng
```

### Q4: Các container giao tiếp với nhau như thế nào?

**Trả lời:**
```
Qua Docker Network:
- Tất cả containers trong cùng network
- Gọi nhau bằng hostname (tên service)
- Ví dụ: spring-boot gọi mysql://mysql:3306
```

### Q5: Docker Compose khác gì Docker?

**Trả lời:**
```
Docker:
- Chạy 1 container
- Lệnh: docker run ...

Docker Compose:
- Chạy nhiều containers
- Định nghĩa trong file YAML
- Lệnh: docker-compose up
```

### Q6: Làm sao biết container đang chạy tốt?

**Trả lời:**
```bash
# Xem trạng thái
docker-compose ps

# Xem logs
docker-compose logs -f

# Health check
docker inspect --format='{{.State.Health.Status}}' mysql
```

### Q7: Production có dùng Docker Compose không?

**Trả lời:**
```
Không, production thường dùng:
- Docker Swarm (orchestration)
- Kubernetes (phổ biến nhất)
- AWS ECS, Google Cloud Run

Docker Compose chủ yếu cho:
- Development
- Testing
- Small deployments
```

---

## 🎯 ĐIỂM MẠNH CẦN NHẤN MẠNH TRONG THUYẾT TRÌNH

### 1. **One-Command Deployment**
```bash
docker-compose up
→ Khởi động toàn bộ hệ thống chỉ với 1 lệnh!
```

### 2. **Environment Consistency**
```
Dev = Test = Production
→ Không còn "It works on my machine"!
```

### 3. **Microservices Ready**
```
4 containers độc lập:
- MySQL: Database
- Spring Boot: Business Logic
- FastAPI: AI Services
- Frontend: User Interface
```

### 4. **Easy Scaling**
```bash
docker-compose up --scale spring-boot=3
→ Scale service dễ dàng!
```

### 5. **Isolation & Security**
```
Mỗi service trong container riêng
→ Lỗi 1 service không ảnh hưởng các service khác
```

---

## 📊 DEMO SCRIPT CHO THUYẾT TRÌNH

### Bước 1: Show docker-compose.yml (30 giây)
```
"Đây là file docker-compose.yml định nghĩa 4 services:
- MySQL: Database
- Spring Boot: Backend Java
- FastAPI: Backend Python
- Frontend: React UI"
```

### Bước 2: Khởi động hệ thống (1 phút)
```bash
docker-compose up -d

"Chỉ với 1 lệnh, Docker sẽ:
1. Build 3 images (Spring, FastAPI, Frontend)
2. Pull MySQL image từ Docker Hub
3. Tạo network để các containers giao tiếp
4. Khởi động 4 containers
5. Setup volumes cho MySQL"
```

### Bước 3: Kiểm tra trạng thái (30 giây)
```bash
docker-compose ps

"Tất cả 4 containers đang chạy healthy!"
```

### Bước 4: Xem logs (30 giây)
```bash
docker-compose logs spring-boot

"Có thể xem logs real-time của từng service"
```

### Bước 5: Truy cập ứng dụng (30 giây)
```
"Mở browser:
- Frontend: localhost:5173
- Swagger: localhost:8080/swagger-ui.html
- FastAPI Docs: localhost:8000/docs"
```

---

## ✅ CHECKLIST TRƯỚC KHI THUYẾT TRÌNH

- [ ] Hiểu rõ Docker Image vs Container
- [ ] Hiểu Docker Compose orchestration
- [ ] Biết giải thích Docker vs VM
- [ ] Thuộc các lệnh cơ bản
- [ ] Test docker-compose up trước
- [ ] Chuẩn bị trả lời câu hỏi
- [ ] Backup nếu Docker lỗi (video demo)

---

**Chúc bạn thuyết trình thành công! 🚀**
