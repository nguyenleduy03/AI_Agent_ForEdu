import { springApi } from './api';

export interface Reminder {
  id: string;
  type: 'QUIZ_DEADLINE' | 'FLASHCARD_DUE' | 'LESSON_INCOMPLETE' | 'COURSE_PROGRESS' | 'SCHEDULE_TODAY' | 'QUIZ_NO_ATTEMPT' | 'LOW_SCORE_ALERT';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  icon: string;
  actionUrl?: string;
  deadline?: string;
  metadata?: Record<string, any>;
}

export interface AssistantRemindersResponse {
  reminders: Reminder[];
  totalCount: number;
  urgentCount: number;
}

export const assistantService = {
  getReminders: async (): Promise<AssistantRemindersResponse> => {
    const response = await springApi.get('/api/assistant/reminders');
    return response.data;
  },
};
