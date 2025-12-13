import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Play, ArrowLeft, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { useAuthStore } from '../store/authStore';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || '0');
  const user = useAuthStore((state) => state.user);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourse(courseId),
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => courseService.getLessonsByCourse(courseId),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', courseId],
    queryFn: () => courseService.getMaterialsByCourse(courseId),
  });

  if (courseLoading || lessonsLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link to="/courses" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Courses
        </Link>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-start space-x-6">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <BookOpen className="w-16 h-16" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{course?.title}</h1>
              <p className="text-gray-600 mb-4">{course?.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>Teacher: {course?.teacherName || 'Unknown'}</span>
                <span>•</span>
                <span>{lessons.length} Lessons</span>
                <span>•</span>
                <span>{materials.length} Materials</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lessons */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Course Lessons</h2>
            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <Link 
                to={`/courses/${courseId}/lessons/create`}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Lesson</span>
              </Link>
            )}
          </div>
          {lessons.length > 0 ? (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 10 }}
                >
                  <Link to={`/lessons/${lesson.id}`} className="card flex items-center space-x-4 hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{lesson.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{lesson.content.substring(0, 100)}...</p>
                    </div>
                    <Play className="w-6 h-6 text-primary-600" />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No lessons available yet</p>
            </div>
          )}
        </div>

        {/* Materials */}
        {materials.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Course Materials</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {materials.map((material, index) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card flex items-center space-x-4 hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{material.title}</h3>
                    <p className="text-sm text-gray-500">{material.fileType}</p>
                  </div>
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
