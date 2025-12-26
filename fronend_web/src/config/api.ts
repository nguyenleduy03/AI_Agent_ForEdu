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
    MY_COURSES: '/api/courses/my-courses',
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
    BY_LESSON: (lessonId: number) => `/api/lessons/${lessonId}/materials`,
    GENERAL: (courseId: number) => `/api/courses/${courseId}/materials/general`,
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
    CREATE: '/api/quiz/create',
    BY_LESSON: (lessonId: number) => `/api/quiz/lesson/${lessonId}`,
    DETAIL: (id: number) => `/api/quiz/${id}`,
    SUBMIT: (id: number) => `/api/quiz/${id}/submit`,
  },
  // AI Services (FastAPI)
  AI: {
    CHAT: '/api/chat',
    MODELS: '/api/models',
    GROQ_MODELS: '/api/models/groq',
    GENERATE_QUIZ: '/api/ai/generate-quiz',
    SUMMARIZE: '/api/ai/summarize',
    EXPLAIN: '/api/ai/explain',
  },
  // Progress
  PROGRESS: {
    UPDATE_LESSON: '/api/progress/lesson',
    GET_LESSON: (lessonId: number) => `/api/progress/lesson/${lessonId}`,
    GET_COURSE: (courseId: number) => `/api/progress/course/${courseId}`,
    MY_COURSES: '/api/progress/my-courses',
  },
  // Teacher Management
  TEACHER: {
    COURSE_STUDENTS: (courseId: number) => `/api/teacher/courses/${courseId}/students`,
    REMOVE_STUDENT: (courseId: number, studentId: number) => `/api/teacher/courses/${courseId}/students/${studentId}`,
    MY_COURSES: '/api/teacher/my-courses',
  },
};
