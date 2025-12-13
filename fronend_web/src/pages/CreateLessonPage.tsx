import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Save, Loader, BookOpen } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import type { Course } from '../types';

const CreateLessonPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    orderIndex: 1,
  });

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const [courseData, lessonsData] = await Promise.all([
        courseService.getCourseById(Number(courseId)),
        courseService.getLessonsByCourse(Number(courseId))
      ]);
      
      setCourse(courseData);
      
      // Set order index to next available
      if (lessonsData && lessonsData.length > 0) {
        const maxOrder = Math.max(...lessonsData.map((l) => l.orderIndex || 0));
        setFormData(prev => ({ ...prev, orderIndex: maxOrder + 1 }));
      }
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
      toast.error('Vui lòng nhập tên bài học!');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung bài học!');
      return;
    }

    setLoading(true);

    try {
      await courseService.createLesson(Number(courseId), formData);
      toast.success('Tạo bài học thành công!');
      navigate(`/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo bài học!');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại khóa học</span>
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tạo Bài Học Mới</h1>
              <p className="text-gray-600">Thêm bài học vào khóa học</p>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Khóa học:</p>
              <p className="font-semibold text-gray-900">{course.title}</p>
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
                Tên Bài Học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Chapter 1: Introduction to Python"
                className="input-field"
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
                className="input-field"
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
                placeholder="Nhập nội dung bài học... Hỗ trợ Markdown:

# Heading 1
## Heading 2

**Bold text**
*Italic text*

```python
# Code block
print('Hello World')
```

- List item 1
- List item 2"
                rows={20}
                className="input-field resize-none font-mono text-sm"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Hỗ trợ Markdown để format nội dung
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Markdown Tips:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><code className="bg-blue-100 px-1 rounded"># Heading</code> - Tiêu đề</p>
                <p><code className="bg-blue-100 px-1 rounded">**bold**</code> - Chữ đậm</p>
                <p><code className="bg-blue-100 px-1 rounded">*italic*</code> - Chữ nghiêng</p>
                <p><code className="bg-blue-100 px-1 rounded">```code```</code> - Code block</p>
                <p><code className="bg-blue-100 px-1 rounded">- item</code> - List</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(`/courses/${courseId}`)}
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
                    <span>Tạo Bài Học</span>
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
          <h3 className="font-semibold text-gray-900 mb-3">📝 Tips để tạo bài học tốt:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-1">✅ Cấu trúc:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Bắt đầu với giới thiệu</li>
                <li>Chia nhỏ thành sections</li>
                <li>Kết thúc với tóm tắt</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">✅ Nội dung:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Giải thích rõ ràng</li>
                <li>Có ví dụ minh họa</li>
                <li>Thêm bài tập thực hành</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateLessonPage;
