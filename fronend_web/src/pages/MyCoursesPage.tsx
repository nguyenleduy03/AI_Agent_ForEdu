import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Plus, 
  ArrowRight,
  Clock,
  CheckCircle,
  PlayCircle,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Course } from '../types';

const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getMyCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      toast.success('Đã xóa khóa học');
      loadMyCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa khóa học');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isTeacher ? 'Khóa học của tôi' : 'Khóa học đã đăng ký'}
            </h1>
            <p className="text-gray-600">
              {isTeacher 
                ? 'Quản lý các khóa học bạn đã tạo' 
                : 'Danh sách các khóa học bạn đang theo học'}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => navigate('/courses/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Tạo khóa học mới
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {isTeacher ? 'Tổng khóa học' : 'Đang theo học'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        {isTeacher && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng sinh viên</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng bài học</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isTeacher ? 'Chưa có khóa học nào' : 'Bạn chưa đăng ký khóa học nào'}
          </h3>
          <p className="text-gray-600 mb-6">
            {isTeacher 
              ? 'Hãy tạo khóa học đầu tiên của bạn!' 
              : 'Hãy khám phá và đăng ký các khóa học thú vị!'}
          </p>
          <button
            onClick={() => navigate(isTeacher ? '/courses/create' : '/courses')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            {isTeacher ? 'Tạo khóa học' : 'Khám phá khóa học'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Course Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <div className="flex items-start justify-between mb-3">
                  <BookOpen className="w-8 h-8" />
                  {isTeacher && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.id}/edit`);
                        }}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="p-2 bg-white/20 rounded-lg hover:bg-red-500 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm opacity-90 line-clamp-2">{course.description}</p>
              </div>

              {/* Course Stats */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>Bài học</span>
                  </div>
                  <span className="font-semibold text-gray-900">{course.totalLessons || 0}</span>
                </div>

                {isTeacher && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Sinh viên</span>
                    </div>
                    <span className="font-semibold text-gray-900">{course.enrollmentCount || 0}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Trạng thái</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.isPublic 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {course.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>

                {!isTeacher && course.creatorName && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span>Giáo viên</span>
                    </div>
                    <span className="font-medium text-gray-900">{course.creatorName}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 flex gap-2">
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                >
                  <PlayCircle className="w-4 h-4" />
                  {isTeacher ? 'Quản lý' : 'Học ngay'}
                </button>
                {isTeacher && (
                  <button
                    onClick={() => navigate(`/courses/${course.id}/students`)}
                    className="flex items-center justify-center gap-2 px-4 bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
                    title="Xem sinh viên"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Action */}
      {!isTeacher && courses.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Khám phá thêm khóa học
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;
