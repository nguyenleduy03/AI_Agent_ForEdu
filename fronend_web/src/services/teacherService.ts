import { springApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { CourseStudentManagement } from '../types';

// Types for analytics
export interface StudentQuizResult {
  resultId: number;
  quizId: number;
  quizTitle: string;
  lessonId: number;
  lessonTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  attemptNumber: number;
}

export interface LessonProgressDetail {
  id?: number;
  lessonId: number;
  lessonTitle: string;
  userId: number;
  courseId: number;
  isCompleted: boolean;
  completedAt?: string;
  timeSpent: number;
  progressPercentage: number;
  lastAccessedAt?: string;
}

export interface StudentDetail {
  userId: number;
  username: string;
  fullName?: string;
  email: string;
  avatarUrl?: string;
  enrolledAt: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeSpent: number;
  lastAccessedAt?: string;
  totalQuizzesTaken: number;
  totalQuizzesPassed: number;
  averageQuizScore: number;
  highestQuizScore: number;
  lowestQuizScore: number;
  quizHistory: StudentQuizResult[];
  lessonProgress: LessonProgressDetail[];
}

export interface LessonAnalytics {
  lessonId: number;
  lessonTitle: string;
  orderIndex: number;
  studentsCompleted: number;
  studentsInProgress: number;
  completionRate: number;
  totalTimeSpent: number;
  averageTimeSpent: number;
}

export interface QuizAnalytics {
  quizId: number;
  quizTitle: string;
  lessonId: number;
  lessonTitle: string;
  totalAttempts: number;
  uniqueStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
}

export interface StudentRanking {
  userId: number;
  username: string;
  fullName?: string;
  progressPercentage: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  rank: number;
}

export interface CourseAnalytics {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  createdAt: string;
  totalStudents: number;
  totalLessons: number;
  totalQuizzes: number;
  totalMaterials: number;
  averageProgress: number;
  studentsCompleted: number;
  studentsInProgress: number;
  studentsNotStarted: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
  passRate: number;
  totalStudyTime: number;
  averageStudyTime: number;
  lessonAnalytics: LessonAnalytics[];
  quizAnalytics: QuizAnalytics[];
  topStudents: StudentRanking[];
}

export const teacherService = {
  // Get students in course
  getCourseStudents: async (courseId: number): Promise<CourseStudentManagement> => {
    const response = await springApi.get(ENDPOINTS.TEACHER.COURSE_STUDENTS(courseId));
    return response.data;
  },

  // Remove student from course
  removeStudent: async (courseId: number, studentId: number): Promise<void> => {
    await springApi.delete(ENDPOINTS.TEACHER.REMOVE_STUDENT(courseId, studentId));
  },

  // Get all my courses as teacher with student list
  getMyCoursesAsTeacher: async (): Promise<CourseStudentManagement[]> => {
    const response = await springApi.get(ENDPOINTS.TEACHER.MY_COURSES);
    return response.data;
  },

  // Get student detail with quiz history
  getStudentDetail: async (courseId: number, studentId: number): Promise<StudentDetail> => {
    const response = await springApi.get(`/api/teacher/courses/${courseId}/students/${studentId}/detail`);
    return response.data;
  },

  // Get course analytics
  getCourseAnalytics: async (courseId: number): Promise<CourseAnalytics> => {
    const response = await springApi.get(`/api/teacher/courses/${courseId}/analytics`);
    return response.data;
  },
};
