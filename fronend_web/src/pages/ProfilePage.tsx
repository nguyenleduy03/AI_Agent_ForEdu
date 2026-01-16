import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Edit2, Save, X, Award, BookOpen, Trophy, TrendingUp, Clock, Target, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import AvatarUpload from '../components/AvatarUpload';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(formData);
      updateUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
    });
    setEditing(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 mb-8 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Profile Avatar with Upload */}
            <AvatarUpload 
              currentAvatarUrl={user?.avatarUrl}
              size="lg"
              fallbackInitial={user?.fullName?.charAt(0)}
              onAvatarChange={(newUrl) => {
                updateUser({ ...user!, avatarUrl: newUrl });
              }}
            />

            {/* Profile Info */}
            <div className="flex-1 text-white text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{user?.fullName}</h1>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold">{user?.role}</span>
                </div>
              </div>
              <p className="text-lg opacity-90 mb-4">@{user?.username}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-75" />
                  <span className="opacity-90">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-75" />
                  <span className="opacity-90">
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                <Edit2 className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">0</div>
            <p className="text-gray-600 text-sm font-medium">Courses Completed</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">0</div>
            <p className="text-gray-600 text-sm font-medium">Achievements</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">0h</div>
            <p className="text-gray-600 text-sm font-medium">Hours Learned</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-7 h-7 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-1">0</div>
            <p className="text-gray-600 text-sm font-medium">Day Streak</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Details Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Profile Information</h2>
                <p className="text-gray-600 text-sm">Manage your personal details</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-4 h-4 text-green-600" />
                  <span>Full Name</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <p className="text-gray-900 font-medium">{user?.fullName}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span>Email Address</span>
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-4 h-4 text-green-600" />
                  <span>Username</span>
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-gray-900 font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Account Role</span>
                </label>
                <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">{user?.role}</span>
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Achievements Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Learning Goals */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Daily Goal</h3>
                  <p className="text-sm opacity-90">Keep the momentum!</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="opacity-90">Progress Today</span>
                  <span className="font-bold">0%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div className="bg-white rounded-full h-full w-0"></div>
                </div>
              </div>
              <p className="text-sm opacity-90">Start learning to make progress!</p>
            </div>

            {/* Recent Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg">Achievements</h3>
              </div>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-2">No achievements yet</p>
                <p className="text-gray-500 text-xs">Complete courses to earn badges!</p>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-lg">Activity</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="text-sm font-bold text-gray-900">0 lessons</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="text-sm font-bold text-gray-900">0 lessons</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Time</span>
                  <span className="text-sm font-bold text-gray-900">0 hours</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
