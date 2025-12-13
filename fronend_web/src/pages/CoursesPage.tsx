import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Search, Plus, Lock, Globe, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';

const CoursesPage = () => {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const handleEnroll = async (course: any) => {
    if (!course.isPublic) {
      setSelectedCourse(course);
      setShowPasswordModal(true);
      return;
    }

    setEnrollingCourseId(course.id);
    try {
      await courseService.enrollCourse(course.id);
      toast.success('Đăng ký khóa học thành công!');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đăng ký khóa học!');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleEnrollWithPassword = async () => {
    if (!selectedCourse || !passwordInput.trim()) {
      toast.error('Vui lòng nhập mật khẩu!');
      return;
    }

    setEnrollingCourseId(selectedCourse.id);
    try {
      await courseService.enrollCourse(selectedCourse.id, passwordInput);
      toast.success('Đăng ký khóa học thành công!');
      setShowPasswordModal(false);
      setPasswordInput('');
      setSelectedCourse(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mật khẩu không đúng!');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">All Courses</h1>
            <p className="text-gray-600">Explore and learn from our comprehensive courses</p>
          </div>
          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <Link to="/courses/create" className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create Course</span>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              className="input-field pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="card h-full flex flex-col hover:shadow-2xl transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg mb-4 flex items-center justify-center text-white relative">
                  <BookOpen className="w-16 h-16" />
                  <div className="absolute top-3 right-3">
                    {course.isPublic ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </span>
                    ) : (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    )}
                  </div>
                </div>
                <Link to={`/courses/${course.id}`}>
                  <h3 className="text-xl font-bold mb-2 hover:text-primary-600">{course.title}</h3>
                </Link>
                <p className="text-gray-600 mb-4 flex-1 line-clamp-3">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{course.creatorName || 'Teacher'}</span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{course.enrollmentCount || 0}</span>
                  </span>
                </div>
                {user?.role === 'STUDENT' && !course.isEnrolled && (
                  <button
                    onClick={() => handleEnroll(course)}
                    disabled={enrollingCourseId === course.id}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {enrollingCourseId === course.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {course.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <span>Đăng Ký</span>
                      </>
                    )}
                  </button>
                )}
                {course.isEnrolled && (
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-center font-medium">
                    ✓ Đã đăng ký
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Khóa Học Private</h3>
                <p className="text-sm text-gray-600">{selectedCourse?.title}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Khóa học này yêu cầu mật khẩu. Vui lòng nhập mật khẩu do giáo viên cung cấp.
            </p>
            <input
              type="password"
              placeholder="Nhập mật khẩu..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEnrollWithPassword()}
              className="input-field mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setSelectedCourse(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={enrollingCourseId !== null}
              >
                Hủy
              </button>
              <button
                onClick={handleEnrollWithPassword}
                disabled={enrollingCourseId !== null}
                className="flex-1 btn-primary"
              >
                {enrollingCourseId ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  'Đăng Ký'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default CoursesPage;
