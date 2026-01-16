import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Save, Loader, BookOpen, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';
import type { Lesson } from '../types';

const EditLessonPage = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    orderIndex: 1,
  });

  // Check permission
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!isTeacher) {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/courses');
      return;
    }
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId, isTeacher]);

  const loadLesson = async () => {
    try {
      const lessonData = await courseService.getLesson(Number(lessonId));
      setLesson(lessonData);
      setFormData({
        title: lessonData.title,
        content: lessonData.content,
        orderIndex: lessonData.orderIndex || 1,
      });
    } catch (error) {
      console.error('Error loading lesson:', error);
      toast.error('Không thể tải thông tin bài học!');
      navigate('/courses');
    } finally {
      setLoadingLesson(false);
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
      toast.error('Vui lòng nhập tên bài học!');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung bài học!');
      return;
    }

    setLoading(true);

    try {
      await courseService.updateLesson(Number(lessonId), {
        title: formData.title,
        content: formData.content,
        orderIndex: Number(formData.orderIndex),
      });
      toast.success('Cập nhật bài học thành công!');
      navigate(`/lessons/${lessonId}`);
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật bài học!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này? Hành động này không thể hoàn tác!')) {
      return;
    }

    setDeleting(true);

    try {
      await courseService.deleteLesson(Number(lessonId));
      toast.success('Đã xóa bài học!');
      navigate(`/courses/${lesson?.courseId}`);
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa bài học!');
    } finally {
      setDeleting(false);
    }
  };

  if (loadingLesson) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Không tìm thấy bài học</p>
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
            onClick={() => navigate(`/lessons/${lessonId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại bài học</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Chỉnh Sửa Bài Học</h1>
                <p className="text-gray-600">Cập nhật nội dung bài học</p>
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
              <span>Xóa bài học</span>
            </button>
          </div>
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
                Tên Bài Học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Chapter 1: Introduction to Python"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                disabled={loading}
                required
              />
            </div>

            {/* Order Index */}
            <div>
              <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-2">
                Thứ Tự Bài Học
              </label>
              <input
                type="number"
                id="orderIndex"
                name="orderIndex"
                value={formData.orderIndex}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Số thứ tự của bài học trong khóa học (1, 2, 3...)
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Nội Dung Bài Học <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Nhập nội dung bài học..."
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none font-mono text-sm"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Hỗ trợ Markdown để format nội dung
              </p>
            </div>

            {/* Markdown Tips */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">💡 Markdown Tips:</h3>
              <div className="text-sm text-green-800 grid grid-cols-2 gap-2">
                <p><code className="bg-green-100 px-1 rounded"># Heading</code> - Tiêu đề</p>
                <p><code className="bg-green-100 px-1 rounded">**bold**</code> - Chữ đậm</p>
                <p><code className="bg-green-100 px-1 rounded">*italic*</code> - Chữ nghiêng</p>
                <p><code className="bg-green-100 px-1 rounded">```code```</code> - Code block</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(`/lessons/${lessonId}`)}
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

export default EditLessonPage;
