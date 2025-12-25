import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BookOpen, MessageSquare, Trophy, TrendingUp, Clock, Award, 
  Target, Sparkles, Calendar, BarChart3, ArrowRight,
  CheckCircle, Zap, Brain, ChevronRight, CreditCard, AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { chatService } from '../services/chatService';
import { dashboardService, type CourseProgressSummary } from '../services/dashboardService';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  // Fetch real data
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatService.getSessions,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress'],
    queryFn: dashboardService.getMyProgress,
  });

  const { data: flashcardStats = { totalDecks: 0, totalCards: 0, dueCards: 0, newCards: 0 } } = useQuery({
    queryKey: ['flashcard-stats'],
    queryFn: dashboardService.getFlashcardStats,
  });

  // Calculate real stats
  const stats = dashboardService.calculateStats(courses, sessions, progress, flashcardStats);
  const recentActivities = dashboardService.getRecentActivities(progress, sessions);

  // Get courses with progress
  const coursesWithProgress = progress.slice(0, 3);

  const statCards = [
    {
      icon: BookOpen,
      label: 'Khóa học đã đăng ký',
      value: stats.enrolledCourses,
      subtext: `${stats.completedCourses} hoàn thành`,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
    },
    {
      icon: MessageSquare,
      label: 'Cuộc trò chuyện AI',
      value: stats.totalConversations,
      subtext: 'Tổng sessions',
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
    },
    {
      icon: CreditCard,
      label: 'Flashcards',
      value: stats.totalFlashcards,
      subtext: `${flashcardStats.dueCards} cần ôn tập`,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      icon: TrendingUp,
      label: 'Tiến độ trung bình',
      value: `${stats.averageProgress}%`,
      subtext: stats.totalStudyTime > 0 ? `${stats.totalStudyTime} phút học` : 'Bắt đầu học ngay!',
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
    },
  ];

  const activityIcons: Record<string, any> = {
    course: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    chat: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    flashcard: { icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    quiz: { icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10' },
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Xin chào, {user?.fullName}! 👋
              </h1>
              <p className="text-gray-600 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Tiếp tục hành trình học tập của bạn
              </p>
            </div>
            {stats.enrolledCourses > 0 && (
              <div className="mt-4 md:mt-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium">
                  <Zap className="w-4 h-4" />
                  {stats.enrolledCourses} khóa học
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.subtext}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Continue Learning Section */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Tiếp tục học</h2>
                  <p className="text-gray-600 text-sm">Tiến độ các khóa học của bạn</p>
                </div>
                <Link to="/courses" className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {coursesWithProgress.length > 0 ? (
                  coursesWithProgress.map((course: CourseProgressSummary, index: number) => (
                    <motion.div key={course.courseId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }}>
                      <Link to={`/courses/${course.courseId}`} className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {course.courseTitle.charAt(0)}
                          </div>
                          {course.progressPercentage >= 100 && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">{course.courseTitle}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {course.completedLessons}/{course.totalLessons} bài
                            </span>
                            <div className="flex-1 max-w-xs">
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${course.progressPercentage}%` }} />
                              </div>
                            </div>
                            <span className="text-blue-600 font-medium">{Math.round(course.progressPercentage)}%</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4 font-medium">Chưa có khóa học nào</p>
                    <p className="text-gray-500 text-sm mb-6">Bắt đầu hành trình học tập ngay!</p>
                    <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                      <BookOpen className="w-5 h-5" /> Khám phá khóa học
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Flashcard Alert */}
            {flashcardStats.dueCards > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-800">Có {flashcardStats.dueCards} flashcard cần ôn tập!</h3>
                    <p className="text-amber-700 text-sm">Ôn tập ngay để không quên kiến thức</p>
                  </div>
                  <Link to="/flashcards" className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors">
                    Ôn tập ngay
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg"><Zap className="w-5 h-5 text-blue-600" /></div>
                <h2 className="text-xl font-bold">Truy cập nhanh</h2>
              </div>
              <div className="space-y-3">
                <Link to="/chat" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 hover:border-green-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Brain className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-green-700 transition-colors">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Hỏi đáp với AI</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/courses" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg"><BookOpen className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-blue-700 transition-colors">Khóa học</h3>
                    <p className="text-sm text-gray-600">Khám phá nội dung</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/flashcards" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg"><BarChart3 className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-purple-700 transition-colors">Flashcards</h3>
                    <p className="text-sm text-gray-600">Ôn tập & ghi nhớ</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/calendar" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Calendar className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-orange-700 transition-colors">Lịch học</h3>
                    <p className="text-sm text-gray-600">Google Calendar</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg"><Clock className="w-5 h-5 text-indigo-600" /></div>
                <h2 className="text-xl font-bold">Hoạt động gần đây</h2>
              </div>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const iconInfo = activityIcons[activity.type] || activityIcons.course;
                    const IconComponent = iconInfo.icon;
                    return (
                      <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className={`p-2 rounded-lg ${iconInfo.bg}`}>
                          <IconComponent className={`w-4 h-4 ${iconInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-1 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{dashboardService.formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-4">Chưa có hoạt động nào</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Progress Overview */}
        {stats.enrolledCourses > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Tổng quan học tập</h2>
                </div>
                <p className="text-lg opacity-90 mb-4">
                  {stats.averageProgress >= 50 
                    ? 'Bạn đang tiến bộ rất tốt! Tiếp tục phát huy nhé.' 
                    : 'Hãy dành thêm thời gian học tập để đạt kết quả tốt hơn!'}
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">{stats.enrolledCourses} khóa học</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <span className="font-semibold">{stats.completedCourses} hoàn thành</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    <span className="font-semibold">{stats.averageProgress}% tiến độ</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/courses" className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all">
                  Tiếp tục học
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
