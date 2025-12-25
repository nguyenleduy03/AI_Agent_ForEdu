import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Play, ArrowLeft, Plus, CheckCircle, Clock, Award, Users, GraduationCap, Target, Sparkles, Edit, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { progressService } from '../services/progressService';
import { useAuthStore } from '../store/authStore';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || '0');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourse(courseId),
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => courseService.getLessonsByCourse(courseId),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', courseId],
    queryFn: () => courseService.getMaterialsByCourse(courseId),
  });

  // Fetch progress data
  const { data: courseProgress } = useQuery({
    queryKey: ['courseProgress', courseId],
    queryFn: () => progressService.getCourseProgress(courseId),
    enabled: !!user && user.role === 'STUDENT',
  });

  // Fetch lesson progress for all lessons
  const lessonProgressQueries = useQuery({
    queryKey: ['lessonProgressBatch', courseId, lessons.map(l => l.id)],
    queryFn: async () => {
      if (!user || user.role !== 'STUDENT' || lessons.length === 0) return {};
      const progressMap: Record<number, any> = {};
      await Promise.all(
        lessons.map(async (lesson) => {
          try {
            const progress = await progressService.getLessonProgress(lesson.id);
            progressMap[lesson.id] = progress;
          } catch (err) {
            // Lesson not started yet
            progressMap[lesson.id] = null;
          }
        })
      );
      return progressMap;
    },
    enabled: !!user && user.role === 'STUDENT' && lessons.length > 0,
  });

  // Unenroll mutation
  const unenrollMutation = useMutation({
    mutationFn: () => courseService.unenrollCourse(courseId),
    onSuccess: () => {
      toast.success('Đã hủy đăng ký khóa học');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      navigate('/courses');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể hủy đăng ký');
    },
  });

  const handleUnenroll = () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký khóa học này?\n\nTiến độ học tập của bạn sẽ được giữ lại nếu bạn đăng ký lại sau.')) {
      return;
    }
    unenrollMutation.mutate();
  };

  if (courseLoading || lessonsLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const progress = courseProgress?.progressPercentage || 0;
  const lessonProgressMap = lessonProgressQueries.data || {};

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link 
            to="/courses" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </Link>
        </motion.div>

        {/* Course Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8"
        >
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 flex-shrink-0 shadow-2xl">
                <BookOpen className="w-16 h-16 text-white" />
              </div>
              
              <div className="flex-1 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold opacity-90">Course Overview</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{course?.title}</h1>
                <p className="text-lg opacity-90 mb-6 leading-relaxed">{course?.description}</p>
                
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Instructor</p>
                      <p className="font-semibold">{course?.teacherName || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Lessons</p>
                      <p className="font-semibold">{lessons.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Materials</p>
                      <p className="font-semibold">{materials.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="opacity-75 text-xs">Students</p>
                      <p className="font-semibold">{course?.enrollmentCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 md:px-12 py-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Your Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>

          {/* Teacher Actions */}
          {course?.isCreator && (
            <div className="px-8 md:px-12 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-green-700">
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-semibold">Bạn là giáo viên của khóa học này</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <Link 
                    to={`/courses/${courseId}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </Link>
                  <Link 
                    to={`/teacher/courses/${courseId}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    Báo cáo & Thống kê
                  </Link>
                  <Link 
                    to={`/courses/${courseId}/students`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Quản lý sinh viên
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Student Actions - Show unenroll button for enrolled students */}
          {user?.role === 'STUDENT' && course?.isEnrolled && !course?.isCreator && (
            <div className="px-8 md:px-12 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Bạn đã đăng ký khóa học này</span>
                </div>
                <button
                  onClick={handleUnenroll}
                  disabled={unenrollMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {unenrollMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>Hủy đăng ký</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Lessons Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Course Lessons</h2>
              <p className="text-gray-600">Follow the structured curriculum to master the concepts</p>
            </div>
            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <Link 
                to={`/courses/${courseId}/lessons/create`}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Add Lesson</span>
              </Link>
            )}
          </motion.div>

          {lessons.length > 0 ? (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                >
                  <Link 
                    to={`/lessons/${lesson.id}`} 
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all flex items-center gap-6 group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                      {lessonProgressMap[lesson.id]?.isCompleted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                        {lesson.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {lesson.content.substring(0, 120)}...
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {lessonProgressMap[lesson.id] && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{Math.floor((lessonProgressMap[lesson.id].timeSpent || 0) / 60)} phút</span>
                          </span>
                        )}
                        {lessonProgressMap[lesson.id]?.isCompleted ? (
                          <span className="flex items-center gap-1.5 text-green-600 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span>Đã hoàn thành</span>
                          </span>
                        ) : lessonProgressMap[lesson.id] ? (
                          <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                            <Target className="w-4 h-4" />
                            <span>{lessonProgressMap[lesson.id].progressPercentage}%</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <Play className="w-4 h-4" />
                            <span>Chưa bắt đầu</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Play className="w-6 h-6" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No Lessons Yet</h3>
              <p className="text-gray-600 mb-6">This course doesn't have any lessons yet. Check back soon!</p>
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link 
                  to={`/courses/${courseId}/lessons/create`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create First Lesson
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {/* Materials Section */}
        {materials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Course Materials</h2>
              <p className="text-gray-600">Additional resources to enhance your learning</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {materials.map((material, index) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1">{material.title}</h3>
                      <p className="text-sm text-gray-500 uppercase">{material.fileType}</p>
                    </div>
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-600 hover:text-white transition-all"
                    >
                      View
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
