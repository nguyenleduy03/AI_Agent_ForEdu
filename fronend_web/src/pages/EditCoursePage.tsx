import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Save, Loader, Trash2, Users, FileText } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';
import type { Course } from '../types';

const EditCoursePage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    accessPassword: '',
  });

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isTeacher) {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/courses');
      return;
    }
    if (courseId) {
      loadCourse();
    }
  }, [courseId, isTeacher]);

  const loadCourse = async () => {
    try {
      const courseData = await courseService.getCourse(Number(courseId));
      
      // Check if user is the creator
      if (!courseData.isCreator) {
        toast.error('Bạn không có quyền chỉnh sửa khóa học này');
        navigate('/courses');
        return;
      }
      
      setCourse(courseData);
      setFormData({
        title: courseData.title,
        description: courseData.description,
        isPublic: courseData.isPublic ?? true,
        accessPassword: '',
      });
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Không thể tải thông tin khóa học!');
      navigate('/courses');
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên khóa học!');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả khóa học!');
      return;
    }

    setLoading(true);

    try {
      await courseService.updateCourse(Number(courseId), {
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic,
        accessPassword: formData.accessPassword || undefined,
      });
      toast.success('Cập nhật khóa học thành công!');
      navigate(`/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật khóa học!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này?\n\nTất cả bài học, quiz và dữ liệu liên quan sẽ bị xóa vĩnh viễn!')) {
      return;
    }

    setDeleting(true);

    try {
      await courseService.deleteCourse(Number(courseId));
      toast.success('Đã xóa khóa học!');
      navigate('/courses');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa khóa học!');
    } finally {
      setDeleting(false);
    }
  };

  if (loadingCourse) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Không tìm thấy khóa học</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại khóa học</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Chỉnh Sửa Khóa Học</h1>
                <p className="text-gray-600">Cập nhật thông tin khóa học</p>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              <span>Xóa khóa học</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{course.enrollmentCount || 0}</p>
                <p className="text-sm text-gray-500">Sinh viên</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{course.totalLessons || 0}</p>
                <p className="text-sm text-gray-500">Bài học</p>
              </div>
            </div>
          </div>
          <Link 
            to={`/teacher/courses/${courseId}`}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white hover:shadow-lg transition-all"
          >
            <p className="font-semibold">Xem báo cáo</p>
            <p className="text-sm opacity-90">Thống kê chi tiết →</p>
          </Link>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Tên Khóa Học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Python Programming for Beginners"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                disabled={loading}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô Tả Khóa Học <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về khóa học..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                disabled={loading}
                required
              />
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quyền Truy Cập
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: true, accessPassword: '' })}
                    className="mt-1"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium">🌍 Public</div>
                    <div className="text-sm text-gray-500">Mọi sinh viên đều có thể đăng ký</div>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={!formData.isPublic}
                    onChange={() => setFormData({ ...formData, isPublic: false })}
                    className="mt-1"
                    disabled={loading}
                  />
                  <div>
                    <div className="font-medium">🔒 Private</div>
                    <div className="text-sm text-gray-500">Yêu cầu mật khẩu để đăng ký</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Access Password (only for private courses) */}
            {!formData.isPublic && (
              <div>
                <label htmlFor="accessPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật Khẩu Mới (để trống nếu không đổi)
                </label>
                <input
                  type="text"
                  id="accessPassword"
                  name="accessPassword"
                  value={formData.accessPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới cho khóa học"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Để trống nếu muốn giữ mật khẩu cũ
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(`/courses/${courseId}`)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EditCoursePage;
