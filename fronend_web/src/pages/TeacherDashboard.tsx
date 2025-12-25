import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Users, TrendingUp, Clock, BarChart3, 
  ChevronRight, Award, Target, Plus
} from 'lucide-react';
import Layout from '../components/Layout';
import { teacherService } from '../services/teacherService';
import type { CourseStudentManagement } from '../types';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseStudentManagement[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getMyCoursesAsTeacher();
      setCourses(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalStudents = courses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0);
  const avgProgress = courses.length > 0
    ? courses.reduce((sum, c) => {
        const courseAvg = c.students.length > 0
          ? c.students.reduce((s, st) => s + (st.progressPercentage || 0), 0) / c.students.length
          : 0;
        return sum + courseAvg;
      }, 0) / courses.length
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý khóa học</h1>
          <p className="text-gray-600">Theo dõi tiến độ và quản lý sinh viên trong các khóa học của bạn</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            <p className="text-sm text-gray-500">Khóa học</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            <p className="text-sm text-gray-500">Tổng sinh viên</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
            <p className="text-sm text-gray-500">Tổng bài học</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgProgress.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Tiến độ TB</p>
          </div>
        </div>

        {/* Courses List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Khóa học của tôi</h2>
          <Link to="/courses/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Tạo khóa học
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có khóa học nào</h3>
            <p className="text-gray-500 mb-6">Bắt đầu tạo khóa học đầu tiên của bạn</p>
            <Link to="/courses/create" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              <Plus className="w-5 h-5" /> Tạo khóa học
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => {
              const courseAvgProgress = course.students.length > 0
                ? course.students.reduce((s, st) => s + (st.progressPercentage || 0), 0) / course.students.length
                : 0;

              return (
                <Link
                  key={course.courseId}
                  to={`/teacher/courses/${course.courseId}`}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {course.courseTitle.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                        {course.courseTitle}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-1 mb-3">{course.courseDescription}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" /> {course.totalStudents} sinh viên
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <BookOpen className="w-4 h-4" /> {course.totalLessons} bài học
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="w-4 h-4" /> {courseAvgProgress.toFixed(1)}% tiến độ TB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium">Xem chi tiết</span>
                      <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
