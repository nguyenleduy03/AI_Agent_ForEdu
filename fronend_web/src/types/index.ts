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
  isCreator?: boolean;
  totalLessons?: number;
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
  lessonId?: number;
  lessonTitle?: string;
  title: string;
  description?: string;
  fileUrl: string;
  type: MaterialType;
  // Google Drive fields
  driveFileId?: string;
  driveEmbedLink?: string;
  driveDownloadLink?: string;
  // File info
  fileSize?: number;
  fileSizeFormatted?: string;
  originalFilename?: string;
  // Uploader info
  uploadedBy: number;
  uploaderName?: string;
  uploadedAt: string;
}

export type MaterialType =
  | 'PDF'
  | 'DOC'
  | 'DOCX'
  | 'PPT'
  | 'PPTX'
  | 'TXT'
  | 'HTML'
  | 'IMAGE'
  | 'VIDEO'
  | 'MP4'
  | 'AVI'
  | 'MOV'
  | 'OTHER';

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

// Progress Types
export interface LessonProgress {
  id: number;
  userId: number;
  lessonId: number;
  courseId: number;
  lessonTitle?: string;
  isCompleted: boolean;
  completedAt?: string;
  timeSpent: number; // seconds
  progressPercentage: number; // 0-100
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  id: number;
  userId: number;
  courseId: number;
  courseTitle?: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  totalTimeSpent: number; // seconds
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
  lessonProgressList?: LessonProgress[];
}

// Student Management Types
export interface EnrolledStudent {
  userId: number;
  username: string;
  fullName?: string;
  email: string;
  avatarUrl?: string;
  enrolledAt: string;
  progressPercentage?: number;
  completedLessons?: number;
  totalLessons?: number;
  totalTimeSpent?: number;
  lastAccessedAt?: string;
}

export interface CourseStudentManagement {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  createdBy: number;
  creatorName?: string;
  totalStudents: number;
  totalLessons: number;
  students: EnrolledStudent[];
}
