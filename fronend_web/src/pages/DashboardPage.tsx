import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, Trophy, TrendingUp, Clock, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { courseService } from '../services/courseService';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatService.getSessions,
  });

  const stats = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      label: 'Enrolled Courses',
      value: courses.length,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      label: 'Chat Sessions',
      value: sessions.length,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      label: 'Quizzes Completed',
      value: 0,
      color: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      label: 'Learning Streak',
      value: '5 days',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  const recentCourses = courses.slice(0, 3);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {user?.fullName}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Ready to continue your learning journey?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="card"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white mb-4`}>
                {stat.icon}
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Courses</h2>
              <Link to="/courses" className="text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {recentCourses.length > 0 ? (
                recentCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Link to={`/courses/${course.id}`} className="card flex items-center space-x-4 hover:shadow-xl transition-shadow">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {course.title.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-1">{course.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="card text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No courses yet</p>
                  <Link to="/courses" className="btn-primary inline-block">
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link to="/chat" className="card hover:shadow-xl transition-shadow block">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">AI Chat</h3>
                    <p className="text-sm text-gray-600">Ask anything</p>
                  </div>
                </div>
              </Link>

              <Link to="/courses" className="card hover:shadow-xl transition-shadow block">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">Browse Courses</h3>
                    <p className="text-sm text-gray-600">Explore content</p>
                  </div>
                </div>
              </Link>

              <div className="card bg-gradient-to-br from-primary-500 to-purple-500 text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <Award className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold">Daily Goal</h3>
                    <p className="text-sm opacity-90">Keep learning!</p>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2 w-3/4"></div>
                </div>
                <p className="text-sm mt-2 opacity-90">75% complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
