import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Search, Plus, Lock, Globe, Users, Filter, Grid, List, Star, Clock, TrendingUp, Sparkles, GraduationCap, Edit, Trash2, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';

const CoursesPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const { data: myCourses = [], isLoading: myCoursesLoading, refetch: refetchMyCourses } = useQuery({
    queryKey: ['my-courses'],
    queryFn: courseService.getMyCourses,
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
      refetchMyCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mật khẩu không đúng!');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      toast.success('Đã xóa khóa học');
      refetch();
      refetchMyCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa khóa học');
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayCourses = activeTab === 'all' ? filteredCourses : myCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Gradient Background */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 mb-8 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-sm font-semibold opacity-90">Discover & Learn</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-3">Explore Courses</h1>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl">
                  Find the perfect course to expand your knowledge and skills
                </p>
              </div>
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link 
                  to="/courses/create" 
                  className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Course</span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Tất cả khóa học
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'my'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {isTeacher ? 'Khóa học của tôi' : 'Khóa đã đăng ký'}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses by title or description..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all text-gray-800 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-green-50 border-green-500 text-green-600'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-green-50 border-green-500 text-green-600'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-500" />
              <span><strong>{displayCourses.length}</strong> {activeTab === 'all' ? 'courses found' : isTeacher ? 'khóa học của tôi' : 'khóa đã đăng ký'}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Updated daily</span>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {(isLoading || (activeTab === 'my' && myCoursesLoading)) ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : displayCourses.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {displayCourses.map((course, index) => (
              viewMode === 'grid' ? (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col"
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center group">
                    <BookOpen className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      {course.isPublic ? (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                          <Globe className="w-3.5 h-3.5" />
                          Public
                        </span>
                      ) : (
                        <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                          <Lock className="w-3.5 h-3.5" />
                          Private
                        </span>
                      )}
                    </div>
                    {course.isEnrolled && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Enrolled ✓
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <Link to={`/courses/${course.id}`} className="mb-3">
                      <h3 className="text-xl font-bold mb-2 hover:text-green-600 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">{course.description}</p>
                    
                    {/* Course Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(course.creatorName || 'T').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{course.creatorName || 'Teacher'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{course.enrollmentCount || 0}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {activeTab === 'my' && isTeacher ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/courses/${course.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Quản lý
                        </button>
                        <button
                          onClick={() => navigate(`/courses/${course.id}/students`)}
                          className="px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl hover:bg-green-100 transition-all"
                          title="Xem sinh viên"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="px-4 py-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : activeTab === 'my' ? (
                      <Link
                        to={`/courses/${course.id}`}
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-center transition-all hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Học ngay
                      </Link>
                    ) : user?.role === 'STUDENT' && !course.isEnrolled ? (
                      <button
                        onClick={() => handleEnroll(course)}
                        disabled={enrollingCourseId === course.id}
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {enrollingCourseId === course.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            {course.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            <span>Enroll Now</span>
                          </>
                        )}
                      </button>
                    ) : course.isEnrolled ? (
                      <Link
                        to={`/courses/${course.id}`}
                        className="w-full py-3 px-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl font-semibold text-center hover:bg-green-100 transition-all"
                      >
                        Continue Learning →
                      </Link>
                    ) : null}
                  </div>
                </motion.div>
              ) : (
                /* List View */
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 8 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-32 h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                      {course.isEnrolled && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <Link to={`/courses/${course.id}`}>
                          <h3 className="text-2xl font-bold hover:text-green-600 transition-colors mb-2">
                            {course.title}
                          </h3>
                        </Link>
                        {course.isPublic ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Public
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {(course.creatorName || 'T').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{course.creatorName || 'Teacher'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span><strong>{course.enrollmentCount || 0}</strong> students</span>
                          </div>
                        </div>

                        {activeTab === 'my' && isTeacher ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/courses/${course.id}`)}
                              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Quản lý
                            </button>
                            <button
                              onClick={() => navigate(`/courses/${course.id}/students`)}
                              className="px-4 py-2 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-all"
                              title="Xem sinh viên"
                            >
                              <Users className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(course.id);
                              }}
                              className="px-4 py-2 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ) : activeTab === 'my' ? (
                          <Link
                            to={`/courses/${course.id}`}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Học ngay
                          </Link>
                        ) : user?.role === 'STUDENT' && !course.isEnrolled ? (
                          <button
                            onClick={() => handleEnroll(course)}
                            disabled={enrollingCourseId === course.id}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                          >
                            {enrollingCourseId === course.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                {course.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                <span>Enroll</span>
                              </>
                            )}
                          </button>
                        ) : course.isEnrolled ? (
                          <Link
                            to={`/courses/${course.id}`}
                            className="px-6 py-2 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition-all"
                          >
                            Continue →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {activeTab === 'my' 
                ? (isTeacher ? 'Chưa có khóa học nào' : 'Bạn chưa đăng ký khóa học nào')
                : 'No courses found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'my'
                ? (isTeacher ? 'Hãy tạo khóa học đầu tiên của bạn!' : 'Hãy khám phá và đăng ký các khóa học thú vị!')
                : 'Try adjusting your search or explore all courses'}
            </p>
            {activeTab === 'my' && isTeacher ? (
              <Link
                to="/courses/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Tạo khóa học
              </Link>
            ) : activeTab === 'my' ? (
              <button
                onClick={() => setActiveTab('all')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Khám phá khóa học
              </button>
            ) : (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Private Course</h3>
                <p className="text-sm text-gray-600">{selectedCourse?.title}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              This course requires a password. Please enter the password provided by your instructor to enroll.
            </p>
            <input
              type="password"
              placeholder="Enter course password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEnrollWithPassword()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setSelectedCourse(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                disabled={enrollingCourseId !== null}
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollWithPassword}
                disabled={enrollingCourseId !== null || !passwordInput.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {enrollingCourseId ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  'Enroll Now'
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
