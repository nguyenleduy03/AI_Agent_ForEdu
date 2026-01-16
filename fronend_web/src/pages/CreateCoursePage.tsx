import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Save, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    accessPassword: '',
  });

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

    if (!formData.isPublic && !formData.accessPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu cho khóa học private!');
      return;
    }

    setLoading(true);

    try {
      const newCourse = await courseService.createCourse(formData);
      toast.success('Tạo khóa học thành công!');
      navigate(`/courses/${newCourse.id}`);
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo khóa học!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách khóa học</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tạo Khóa Học Mới</h1>
              <p className="text-gray-600">Điền thông tin để tạo khóa học mới</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
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
                className="input-field"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Tên khóa học nên ngắn gọn, dễ hiểu và thu hút
              </p>
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
                placeholder="Mô tả chi tiết về khóa học: nội dung, mục tiêu, đối tượng học viên..."
                rows={8}
                className="input-field resize-none"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Mô tả chi tiết giúp học viên hiểu rõ hơn về khóa học
              </p>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quyền Truy Cập
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
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
                <label className="flex items-start space-x-3 cursor-pointer">
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
                  Mật Khẩu Truy Cập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accessPassword"
                  name="accessPassword"
                  value={formData.accessPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu cho khóa học private"
                  className="input-field"
                  disabled={loading}
                  required={!formData.isPublic}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Sinh viên cần nhập mật khẩu này để đăng ký khóa học
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">💡 Lưu ý:</h3>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Sau khi tạo khóa học, bạn có thể thêm bài học vào khóa học</li>
                <li>Bạn có thể chỉnh sửa thông tin khóa học sau</li>
                <li>Khóa học sẽ hiển thị ngay trên trang Courses</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Tạo Khóa Học</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">📚 Tips để tạo khóa học tốt:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-1">✅ Tên khóa học:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Rõ ràng, cụ thể</li>
                <li>Bao gồm chủ đề chính</li>
                <li>Dễ tìm kiếm</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">✅ Mô tả:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Nội dung học được gì</li>
                <li>Đối tượng phù hợp</li>
                <li>Yêu cầu tiên quyết (nếu có)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateCoursePage;
