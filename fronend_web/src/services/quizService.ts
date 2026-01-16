import { springApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { Quiz, QuizQuestion, QuizResult } from '../types';

export interface CreateQuizRequest {
  lessonId: number;
  title: string;
  description?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  deadline?: string; // ISO datetime string - hạn làm bài
  timeLimitMinutes?: number; // Thời gian làm bài (phút)
  maxAttempts?: number; // Số lần làm bài tối đa
  shuffleQuestions?: boolean; // Xáo trộn câu hỏi
  shuffleOptions?: boolean; // Xáo trộn đáp án
  questions: {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  }[];
}

export interface QuizListItem {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
  difficulty: string;
  totalQuestions: number;
  createdBy: number; // ID người tạo quiz
  creatorName: string;
  createdAt: string;
  deadline?: string; // Hạn làm bài
  timeLimitMinutes?: number; // Thời gian làm bài (phút)
  maxAttempts?: number; // Số lần làm bài tối đa
  isExpired?: boolean; // Quiz đã hết hạn chưa
  isPublic: boolean;
  isCompleted?: boolean;
  lastScore?: number;
  attemptCount?: number; // Số lần đã làm
  canAttempt?: boolean; // Còn được làm không
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  deadline?: string | null; // ISO datetime string - null để xóa deadline
  timeLimitMinutes?: number | null;
  maxAttempts?: number | null;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  isPublic?: boolean;
}

export const quizService = {
  generateQuiz: async (lessonId: number, difficulty: string, numQuestions: number): Promise<Quiz> => {
    const response = await springApi.post(ENDPOINTS.QUIZ.GENERATE, {
      lessonId,
      difficulty: difficulty.toUpperCase(),
      numQuestions,
    });
    return response.data;
  },

  createQuiz: async (data: CreateQuizRequest): Promise<Quiz> => {
    const response = await springApi.post(ENDPOINTS.QUIZ.CREATE, data);
    return response.data;
  },

  getQuizzesByLesson: async (lessonId: number): Promise<QuizListItem[]> => {
    const response = await springApi.get(ENDPOINTS.QUIZ.BY_LESSON(lessonId));
    return response.data;
  },

  getQuiz: async (id: number): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> => {
    const response = await springApi.get(ENDPOINTS.QUIZ.DETAIL(id));
    return response.data;
  },

  submitQuiz: async (id: number, answers: Record<number, string>): Promise<QuizResult> => {
    const response = await springApi.post(ENDPOINTS.QUIZ.SUBMIT(id), { answers });
    return response.data;
  },

  updateQuiz: async (id: number, data: UpdateQuizRequest): Promise<Quiz> => {
    const response = await springApi.put(`/api/quiz/${id}`, data);
    return response.data;
  },

  deleteQuiz: async (id: number): Promise<void> => {
    await springApi.delete(`/api/quiz/${id}`);
  },
};
