import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CreateCoursePage from './pages/CreateCoursePage';
import CreateLessonPage from './pages/CreateLessonPage';
import LessonPage from './pages/LessonPage';
import ChatPage from './pages/ChatPage';
import QuizPage from './pages/QuizPage';
import CreateQuizPage from './pages/CreateQuizPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SchedulePage from './pages/SchedulePage';
import FlashcardsPage from './pages/FlashcardsPage';
import DeckDetailPage from './pages/DeckDetailPage';
import FlashcardStudyPage from './pages/FlashcardStudyPage';
import GoogleCalendarPage from './pages/GoogleCalendarPage';
import DocumentIntelligencePage from './pages/DocumentIntelligencePage';
import CourseStudentsPage from './pages/CourseStudentsPage';
import MyProgressPage from './pages/MyProgressPage';
import MyCoursesPage from './pages/MyCoursesPage';
import TeacherCourseDashboard from './pages/TeacherCourseDashboard';
import StudentDetailPage from './pages/StudentDetailPage';
import TeacherDashboard from './pages/TeacherDashboard';
import EditLessonPage from './pages/EditLessonPage';
import EditCoursePage from './pages/EditCoursePage';
import EmailDraftPage from './pages/EmailDraftPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
          <Route path="/courses/create" element={<ProtectedRoute><CreateCoursePage /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/edit" element={<ProtectedRoute><EditCoursePage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/lessons/create" element={<ProtectedRoute><CreateLessonPage /></ProtectedRoute>} />
          <Route path="/lessons/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
          <Route path="/lessons/:lessonId/edit" element={<ProtectedRoute><EditLessonPage /></ProtectedRoute>} />
          <Route path="/lessons/:lessonId/quiz/create" element={<ProtectedRoute><CreateQuizPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/email-draft" element={<ProtectedRoute><EmailDraftPage /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><GoogleCalendarPage /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
          <Route path="/flashcards/deck/:deckId" element={<ProtectedRoute><DeckDetailPage /></ProtectedRoute>} />
          <Route path="/flashcards/study/:deckId" element={<ProtectedRoute><FlashcardStudyPage /></ProtectedRoute>} />
          <Route path="/document-intelligence" element={<ProtectedRoute><DocumentIntelligencePage /></ProtectedRoute>} />
          <Route path="/courses/:courseId/students" element={<ProtectedRoute><CourseStudentsPage /></ProtectedRoute>} />
          <Route path="/my-progress" element={<ProtectedRoute><MyProgressPage /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/courses/:courseId" element={<ProtectedRoute><TeacherCourseDashboard /></ProtectedRoute>} />
          <Route path="/teacher/courses/:courseId/students/:studentId" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
