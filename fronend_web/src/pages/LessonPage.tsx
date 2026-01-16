import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, Clock, CheckCircle, Target, Brain, Zap, Plus, ClipboardCheck, Edit, Trash2, FileText, Video, Download, AlertTriangle, Settings, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import MaterialList from '../components/MaterialList';
import { courseService } from '../services/courseService';
import { quizService, type QuizListItem, type UpdateQuizRequest } from '../services/quizService';
import { progressService } from '../services/progressService';
import { useAuthStore } from '../store/authStore';
import type { Material } from '../types';

const LessonPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const lessonId = parseInt(id || '0');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [deleting, setDeleting] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizListItem | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => courseService.getLesson(lessonId),
  });

  // Fetch lesson progress
  const { data: lessonProgress, refetch: refetchProgress } = useQuery({
    queryKey: ['lessonProgress', lessonId],
    queryFn: () => progressService.getLessonProgress(lessonId),
    enabled: !!user && user.role === 'STUDENT',
    retry: false,
  });

  // Fetch quizzes for this lesson
  const { data: quizzes = [], isLoading: quizzesLoading, error: quizzesError } = useQuery({
    queryKey: ['lessonQuizzes', lessonId],
    queryFn: () => quizService.getQuizzesByLesson(lessonId),
    enabled: !!lesson,
  });

  // Fetch materials for this lesson
  const { data: materials = [] } = useQuery({
    queryKey: ['lessonMaterials', lessonId],
    queryFn: () => courseService.getMaterialsByLesson(lessonId),
    enabled: !!lesson,
  });

  // Log quiz loading errors
  useEffect(() => {
    if (quizzesError) {
      console.error('Error loading quizzes:', quizzesError);
    }
  }, [quizzesError]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Mark lesson as complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: () => progressService.updateLessonProgress({
      lessonId,
      courseId: lesson?.courseId || 0,
      progressPercentage: 100,
      timeSpent,
      isCompleted: true,
    }),
    onSuccess: () => {
      toast.success('Đã đánh dấu hoàn thành bài học!');
      refetchProgress();
      // Invalidate course progress to update
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
      queryClient.invalidateQueries({ queryKey: ['lessonProgressBatch'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật tiến độ');
    },
  });

  const handleMarkComplete = () => {
    if (lessonProgress?.isCompleted) {
      toast.success('Bài học đã hoàn thành!');
      return;
    }
    markCompleteMutation.mutate();
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const quiz = await quizService.generateQuiz(lessonId, 'medium', 10);
      toast.success('Quiz generated successfully!');
      navigate(`/quiz/${quiz.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác!')) {
      return;
    }
    setDeleting(true);
    try {
      await courseService.deleteLesson(lessonId);
      toast.success('Đã xóa bài học!');
      navigate(`/courses/${lesson?.courseId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa bài học!');
    } finally {
      setDeleting(false);
    }
  };

  // Delete quiz handler
  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa quiz này? Hành động này không thể hoàn tác!')) return;
    setDeletingQuizId(quizId);
    try {
      await quizService.deleteQuiz(quizId);
      toast.success('Đã xóa quiz!');
      queryClient.invalidateQueries({ queryKey: ['lessonQuizzes', lessonId] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa quiz');
    } finally {
      setDeletingQuizId(null);
    }
  };

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateQuizRequest }) => 
      quizService.updateQuiz(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật quiz!');
      setEditingQuiz(null);
      queryClient.invalidateQueries({ queryKey: ['lessonQuizzes', lessonId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật quiz');
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to={`/courses/${lesson?.courseId}`}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course
          </Link>
        </motion.div>

        {/* Lesson Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 mb-8 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Lesson Content</span>
                </div>
              </div>
              
              {/* Teacher Actions */}
              {isTeacher && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/lessons/${lessonId}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden md:inline">Chỉnh sửa</span>
                  </button>
                  <button
                    onClick={handleDeleteLesson}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {deleting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">Xóa</span>
                  </button>
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{lesson?.title}</h1>
            <div className="flex items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>~15 min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Beginner Level</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lesson Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 mb-8"
        >
          <div className="prose prose-lg prose-blue max-w-none">
            <div 
              className="text-gray-800 leading-relaxed space-y-4"
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.75',
              }}
              dangerouslySetInnerHTML={{
                __html: lesson?.content
                  ?.split('\n')
                  .map(line => {
                    // Xử lý headings
                    if (line.startsWith('# ')) {
                      return `<h1 class="text-4xl font-bold mt-8 mb-4 text-gray-900">${line.substring(2)}</h1>`;
                    }
                    if (line.startsWith('## ')) {
                      return `<h2 class="text-3xl font-bold mt-6 mb-3 text-gray-900">${line.substring(3)}</h2>`;
                    }
                    if (line.startsWith('### ')) {
                      return `<h3 class="text-2xl font-semibold mt-5 mb-2 text-gray-800">${line.substring(4)}</h3>`;
                    }
                    
                    // Xử lý lists
                    if (line.trim().startsWith('- ')) {
                      return `<li class="ml-6 mb-2">${line.trim().substring(2)}</li>`;
                    }
                    if (line.trim().match(/^\d+\. /)) {
                      return `<li class="ml-6 mb-2">${line.trim().replace(/^\d+\. /, '')}</li>`;
                    }
                    
                    // Xử lý code blocks
                    if (line.trim().startsWith('```')) {
                      return line.includes('```') && line.length > 3 
                        ? '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>'
                        : '</code></pre>';
                    }
                    
                    // Xử lý inline code
                    const codeProcessed = line.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-green-600">$1</code>');
                    
                    // Xử lý bold
                    const boldProcessed = codeProcessed.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
                    
                    // Xử lý italic
                    const italicProcessed = boldProcessed.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
                    
                    // Paragraph
                    if (line.trim() === '') {
                      return '<div class="h-4"></div>';
                    }
                    
                    return `<p class="mb-4">${italicProcessed}</p>`;
                  })
                  .join('') || ''
              }}
            />
          </div>

          {/* Completion Indicator */}
          {user?.role === 'STUDENT' && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    lessonProgress?.isCompleted 
                      ? 'bg-green-100' 
                      : lessonProgress 
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                  }`}>
                    {lessonProgress?.isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : lessonProgress ? (
                      <Target className="w-6 h-6 text-green-600" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {lessonProgress?.isCompleted 
                        ? 'Bài học đã hoàn thành' 
                        : lessonProgress 
                        ? `Tiến độ: ${lessonProgress.progressPercentage}%`
                        : 'Tiến độ bài học'
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {lessonProgress?.isCompleted
                        ? `Hoàn thành sau ${Math.floor((lessonProgress.timeSpent || 0) / 60)} phút`
                        : 'Nhấn nút để đánh dấu hoàn thành'
                      }
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleMarkComplete}
                  disabled={lessonProgress?.isCompleted || markCompleteMutation.isPending}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                    lessonProgress?.isCompleted
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {markCompleteMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang lưu...
                    </span>
                  ) : lessonProgress?.isCompleted ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Đã hoàn thành
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Đánh dấu hoàn thành
                    </span>
                  )}
                </button>
              </div>
              
              {/* Time tracking */}
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Thời gian học: {Math.floor(timeSpent / 60)} phút {timeSpent % 60} giây</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Materials Section */}
        {materials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Tài liệu bài học</h2>
                <p className="text-sm text-gray-500">{materials.length} tài liệu</p>
              </div>
            </div>
            
            <MaterialList 
              materials={materials} 
              canDelete={isTeacher}
              onDelete={(id) => {
                // Refetch materials after delete
                queryClient.invalidateQueries({ queryKey: ['lessonMaterials', lessonId] });
              }}
            />
          </motion.div>
        )}

        {/* Quizzes Section */}
        {quizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Bài kiểm tra</h2>
                <p className="text-gray-600">Làm bài kiểm tra để đánh giá kiến thức của bạn</p>
              </div>
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link
                  to={`/lessons/${lessonId}/quiz/create`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Tạo quiz
                </Link>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: (quiz.isExpired || quiz.canAttempt === false) ? 1 : 1.02 }}
                >
                  <Link
                    to={(quiz.isExpired || quiz.canAttempt === false) ? '#' : `/quiz/${quiz.id}`}
                    onClick={(e) => {
                      if (quiz.isExpired) {
                        e.preventDefault();
                        toast.error('Quiz đã hết hạn làm bài!');
                      } else if (quiz.canAttempt === false) {
                        e.preventDefault();
                        toast.error(`Bạn đã hết số lần làm bài! (${quiz.attemptCount}/${quiz.maxAttempts})`);
                      }
                    }}
                    className={`block bg-white rounded-xl p-6 shadow-lg border transition-all ${
                      (quiz.isExpired || quiz.canAttempt === false)
                        ? 'border-red-200 opacity-75 cursor-not-allowed' 
                        : 'border-gray-100 hover:shadow-xl hover:border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          (quiz.isExpired || quiz.canAttempt === false)
                            ? 'bg-red-100 text-red-600'
                            : quiz.isCompleted 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {(quiz.isExpired || quiz.canAttempt === false) ? (
                            <AlertTriangle className="w-6 h-6" />
                          ) : (
                            <ClipboardCheck className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{quiz.title}</h3>
                          <p className="text-sm text-gray-500">{quiz.totalQuestions} câu hỏi</p>
                        </div>
                      </div>
                      {quiz.isCompleted && !quiz.isExpired && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {quiz.lastScore?.toFixed(0)}%
                        </div>
                      )}
                      {quiz.isExpired && (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Hết hạn
                        </div>
                      )}
                    </div>
                    
                    {quiz.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                    )}
                    
                    {/* Deadline info */}
                    {quiz.deadline && (
                      <div className={`mb-3 p-2 rounded-lg text-sm flex items-center gap-2 ${
                        quiz.isExpired 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>
                          {quiz.isExpired ? 'Đã hết hạn: ' : 'Hạn nộp: '}
                          {new Date(quiz.deadline).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    )}
                    
                    {/* Time limit info */}
                    {quiz.timeLimitMinutes && (
                      <div className="mb-3 p-2 rounded-lg text-sm flex items-center gap-2 bg-green-50 text-green-700">
                        <Clock className="w-4 h-4" />
                        <span>Thời gian làm bài: {quiz.timeLimitMinutes} phút</span>
                      </div>
                    )}
                    
                    {/* Max attempts info */}
                    {quiz.maxAttempts && (
                      <div className={`mb-3 p-2 rounded-lg text-sm flex items-center gap-2 ${
                        quiz.canAttempt === false 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        <span>🔢</span>
                        <span>
                          {quiz.canAttempt === false 
                            ? `Đã hết lượt làm (${quiz.attemptCount}/${quiz.maxAttempts})`
                            : `Số lần làm: ${quiz.attemptCount || 0}/${quiz.maxAttempts}`
                          }
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        quiz.difficulty === 'EASY' 
                          ? 'bg-green-100 text-green-700' 
                          : quiz.difficulty === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {quiz.difficulty === 'EASY' ? 'Dễ' : quiz.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                      </span>
                      {!quiz.isPublic && (
                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-700">
                          🔒 Riêng tư
                        </span>
                      )}
                      <span>• {quiz.creatorName}</span>
                    </div>
                    
                    {/* Quiz actions: Edit & Delete */}
                    {/* Giáo viên: sửa + xóa tất cả quiz */}
                    {/* Sinh viên: chỉ xóa quiz do mình tạo */}
                    {(isTeacher || (user?.role === 'STUDENT' && quiz.createdBy === user?.id)) && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        {isTeacher && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingQuiz(quiz);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Sửa
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteQuiz(quiz.id);
                          }}
                          disabled={deletingQuizId === quiz.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingQuizId === quiz.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Xóa
                        </button>
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Teacher Create Quiz Button */}
        {quizzes.length === 0 && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <Link
              to={`/lessons/${lessonId}/quiz/create`}
              className="block bg-white rounded-xl p-8 shadow-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:shadow-xl transition-all text-center"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tạo bài kiểm tra đầu tiên</h3>
              <p className="text-gray-600">Thêm bài trắc nghiệm để đánh giá kiến thức sinh viên</p>
            </Link>
          </motion.div>
        )}

        {/* Quiz Generation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 shadow-xl text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 flex-shrink-0">
              <Brain className="w-10 h-10" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Test Your Knowledge</h3>
              <p className="text-lg opacity-90">
                Generate an AI-powered quiz to reinforce what you've learned
              </p>
            </div>
            
            <button
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-3 text-lg"
            >
              {generatingQuiz ? (
                <>
                  <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Edit Quiz Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Chỉnh sửa Quiz</h2>
              <button
                onClick={() => setEditingQuiz(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: UpdateQuizRequest = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string || undefined,
                  difficulty: formData.get('difficulty') as 'EASY' | 'MEDIUM' | 'HARD',
                  deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string).toISOString() : null,
                  timeLimitMinutes: formData.get('timeLimitMinutes') ? parseInt(formData.get('timeLimitMinutes') as string) : null,
                  maxAttempts: formData.get('maxAttempts') ? parseInt(formData.get('maxAttempts') as string) : null,
                  shuffleQuestions: formData.get('shuffleQuestions') === 'on',
                  shuffleOptions: formData.get('shuffleOptions') === 'on',
                  isPublic: formData.get('isPublic') === 'on',
                };
                updateQuizMutation.mutate({ id: editingQuiz.id, data });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingQuiz.title}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  defaultValue={editingQuiz.description || ''}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
                <select
                  name="difficulty"
                  defaultValue={editingQuiz.difficulty}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp bài</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  defaultValue={editingQuiz.deadline ? new Date(editingQuiz.deadline).toISOString().slice(0, 16) : ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn thời gian nộp</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian làm bài (phút)</label>
                <input
                  type="number"
                  name="timeLimitMinutes"
                  defaultValue={editingQuiz.timeLimitMinutes || ''}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lần làm bài tối đa</label>
                <input
                  type="number"
                  name="maxAttempts"
                  defaultValue={editingQuiz.maxAttempts || ''}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Để trống nếu không giới hạn</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="shuffleQuestions"
                    defaultChecked={false}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Xáo trộn thứ tự câu hỏi</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="shuffleOptions"
                    defaultChecked={false}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Xáo trộn thứ tự đáp án</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublic"
                    defaultChecked={editingQuiz.isPublic}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Công khai quiz</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateQuizMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateQuizMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default LessonPage;
