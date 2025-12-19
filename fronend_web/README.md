# EduAgent Frontend

Modern, beautiful React + TypeScript frontend for the AI-powered learning platform.

## 🚀 Tech Stack

- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Router v7** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   └── Layout.tsx      # Main layout with sidebar
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── CoursesPage.tsx
│   ├── CourseDetailPage.tsx
│   ├── LessonPage.tsx
│   ├── ChatPage.tsx
│   ├── QuizPage.tsx
│   └── ProfilePage.tsx
├── services/           # API services
│   ├── api.ts
│   ├── authService.ts
│   ├── courseService.ts
│   ├── chatService.ts
│   └── quizService.ts
├── store/              # Zustand stores
│   ├── authStore.ts
│   └── chatStore.ts
├── types/              # TypeScript types
│   └── index.ts
├── config/             # Configuration
│   └── api.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## 🎨 Features

### Landing Page
- Modern hero section with gradient effects
- Feature showcase
- Call-to-action sections
- Responsive design

### Authentication
- Login/Register pages
- JWT token management
- Protected routes
- Auto-redirect on auth

### Dashboard
- Welcome section
- Statistics cards with animations
- Recent courses
- Quick actions
- Learning progress

### Courses
- Course listing with search
- Course details with lessons
- Material downloads
- Responsive grid layout

### Lessons
- Lesson content display
- AI quiz generation
- Navigation between lessons

### AI Chat
- Real-time chat interface
- RAG context toggle
- Message history
- Typing indicators
- Smooth animations

### Quiz
- Multiple choice questions
- Progress tracking
- Score calculation
- Results display with animations

### Profile
- User information
- Edit profile
- Statistics
- Role display

## 🎯 Design Features

- **Modern UI**: Clean, professional design with gradients
- **Animations**: Smooth transitions with Framer Motion
- **Responsive**: Mobile-first design
- **Dark Mode Ready**: Easy to implement
- **Accessibility**: Semantic HTML and ARIA labels
- **Performance**: Optimized with React Query caching

## 🔧 Configuration

### API Endpoints
Edit `src/config/api.ts` to change backend URLs:

```typescript
export const API_CONFIG = {
  SPRING_BOOT_URL: 'http://localhost:8080',
  FASTAPI_URL: 'http://localhost:8001',
  TIMEOUT: 30000,
};
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend services running (Spring Boot + FastAPI)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:

```javascript
colors: {
  primary: {
    // Your custom colors
  },
}
```

### Animations
Edit `tailwind.config.js` to add custom animations:

```javascript
animation: {
  'your-animation': 'yourAnimation 1s ease-in-out',
}
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication Flow

1. User logs in/registers
2. JWT token stored in localStorage
3. Token added to all API requests
4. Auto-redirect on 401 errors
5. Logout clears token and redirects

## 🌐 API Integration

All API calls go through service files:
- `authService.ts` - Authentication
- `courseService.ts` - Courses, lessons, materials
- `chatService.ts` - Chat and AI
- `quizService.ts` - Quiz generation and submission

## 🎯 State Management

- **Zustand** for global state (auth, chat)
- **React Query** for server state (courses, lessons)
- **Local state** for component-specific state

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚀 Performance Tips

- Images lazy loaded
- Code splitting with React Router
- React Query caching
- Optimized bundle size
- Tree shaking enabled

## 🐛 Troubleshooting

### CORS Issues
Make sure backend allows CORS from `http://localhost:5173`

### API Connection Failed
Check that backend services are running:
- Spring Boot: http://localhost:8080
- FastAPI: http://localhost:8001

### Build Errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

MIT License - feel free to use for your projects!
