import { springApi } from './api';
import { ENDPOINTS } from '../config/api';

export interface DashboardStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  totalConversations: number;
  totalFlashcardDecks: number;
  totalFlashcards: number;
  dueFlashcards: number;
  averageProgress: number;
  totalStudyTime: number; // in minutes
  learningStreak: number; // days
}

export interface CourseProgressSummary {
  courseId: number;
  courseTitle: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeSpent: number;
  lastAccessedAt: string | null;
}

export interface RecentActivity {
  type: 'course' | 'chat' | 'flashcard' | 'quiz';
  title: string;
  description: string;
  timestamp: string;
}

export const dashboardService = {
  // Get all course progress for current user
  getMyProgress: async (): Promise<CourseProgressSummary[]> => {
    try {
      const response = await springApi.get(ENDPOINTS.PROGRESS.MY_COURSES);
      return response.data.map((p: any) => ({
        courseId: p.courseId,
        courseTitle: p.courseTitle,
        progressPercentage: parseFloat(p.progressPercentage) || 0,
        completedLessons: p.completedLessons || 0,
        totalLessons: p.totalLessons || 0,
        totalTimeSpent: p.totalTimeSpent || 0,
        lastAccessedAt: p.lastAccessedAt,
      }));
    } catch (error) {
      console.error('Error fetching progress:', error);
      return [];
    }
  },

  // Get flashcard stats
  getFlashcardStats: async (): Promise<{
    totalDecks: number;
    totalCards: number;
    dueCards: number;
    newCards: number;
  }> => {
    try {
      const response = await springApi.get('/api/flashcards/stats/overview');
      return {
        totalDecks: response.data.totalDecks || 0,
        totalCards: response.data.totalCards || 0,
        dueCards: response.data.dueCards || 0,
        newCards: response.data.newCards || 0,
      };
    } catch (error) {
      console.error('Error fetching flashcard stats:', error);
      return { totalDecks: 0, totalCards: 0, dueCards: 0, newCards: 0 };
    }
  },

  // Calculate dashboard stats from various sources
  calculateStats: (
    courses: any[],
    sessions: any[],
    progress: CourseProgressSummary[],
    flashcardStats: { totalDecks: number; totalCards: number; dueCards: number }
  ): DashboardStats => {
    // Calculate average progress
    const avgProgress = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.progressPercentage, 0) / progress.length
      : 0;

    // Calculate total study time (in minutes)
    const totalStudyTime = progress.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0) / 60;

    // Count completed courses (100% progress)
    const completedCourses = progress.filter(p => p.progressPercentage >= 100).length;

    return {
      totalCourses: courses.length,
      enrolledCourses: progress.length,
      completedCourses,
      totalConversations: sessions.length,
      totalFlashcardDecks: flashcardStats.totalDecks,
      totalFlashcards: flashcardStats.totalCards,
      dueFlashcards: flashcardStats.dueCards,
      averageProgress: Math.round(avgProgress),
      totalStudyTime: Math.round(totalStudyTime),
      learningStreak: 0, // TODO: Implement streak tracking in backend
    };
  },

  // Get recent activities (from progress data)
  getRecentActivities: (progress: CourseProgressSummary[], sessions: any[]): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Add recent course activities
    progress
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime())
      .slice(0, 3)
      .forEach(p => {
        activities.push({
          type: 'course',
          title: p.courseTitle,
          description: `Tiến độ: ${p.progressPercentage}% (${p.completedLessons}/${p.totalLessons} bài)`,
          timestamp: p.lastAccessedAt!,
        });
      });

    // Add recent chat sessions
    sessions
      .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 2)
      .forEach((s: any) => {
        activities.push({
          type: 'chat',
          title: s.title || 'AI Chat Session',
          description: 'Cuộc trò chuyện với AI',
          timestamp: s.updatedAt || s.createdAt,
        });
      });

    // Sort all activities by timestamp
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  },

  // Format time ago
  formatTimeAgo: (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  },
};
