# 🎓 Agent For Edu - AI-Powered Learning Platform

A comprehensive full-stack AI learning platform combining Spring Boot backend, FastAPI AI service, and modern React frontend with RAG (Retrieval-Augmented Generation) using ChromaDB.

## 🌟 Tech Stack

### Backend
- **Spring Boot** - Java REST API with Spring Security, JPA, MySQL
- **FastAPI** - Python AI service with Google Gemini, ChromaDB for RAG
- **MySQL** - Relational database for users, courses, lessons, quizzes
- **ChromaDB** - Vector database for semantic search and RAG
- **Google Gemini API** - Generative AI for chat, quiz generation, content analysis

### Frontend
- **React 19** - Latest React with TypeScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - HTTP client

## 📋 Project Structure

```
DACN/
├── README.md                           # This file
│
├── backend/
│   ├── SpringService/agentforedu/      # Spring Boot REST API (Port 8080)
│   │   ├── DATABASE_DESIGN.md          # Database schema documentation
│   │   ├── API_DOCUMENTATION.md        # Complete API reference
│   │   ├── ENTITIES_SUMMARY.md         # JPA entities overview
│   │   └── [Spring Boot Project Files]
│   │
│   └── PythonService/                  # FastAPI AI Service (Port 8000, 8001)
│       ├── main.py                     # Standard API (Port 8000)
│       ├── main_with_rag.py            # RAG API (Port 8001)
│       ├── ai_service.py               # Gemini AI integration
│       ├── chroma_vector_service.py    # ChromaDB service
│       ├── requirements.txt            # Python dependencies
│       └── [Python Service Files]
│
├── fronend_web/                        # React Frontend (Port 5173)
│   ├── src/
│   │   ├── components/                 # Reusable components
│   │   ├── pages/                      # Page components
│   │   ├── services/                   # API services
│   │   ├── store/                      # Zustand stores
│   │   ├── types/                      # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── [Setup & Configuration Files]
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Java 11+ with Maven
- Python 3.11 (for ChromaDB)
- MySQL 8.0+
- Google Gemini API Key

### 1. Setup Backend (Spring Boot)

```bash
cd backend/SpringService/agentforedu

# Build
mvn clean install

# Run
mvn spring-boot:run
```

Server runs on: http://localhost:8080

### 2. Setup FastAPI Service

```bash
cd backend/PythonService

# Install Python 3.11 (if not installed)
powershell -ExecutionPolicy Bypass -File setup-python311-auto.ps1

# Install Visual C++ Redistributable (for ChromaDB)
powershell -ExecutionPolicy Bypass -File install-vc-redist.ps1

# Install ChromaDB and dependencies
.\install-chromadb.cmd

# Create .env file
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run with RAG (Port 8001)
py -3.11 main_with_rag.py

# Or run standard API (Port 8000)
python main.py
```

FastAPI runs on: http://localhost:8000 or http://localhost:8001 (RAG)

### 3. Setup Frontend

```bash
cd fronend_web

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on: http://localhost:5173

## 🔐 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: `EduAgent OAuth`
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URIs:
   ```
   http://localhost:3000/api/auth/callback
   http://localhost:5173/api/auth/callback
   http://localhost:8003/api/oauth/google/callback
   http://localhost:8080/api/oauth/google/callback
   ```
6. Copy Client ID and Client Secret

### Gmail SMTP Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select Mail + Windows Computer
5. Generate and copy the 16-character password
6. Update `application.yaml`:
   ```yaml
   spring:
     mail:
       host: smtp.gmail.com
       port: 587
       username: your-email@gmail.com
       password: YOUR_APP_PASSWORD
   ```

### Environment Variables

**Frontend (fronend_web/.env):**
```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_API_URL=http://localhost:8080
VITE_FASTAPI_URL=http://localhost:8001
```

**Python Service (backend/PythonService/.env):**
```env
GEMINI_API_KEY=your_actual_api_key_here
GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8003/api/oauth/google/callback
```

**Spring Boot (backend/SpringService/agentforedu/src/main/resources/application.yaml):**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/Agent_Db
    username: root
    password: your_mysql_password
  jpa:
    hibernate:
      ddl-auto: update
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: YOUR_APP_PASSWORD
```

## 📚 API Documentation

### Spring Boot REST API
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **ReDoc**: http://localhost:8080/v3/api-docs

Key endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET/POST /api/courses` - Manage courses
- `GET/POST /api/quiz/generate` - Generate AI quiz
- `POST /api/chat/sessions` - Create chat session

### FastAPI Service
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Key endpoints:
- `POST /api/chat` - Chat with AI (with RAG option)
- `POST /api/rag/prompt` - Add knowledge to RAG
- `POST /api/documents/search` - Search RAG knowledge
- `POST /api/ai/generate-quiz` - Generate quiz from content
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/explain` - Explain concept as teacher

## 📊 Database Schema

The system uses MySQL with tables for:
- **Users** - Authentication, profiles, roles
- **Courses** - Learning content
- **Lessons** - Course materials
- **Materials** - Educational resources (PDF, DOC, etc.)
- **Quizzes** - Auto-generated assessments
- **Chat Sessions** - User conversations with AI
- **Course Enrollments** - Student registrations
- **User Schedules** - Timetable management
- **RAG Documents** - Knowledge base metadata

See [DATABASE_DESIGN.md](backend/SpringService/agentforedu/DATABASE_DESIGN.md) for complete schema.

## 🧪 Testing

### Test Password Reset

1. Run all services
2. Execute password reset:
   ```bash
   cd backend/PythonService
   python password_reset.py
   # Enter username: admin
   # Enter new password: your_new_password
   ```
3. Test login with new credentials

### Test Email Sending

Use the `/test-email` endpoint or verify in Mail controller.

### Test ChatBot

1. Go to http://localhost:5173
2. Login with your credentials
3. Navigate to Chat page
4. Send a message to test AI responses

## 🎯 Features

### ✅ Implemented
- User authentication with JWT
- Course creation and management
- Lesson content with materials
- AI-powered quiz generation
- Real-time chat with AI
- RAG-enhanced semantic search
- Student progress tracking
- User profiles and schedules
- Gmail SMTP integration
- Google OAuth support
- Admin dashboard
- System logging

### 🔄 In Progress
- Mobile app
- Advanced analytics
- Peer-to-peer collaboration
- Video lessons integration

## 🛠️ Development

### Common Commands

**Start all services (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File start-fullstack.ps1
```

**Kill all services:**
```cmd
kill-and-restart.cmd
```

**View Swagger API docs:**
- Spring Boot: http://localhost:8080/swagger-ui/index.html
- FastAPI: http://localhost:8000/docs

## 🔒 Security

- Passwords encrypted with BCrypt
- JWT token-based authentication (24-hour expiration)
- Role-based access control (ADMIN, TEACHER, STUDENT, USER)
- HTTPS ready for production
- SQL injection protection with PreparedStatements
- CSRF token for sensitive operations
- Encrypted school credentials storage (AES-256)
- CORS configured for development

## 📖 Additional Documentation

- [API Documentation](backend/SpringService/agentforedu/API_DOCUMENTATION.md)
- [Database Design](backend/SpringService/agentforedu/DATABASE_DESIGN.md)
- [Entities Summary](backend/SpringService/agentforedu/ENTITIES_SUMMARY.md)
- [Python Service README](backend/PythonService/README.md)
- [Frontend README](fronend_web/README_FRONTEND.md)

## 🐛 Troubleshooting

### MySQL Connection Error
```bash
# Start MySQL service (Windows)
net start MySQL80

# Or verify connection
mysql -u root -p -h localhost
```

### Python 3.11 Not Found
```powershell
# Install Python 3.11
powershell -ExecutionPolicy Bypass -File backend/PythonService/setup-python311-auto.ps1
```

### ChromaDB DLL Error
```powershell
# Install Visual C++ Runtime
powershell -ExecutionPolicy Bypass -File backend/PythonService/install-vc-redist.ps1
```

### CORS Issues
Make sure frontend and backend are on allowed origins:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- FastAPI: http://localhost:8000

### Port Already in Use
```powershell
# Kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or change port in application.yaml or main.py
```

## 📞 Support

For issues or questions:
1. Check documentation in respective service folders
2. Review Swagger/ReDoc API docs
3. Check application logs
4. Verify all services are running

## 📝 License

Proprietary - Agent For Edu

## 👥 Contributors

- Development Team
- AI Service Integration
- Frontend Design

---

**Version:** 1.0.0  
**Last Updated:** December 19, 2025  
**Status:** Production Ready

