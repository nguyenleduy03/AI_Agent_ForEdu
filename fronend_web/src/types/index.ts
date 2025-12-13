export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  createdBy: number;
  creatorName?: string;
  isPublic: boolean;
  isEnrolled?: boolean;
  enrollmentCount?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: number;
  courseId: number;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface ChatSession {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  sender: 'USER' | 'AI';
  message: string;
  timestamp: string;
}

export interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  difficulty: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

export interface QuizResult {
  id: number;
  quizId: number;
  userId: number;
  score: number;
  totalQuestions: number;
  completedAt: string;
}
