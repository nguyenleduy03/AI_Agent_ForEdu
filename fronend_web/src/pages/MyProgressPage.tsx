import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressService } from '../services/progressService';
import { BookOpen, TrendingUp, Clock, CheckCircle, PlayCircle } from 'lucide-react';
import type { CourseProgress } from '../types';

const MyProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await progressService.getMyCourseProgress();
      setCourseProgress(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải tiến độ học tập');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number = 0): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-green-500';
    if (percentage >= 20) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getProgressText = (percentage: number): string => {
    if (percentage >= 100) return 'Hoàn thành';
    if (percentage >= 80) return 'Sắp xong';
    if (percentage >= 50) return 'Đang học';
    if (percentage > 0) return 'Mới bắt đầu';
    return 'Chưa bắt đầu';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tiến độ học tập của tôi</h1>
        <p className="text-gray-600">Theo dõi tiến độ học tập của bạn trong các khóa học</p>
      </div>

      {/* Summary Stats */}
      {courseProgress.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Tổng khóa học</p>
                <p className="text-2xl font-bold text-gray-900">{courseProgress.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courseProgress.filter(c => Number(c.progressPercentage) >= 100).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Đang học</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courseProgress.filter(c => Number(c.progressPercentage) > 0 && Number(c.progressPercentage) < 100).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tổng thời gian</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(courseProgress.reduce((sum, c) => sum + (c.totalTimeSpent || 0), 0) / 3600)}h
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Progress List */}
      {courseProgress.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có khóa học nào</h3>
          <p className="text-gray-600 mb-6">Hãy đăng ký một khóa học để bắt đầu học!</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Khám phá khóa học
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseProgress.map((progress) => (
            <div
              key={progress.courseId}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/courses/${progress.courseId}`)}
            >
              {/* Progress Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <h3 className="text-xl font-semibold mb-2">{progress.courseTitle}</h3>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-lg font-bold">{Number(progress.progressPercentage).toFixed(1)}%</span>
                  <span className="text-sm opacity-90">- {getProgressText(Number(progress.progressPercentage))}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pt-4">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all ${getProgressColor(Number(progress.progressPercentage))}`}
                    style={{ width: `${Math.min(100, Number(progress.progressPercentage))}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">Bài học</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {progress.completedLessons}/{progress.totalLessons}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Thời gian học</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatTime(progress.totalTimeSpent)}
                  </span>
                </div>

                {progress.lastAccessedAt && (
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    Truy cập: {new Date(progress.lastAccessedAt).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="px-6 pb-6">
                <button
                  className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/courses/${progress.courseId}`);
                  }}
                >
                  {Number(progress.progressPercentage) >= 100 ? 'Xem lại khóa học' : 'Tiếp tục học'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProgressPage;
