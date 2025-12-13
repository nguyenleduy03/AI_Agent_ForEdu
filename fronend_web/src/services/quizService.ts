import { springApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { Quiz, QuizQuestion, QuizResult } from '../types';

export const quizService = {
  generateQuiz: async (lessonId: number, difficulty: string, numQuestions: number): Promise<Quiz> => {
    const response = await springApi.post(ENDPOINTS.QUIZ.GENERATE, {
      lesson_id: lessonId,
      difficulty,
      num_questions: numQuestions,
    });
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
};
