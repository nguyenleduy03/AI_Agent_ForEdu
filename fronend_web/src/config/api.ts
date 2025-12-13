export const API_CONFIG = {
  SPRING_BOOT_URL: 'http://localhost:8080',
  FASTAPI_URL: 'http://localhost:8000',
  TIMEOUT: 30000,
};

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    UPDATE_PROFILE: '/api/auth/update-profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  // Courses
  COURSES: {
    LIST: '/api/courses',
    DETAIL: (id: number) => `/api/courses/${id}`,
    CREATE: '/api/courses',
    UPDATE: (id: number) => `/api/courses/${id}`,
    DELETE: (id: number) => `/api/courses/${id}`,
  },
  // Lessons
  LESSONS: {
    BY_COURSE: (courseId: number) => `/api/courses/${courseId}/lessons`,
    DETAIL: (id: number) => `/api/lessons/${id}`,
    CREATE: (courseId: number) => `/api/courses/${courseId}/lessons`,
    UPDATE: (id: number) => `/api/lessons/${id}`,
    DELETE: (id: number) => `/api/lessons/${id}`,
  },
  // Materials
  MATERIALS: {
    UPLOAD: '/api/materials/upload',
    BY_COURSE: (courseId: number) => `/api/courses/${courseId}/materials`,
    DELETE: (id: number) => `/api/materials/${id}`,
  },
  // Chat
  CHAT: {
    SESSIONS: '/api/chat/sessions',
    CREATE_SESSION: '/api/chat/sessions',
    MESSAGES: (sessionId: number) => `/api/chat/sessions/${sessionId}/messages`,
    DELETE_SESSION: (sessionId: number) => `/api/chat/sessions/${sessionId}`,
    AI_CHAT: '/api/chat',
  },
  // Quiz
  QUIZ: {
    GENERATE: '/api/quiz/generate',
    DETAIL: (id: number) => `/api/quiz/${id}`,
    SUBMIT: (id: number) => `/api/quiz/${id}/submit`,
  },
  // AI Services (FastAPI)
  AI: {
    CHAT: '/api/chat',
    MODELS: '/api/models',
    GENERATE_QUIZ: '/api/ai/generate-quiz',
    SUMMARIZE: '/api/ai/summarize',
    EXPLAIN: '/api/ai/explain',
  },
};
