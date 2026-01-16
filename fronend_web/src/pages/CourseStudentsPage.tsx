import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Trash2, TrendingUp, Clock, BookOpen, ArrowLeft } from 'lucide-react';
import { teacherService } from '../services/teacherService';
import type { CourseStudentManagement, EnrolledStudent } from '../types';

const CourseStudentsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<CourseStudentManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseStudents();
    }
  }, [courseId]);

  const loadCourseStudents = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getCourseStudents(Number(courseId));
      setCourseData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa sinh viên này khỏi khóa học?')) {
      return;
    }

    try {
      setRemovingStudentId(studentId);
      await teacherService.removeStudent(Number(courseId), studentId);
      await loadCourseStudents(); // Reload data
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa sinh viên');
    } finally {
      setRemovingStudentId(null);
    }
  };

  const formatTime = (seconds: number = 0): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Chưa truy cập';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Không tìm thấy khóa học'}</p>
          <button
            onClick={() => navigate('/courses')}
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{courseData.courseTitle}</h1>
          <p className="text-gray-600 mb-4">{courseData.courseDescription}</p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-700">
                <span className="font-semibold">{courseData.totalStudents}</span> sinh viên
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">
                <span className="font-semibold">{courseData.totalLessons}</span> bài học
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách sinh viên</h2>
        </div>

        {courseData.students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Chưa có sinh viên nào đăng ký khóa học này</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sinh viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiến độ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đăng ký
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truy cập cuối
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseData.students.map((student) => (
                  <tr key={student.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.avatarUrl ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={student.avatarUrl}
                              alt={student.fullName || student.username}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {(student.fullName || student.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.fullName || student.username}
                          </div>
                          <div className="text-sm text-gray-500">@{student.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.progressPercentage?.toFixed(1) || '0'}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.completedLessons || 0}/{student.totalLessons || 0} bài
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-900">
                          {formatTime(student.totalTimeSpent)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(student.enrolledAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(student.lastAccessedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveStudent(student.userId)}
                        disabled={removingStudentId === student.userId}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa sinh viên"
                      >
                        {removingStudentId === student.userId ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStudentsPage;
