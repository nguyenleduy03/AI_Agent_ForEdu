import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, BookOpen, FileText, Trophy, Clock, TrendingUp, 
  ArrowLeft, BarChart3, Award, Target, ChevronRight,
  Eye, Trash2, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { teacherService, type CourseAnalytics, type StudentRanking } from '../services/teacherService';
import type { CourseStudentManagement, EnrolledStudent } from '../types';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'students' | 'lessons' | 'quizzes';

const TeacherCourseDashboard = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [studentData, setStudentData] = useState<CourseStudentManagement | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentsRes] = await Promise.all([
        teacherService.getCourseAnalytics(Number(courseId)),
        teacherService.getCourseStudents(Number(courseId))
      ]);
      setAnalytics(analyticsRes);
      setStudentData(studentsRes);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm('Xóa sinh viên này khỏi khóa học?')) return;
    try {
      setRemovingId(studentId);
      await teacherService.removeStudent(Number(courseId), studentId);
      toast.success('Đã xóa sinh viên');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi xóa sinh viên');
    } finally {
      setRemovingId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!analytics) return null;

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'students', label: `Sinh viên (${analytics.totalStudents})`, icon: Users },
    { id: 'lessons', label: `Bài học (${analytics.totalLessons})`, icon: BookOpen },
    { id: 'quizzes', label: `Bài kiểm tra (${analytics.totalQuizzes})`, icon: FileText },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" /> Quay lại
          </button>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{analytics.courseTitle}</h1>
            <p className="opacity-90 mb-4">{analytics.courseDescription}</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2"><Users className="w-5 h-5" /><span>{analytics.totalStudents} sinh viên</span></div>
              <div className="flex items-center gap-2"><BookOpen className="w-5 h-5" /><span>{analytics.totalLessons} bài học</span></div>
              <div className="flex items-center gap-2"><FileText className="w-5 h-5" /><span>{analytics.totalQuizzes} bài kiểm tra</span></div>
              <div className="flex items-center gap-2"><Clock className="w-5 h-5" /><span>{formatTime(analytics.totalStudyTime)} tổng thời gian</span></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={TrendingUp} label="Tiến độ TB" value={`${analytics.averageProgress.toFixed(1)}%`} color="blue" />
              <StatCard icon={Trophy} label="Điểm TB" value={`${analytics.averageQuizScore.toFixed(1)}%`} color="amber" />
              <StatCard icon={Target} label="Tỷ lệ đạt" value={`${analytics.passRate.toFixed(1)}%`} color="green" />
              <StatCard icon={Clock} label="TG học TB" value={formatTime(analytics.averageStudyTime)} color="purple" />
            </div>

            {/* Progress Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-4">Phân bố tiến độ sinh viên</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{analytics.studentsCompleted}</p>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{analytics.studentsInProgress}</p>
                  <p className="text-sm text-gray-600">Đang học</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-600">{analytics.studentsNotStarted}</p>
                  <p className="text-sm text-gray-600">Chưa bắt đầu</p>
                </div>
              </div>
            </div>

            {/* Top Students */}
            {analytics.topStudents.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" />Top sinh viên</h3>
                <div className="space-y-3">
                  {analytics.topStudents.slice(0, 5).map((student) => (
                    <div key={student.userId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        student.rank === 1 ? 'bg-amber-500' : student.rank === 2 ? 'bg-gray-400' : student.rank === 3 ? 'bg-amber-700' : 'bg-gray-300'
                      }`}>
                        {student.rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{student.fullName || student.username}</p>
                        <p className="text-sm text-gray-500">Tiến độ: {student.progressPercentage.toFixed(1)}% • Điểm TB: {student.averageQuizScore.toFixed(1)}%</p>
                      </div>
                      <Link to={`/teacher/courses/${courseId}/students/${student.userId}`} className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && studentData && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sinh viên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiến độ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đăng ký</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truy cập cuối</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentData.students.map((student) => (
                    <tr key={student.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                            {(student.fullName || student.username).charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{student.fullName || student.username}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${student.progressPercentage || 0}%` }} />
                          </div>
                          <span className="text-sm font-medium">{(student.progressPercentage || 0).toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-gray-500">{student.completedLessons || 0}/{student.totalLessons || 0} bài</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(student.totalTimeSpent || 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(student.enrolledAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(student.lastAccessedAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/teacher/courses/${courseId}/students/${student.userId}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Xem chi tiết">
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button onClick={() => handleRemoveStudent(student.userId)} disabled={removingId === student.userId} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Xóa">
                            {removingId === student.userId ? <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentData.students.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Chưa có sinh viên nào đăng ký</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoàn thành</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đang học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ hoàn thành</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TG học TB</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.lessonAnalytics.map((lesson) => (
                    <tr key={lesson.lessonId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lesson.orderIndex}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/lessons/${lesson.lessonId}`} className="font-medium text-blue-600 hover:text-blue-800">{lesson.lessonTitle}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">{lesson.studentsCompleted}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{lesson.studentsInProgress}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${lesson.completionRate}%` }} />
                          </div>
                          <span className="text-sm">{lesson.completionRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(lesson.averageTimeSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.lessonAnalytics.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Chưa có bài học nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài kiểm tra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lượt làm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SV đã làm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm TB</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cao nhất</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thấp nhất</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ đạt</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.quizAnalytics.map((quiz) => (
                    <tr key={quiz.quizId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{quiz.quizTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quiz.lessonTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quiz.totalAttempts}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quiz.uniqueStudents}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-sm ${quiz.averageScore >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {quiz.averageScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{quiz.highestScore.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{quiz.lowestScore.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${quiz.passRate}%` }} />
                          </div>
                          <span className="text-sm">{quiz.passRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.quizAnalytics.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Chưa có bài kiểm tra nào</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

export default TeacherCourseDashboard;
