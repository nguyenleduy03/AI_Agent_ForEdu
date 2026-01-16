import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Clock, TrendingUp, Trophy, BookOpen,
  CheckCircle, XCircle, Calendar, Target, Award, FileText
} from 'lucide-react';
import Layout from '../components/Layout';
import { teacherService, type StudentDetail } from '../services/teacherService';
import toast from 'react-hot-toast';

const StudentDetailPage = () => {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'quizzes'>('progress');

  useEffect(() => {
    if (courseId && studentId) loadStudent();
  }, [courseId, studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getStudentDetail(Number(courseId), Number(studentId));
      setStudent(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải thông tin sinh viên');
      navigate(`/teacher/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} phút`;
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-';
  const formatDateTime = (date?: string) => date ? new Date(date).toLocaleString('vi-VN') : '-';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!student) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <button onClick={() => navigate(`/teacher/courses/${courseId}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>

        {/* Student Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold">
              {(student.fullName || student.username).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{student.fullName || student.username}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1"><Mail className="w-4 h-4" />{student.email}</p>
              <p className="text-gray-500 flex items-center gap-2 mt-1"><Calendar className="w-4 h-4" />Đăng ký: {formatDate(student.enrolledAt)}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-600">{student.progressPercentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Tiến độ</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <BookOpen className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-600">{student.completedLessons}/{student.totalLessons}</p>
                <p className="text-xs text-gray-500">Bài học</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-600">{student.averageQuizScore.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Điểm TB</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-purple-600">{formatTime(student.totalTimeSpent)}</p>
                <p className="text-xs text-gray-500">Thời gian</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-green-600" />Thống kê bài kiểm tra</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{student.totalQuizzesTaken}</p>
              <p className="text-sm text-gray-500">Lượt làm</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{student.totalQuizzesPassed}</p>
              <p className="text-sm text-gray-500">Đạt (≥50%)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{student.averageQuizScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Điểm TB</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{student.highestQuizScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Cao nhất</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{student.lowestQuizScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Thấp nhất</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('progress')} className={`px-4 py-2 rounded-xl font-medium ${activeTab === 'progress' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}>
            Tiến độ bài học
          </button>
          <button onClick={() => setActiveTab('quizzes')} className={`px-4 py-2 rounded-xl font-medium ${activeTab === 'quizzes' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}>
            Lịch sử làm bài ({student.quizHistory.length})
          </button>
        </div>

        {/* Lesson Progress */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiến độ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoàn thành</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truy cập cuối</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {student.lessonProgress.map((lesson, index) => (
                  <tr key={lesson.lessonId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-500 mr-2">{index + 1}.</span>
                      <span className="font-medium text-gray-900">{lesson.lessonTitle}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lesson.isCompleted ? (
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />Hoàn thành</span>
                      ) : lesson.progressPercentage > 0 ? (
                        <span className="flex items-center gap-1 text-green-600"><TrendingUp className="w-4 h-4" />Đang học</span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" />Chưa bắt đầu</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${lesson.isCompleted ? 'bg-green-500' : 'bg-green-500'}`} style={{ width: `${lesson.progressPercentage}%` }} />
                        </div>
                        <span className="text-sm">{lesson.progressPercentage.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(lesson.timeSpent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(lesson.completedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(lesson.lastAccessedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quiz History */}
        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {student.quizHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Sinh viên chưa làm bài kiểm tra nào</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài kiểm tra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lần thứ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {student.quizHistory.map((quiz) => (
                    <tr key={quiz.resultId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{quiz.quizTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quiz.lessonTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">#{quiz.attemptNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{quiz.score}/{quiz.totalQuestions}</span>
                        <span className="text-gray-500 ml-1">({quiz.percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {quiz.percentage >= 50 ? (
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />Đạt</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" />Chưa đạt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(quiz.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentDetailPage;
