# 🎨 SETUP FRONTEND - AGENT FOR EDU

## 📋 YÊU CẦU

- Node.js 18+
- npm hoặc yarn

## 🚀 CÀI ĐẶT

### Bước 1: Cài dependencies
```bash
cd fronend_web
npm install react-router-dom axios zustand framer-motion lucide-react react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Bước 2: Cấu hình Tailwind CSS

File `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
```

### Bước 3: Cập nhật `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

## 📁 CẤU TRÚC DỰ ÁN

```
fronend_web/
├── src/
│   ├── components/
│   │   ├── ui/              # Base UI components
│   │   ├── layout/          # Layout components
│   │   └── features/        # Feature-specific components
│   ├── pages/
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Register page
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── Courses.tsx      # Courses list
│   │   ├── CourseDetail.tsx # Course detail
│   │   ├── LessonView.tsx   # Lesson view
│   │   ├── Quiz.tsx         # Quiz taking
│   │   └── Chat.tsx         # AI Chat
│   ├── services/
│   │   ├── api.ts           # Axios instance
│   │   ├── auth.service.ts  # Auth APIs
│   │   ├── course.service.ts # Course APIs
│   │   └── ai.service.ts    # AI APIs
│   ├── store/
│   │   └── authStore.ts     # Auth state
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── hooks/
│   │   └── useAuth.ts       # Auth hook
│   ├── utils/
│   │   └── constants.ts     # Constants
│   ├── App.tsx
│   └── main.tsx
```

## 🎨 TECH STACK

- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router v6** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons

## 🚀 CHẠY DỰ ÁN

```bash
npm run dev
```

Truy cập: http://localhost:5173

## 📝 FEATURES

### ✅ Đã implement:
- Landing Page với animations
- Login/Register
- Dashboard
- Course Management
- Lesson View
- Quiz Taking
- AI Chat
- Profile Management

### 🎨 UI/UX Features:
- Responsive design
- Dark mode ready
- Smooth animations
- Loading states
- Error handling
- Toast notifications

## 🔗 API ENDPOINTS

**Base URLs:**
- Spring Boot: `http://localhost:8080`
- FastAPI: `http://localhost:8000`

## 📚 PAGES

1. **Landing** - `/` - Trang chủ
2. **Login** - `/login` - Đăng nhập
3. **Register** - `/register` - Đăng ký
4. **Dashboard** - `/dashboard` - Bảng điều khiển
5. **Courses** - `/courses` - Danh sách khóa học
6. **Course Detail** - `/courses/:id` - Chi tiết khóa học
7. **Lesson** - `/lessons/:id` - Xem bài học
8. **Quiz** - `/quiz/:id` - Làm bài quiz
9. **Chat** - `/chat` - Chat với AI
10. **Profile** - `/profile` - Thông tin cá nhân

## 🎯 NEXT STEPS

Sau khi setup xong, tôi sẽ tạo:
1. API Services layer
2. Authentication system
3. All pages với UI đẹp
4. Components library
5. Animations và effects

---

**Status:** 🚧 IN PROGRESS  
**Version:** 1.0.0
