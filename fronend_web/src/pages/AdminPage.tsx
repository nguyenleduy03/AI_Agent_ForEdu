import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, Trash2, Search, Filter, GraduationCap, BookOpen, Crown, Mail, Calendar,
  AlertCircle, CheckCircle, Database, FileText, Plus, RefreshCw, Brain, Settings,
  BarChart3, Zap, Upload, X, Eye, Edit2, Save, ChevronDown, ChevronRight, Loader2,
  MessageSquare, Clock, Tag, Folder, Server, HardDrive, Activity, TrendingUp
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { springApi, fastApi } from '../services/api';
import toast from 'react-hot-toast';
import type { User } from '../types';

type TabType = 'users' | 'courses' | 'rag' | 'system' | 'analytics';

interface UserStats {
  total: number;
  admins: number;
  teachers: number;
  students: number;
  users: number;
}

interface RAGDocument {
  id: string;
  document: string;
  metadata: {
    category?: string;
    type?: string;
    tags?: string[];
    question?: string;
  };
}

interface RAGStats {
  total_documents: number;
  categories: Record<string, number>;
  status: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  createdBy: {
    id: number;
    username: string;
    fullName: string;
  };
  enrollmentCount: number;
  lessonCount: number;
  createdAt: string;
}

interface CourseStats {
  total: number;
  public: number;
  private: number;
  withLessons: number;
  withoutLessons: number;
}

const AdminPage = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, admins: 0, teachers: 0, students: 0, users: 0 });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Course Management State
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchCourseQuery, setSearchCourseQuery] = useState('');
  const [courseStatusFilter, setcourseStatusFilter] = useState<string>('ALL');
  const [courseStats, setCourseStats] = useState<CourseStats>({ total: 0, public: 0, private: 0, withLessons: 0, withoutLessons: 0 });

  // RAG Management State
  const [ragDocuments, setRagDocuments] = useState<RAGDocument[]>([]);
  const [ragStats, setRagStats] = useState<RAGStats | null>(null);
  const [loadingRag, setLoadingRag] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newTags, setNewTags] = useState('');
  const [searchRagQuery, setSearchRagQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bulkDocuments, setBulkDocuments] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // System State
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Check admin access
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này!');
      window.location.href = '/dashboard';
    }
  }, [currentUser]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'courses') loadCourses();
    else if (activeTab === 'rag') { loadRagStats(); loadRagDocuments(); }
    else if (activeTab === 'system') loadSystemHealth();
  }, [activeTab]);

  // Filter users
  useEffect(() => {
    let filtered = users;
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (roleFilter !== 'ALL') filtered = filtered.filter(u => u.role === roleFilter);
    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  // Filter courses
  useEffect(() => {
    let filtered = courses;
    if (searchCourseQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchCourseQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchCourseQuery.toLowerCase()) ||
        c.createdBy.username.toLowerCase().includes(searchCourseQuery.toLowerCase())
      );
    }
    if (courseStatusFilter === 'PUBLIC') filtered = filtered.filter(c => c.isPublic);
    else if (courseStatusFilter === 'PRIVATE') filtered = filtered.filter(c => !c.isPublic);
    else if (courseStatusFilter === 'WITH_LESSONS') filtered = filtered.filter(c => c.lessonCount > 0);
    else if (courseStatusFilter === 'WITHOUT_LESSONS') filtered = filtered.filter(c => c.lessonCount === 0);
    setFilteredCourses(filtered);
  }, [courses, searchCourseQuery, courseStatusFilter]);

  // ==================== USER MANAGEMENT ====================
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await springApi.get('/api/admin/users');
      const usersData = response.data;
      setUsers(usersData);
      setFilteredUsers(usersData);
      setUserStats({
        total: usersData.length,
        admins: usersData.filter((u: User) => u.role === 'ADMIN').length,
        teachers: usersData.filter((u: User) => u.role === 'TEACHER').length,
        students: usersData.filter((u: User) => u.role === 'STUDENT').length,
        users: usersData.filter((u: User) => u.role === 'USER').length,
      });
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (userId === currentUser?.id) { toast.error('Bạn không thể xóa chính mình!'); return; }
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`)) return;
    try {
      await springApi.delete(`/api/admin/users/${userId}`);
      toast.success(`Đã xóa người dùng "${username}"`);
      loadUsers();
    } catch (error) {
      toast.error('Không thể xóa người dùng');
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      await springApi.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('Đã cập nhật role');
      loadUsers();
      setEditingUser(null);
    } catch (error) {
      toast.error('Không thể cập nhật role');
    }
  };

  // ==================== COURSE MANAGEMENT ====================
  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await springApi.get('/api/courses/internal/all');
      const coursesData = response.data;
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      setCourseStats({
        total: coursesData.length,
        public: coursesData.filter((c: Course) => c.isPublic).length,
        private: coursesData.filter((c: Course) => !c.isPublic).length,
        withLessons: coursesData.filter((c: Course) => c.lessonCount > 0).length,
        withoutLessons: coursesData.filter((c: Course) => c.lessonCount === 0).length,
      });
    } catch (error) {
      toast.error('Không thể tải danh sách khóa học');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleDeleteCourse = async (courseId: number, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa khóa học "${title}"?\n\nLưu ý: Tất cả bài học, quiz, materials sẽ bị xóa theo!`)) return;
    try {
      await springApi.delete(`/api/courses/${courseId}`);
      toast.success(`Đã xóa khóa học "${title}"`);
      loadCourses();
    } catch (error) {
      toast.error('Không thể xóa khóa học');
    }
  };

  const handleToggleCoursePublic = async (courseId: number, currentStatus: boolean) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;
      await springApi.put(`/api/courses/${courseId}`, {
        title: course.title,
        description: course.description,
        isPublic: !currentStatus
      });
      toast.success(`Đã ${!currentStatus ? 'công khai' : 'ẩn'} khóa học`);
      loadCourses();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  // ==================== RAG MANAGEMENT ====================
  const loadRagStats = async () => {
    try {
      const response = await fastApi.get('/api/rag/stats');
      setRagStats(response.data);
    } catch (error) {
      console.error('Error loading RAG stats:', error);
    }
  };

  const loadRagDocuments = async () => {
    try {
      setLoadingRag(true);
      const response = await fastApi.get('/api/documents');
      const docs: RAGDocument[] = response.data.documents?.map((doc: string, idx: number) => ({
        id: response.data.ids?.[idx] || `doc_${idx}`,
        document: doc,
        metadata: response.data.metadatas?.[idx] || {}
      })) || [];
      setRagDocuments(docs);
    } catch (error) {
      console.error('Error loading RAG documents:', error);
    } finally {
      setLoadingRag(false);
    }
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.trim()) { toast.error('Vui lòng nhập nội dung'); return; }
    try {
      await fastApi.post('/api/rag/prompt', {
        prompt: newPrompt,
        category: newCategory,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Đã thêm kiến thức vào RAG');
      setNewPrompt(''); setNewTags(''); setShowAddForm(false);
      loadRagStats(); loadRagDocuments();
    } catch (error) {
      toast.error('Không thể thêm kiến thức');
    }
  };

  const handleBulkAdd = async () => {
    const docs = bulkDocuments.split('\n').filter(d => d.trim());
    if (docs.length === 0) { toast.error('Vui lòng nhập ít nhất 1 document'); return; }
    try {
      await fastApi.post('/api/documents/add', {
        documents: docs,
        metadatas: docs.map(() => ({ category: newCategory, type: 'bulk_import' }))
      });
      toast.success(`Đã thêm ${docs.length} documents`);
      setBulkDocuments(''); setShowBulkAdd(false);
      loadRagStats(); loadRagDocuments();
    } catch (error) {
      toast.error('Không thể thêm documents');
    }
  };

  const handleSearchRag = async () => {
    if (!searchRagQuery.trim()) return;
    try {
      const response = await fastApi.post('/api/documents/search', { query: searchRagQuery, n_results: 10 });
      setSearchResults(response.data.results || []);
    } catch (error) {
      toast.error('Lỗi tìm kiếm');
    }
  };

  const handleDeleteAllDocuments = async () => {
    if (!confirm('Bạn có chắc muốn XÓA TẤT CẢ documents trong RAG? Hành động này không thể hoàn tác!')) return;
    try {
      await fastApi.delete('/api/documents');
      toast.success('Đã xóa tất cả documents');
      loadRagStats(); loadRagDocuments();
    } catch (error) {
      toast.error('Không thể xóa documents');
    }
  };

  // ==================== SYSTEM HEALTH ====================
  const loadSystemHealth = async () => {
    try {
      const [springHealth, pythonHealth] = await Promise.all([
        springApi.get('/actuator/health').catch(() => ({ data: { status: 'DOWN' } })),
        fastApi.get('/').catch(() => ({ data: { status: 'DOWN' } }))
      ]);
      setSystemHealth({
        spring: springHealth.data,
        python: pythonHealth.data
      });
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  // ==================== HELPERS ====================
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'TEACHER': return <GraduationCap className="w-4 h-4 text-green-500" />;
      case 'STUDENT': return <BookOpen className="w-4 h-4 text-green-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'TEACHER': return 'bg-green-100 text-green-800 border-blue-300';
      case 'STUDENT': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

  const tabs = [
    { id: 'users' as TabType, label: 'Quản lý Users', icon: Users, color: 'from-blue-500 to-blue-600' },
    { id: 'courses' as TabType, label: 'Quản lý Khóa học', icon: BookOpen, color: 'from-indigo-500 to-indigo-600' },
    { id: 'rag' as TabType, label: 'Quản lý RAG', icon: Brain, color: 'from-purple-500 to-purple-600' },
    { id: 'system' as TabType, label: 'Hệ thống', icon: Server, color: 'from-green-500 to-green-600' },
    { id: 'analytics' as TabType, label: 'Thống kê', icon: BarChart3, color: 'from-orange-500 to-orange-600' },
  ];

  if (!currentUser || currentUser.role !== 'ADMIN') return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm">Quản lý toàn bộ hệ thống</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ==================== USERS TAB ==================== */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Tổng Users', value: userStats.total, icon: Users, color: 'from-purple-500 to-purple-600' },
                { label: 'Admins', value: userStats.admins, icon: Crown, color: 'from-yellow-500 to-yellow-600' },
                { label: 'Teachers', value: userStats.teachers, icon: GraduationCap, color: 'from-blue-500 to-blue-600' },
                { label: 'Students', value: userStats.students, icon: BookOpen, color: 'from-green-500 to-green-600' },
                { label: 'Users', value: userStats.users, icon: Users, color: 'from-gray-500 to-gray-600' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white`}>
                  <stat.icon className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="ALL">Tất cả roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                  <option value="USER">User</option>
                </select>
                <button onClick={loadUsers} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Google</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{user.username}</div>
                                <div className="text-xs text-gray-500">{user.fullName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                              {getRoleIcon(user.role)} {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3">
                            {user.googleConnected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" /> Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                                <AlertCircle className="w-3 h-3" /> No
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={user.id === currentUser?.id}
                              className={`p-2 rounded-lg transition-colors ${user.id === currentUser?.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">Hiển thị {filteredUsers.length} / {users.length} người dùng</p>
          </motion.div>
        )}

        {/* ==================== COURSES TAB ==================== */}
        {activeTab === 'courses' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Tổng Khóa học', value: courseStats.total, icon: BookOpen, color: 'from-indigo-500 to-indigo-600' },
                { label: 'Public', value: courseStats.public, icon: Eye, color: 'from-green-500 to-green-600' },
                { label: 'Private', value: courseStats.private, icon: Shield, color: 'from-gray-500 to-gray-600' },
                { label: 'Có Bài học', value: courseStats.withLessons, icon: CheckCircle, color: 'from-blue-500 to-blue-600' },
                { label: 'Chưa có Bài học', value: courseStats.withoutLessons, icon: AlertCircle, color: 'from-orange-500 to-orange-600' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white`}>
                  <stat.icon className="w-6 h-6 mb-1 opacity-80" />
                  <p className="text-xs opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khóa học..."
                    value={searchCourseQuery}
                    onChange={(e) => setSearchCourseQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={courseStatusFilter}
                  onChange={(e) => setcourseStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="WITH_LESSONS">Có bài học</option>
                  <option value="WITHOUT_LESSONS">Chưa có bài học</option>
                </select>
                <button onClick={loadCourses} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {loadingCourses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khóa học</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giảng viên</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học viên</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bài học</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCourses.map(course => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">#{course.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {course.thumbnailUrl ? (
                                <img src={course.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold">
                                  {course.title.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="max-w-xs">
                                <div className="font-medium text-gray-900 text-sm truncate">{course.title}</div>
                                <div className="text-xs text-gray-500 truncate">{course.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">{course.createdBy.username}</div>
                            <div className="text-xs text-gray-500">{course.createdBy.fullName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                              <Users className="w-3 h-3" /> {course.enrollmentCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              course.lessonCount > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              <BookOpen className="w-3 h-3" /> {course.lessonCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleCoursePublic(course.id, course.isPublic)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                                course.isPublic
                                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {course.isPublic ? <Eye className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                              {course.isPublic ? 'Public' : 'Private'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(course.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/courses/${course.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                title="Xem khóa học"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteCourse(course.id, course.title)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa khóa học"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">Hiển thị {filteredCourses.length} / {courses.length} khóa học</p>
          </motion.div>
        )}

        {/* ==================== RAG TAB ==================== */}
        {activeTab === 'rag' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* RAG Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <Database className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-90">Tổng Documents</p>
                <p className="text-2xl font-bold">{ragStats?.total_documents || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <Folder className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-90">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(ragStats?.categories || {}).length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <Activity className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-90">Status</p>
                <p className="text-lg font-bold">{ragStats?.status || 'Unknown'}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <Brain className="w-6 h-6 mb-1 opacity-80" />
                <p className="text-xs opacity-90">Vector DB</p>
                <p className="text-lg font-bold">ChromaDB</p>
              </div>
            </div>

            {/* Categories Breakdown */}
            {ragStats?.categories && Object.keys(ragStats.categories).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Phân loại theo Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ragStats.categories).map(([cat, count]) => (
                    <span key={cat} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="w-4 h-4" /> Thêm Kiến thức
              </button>
              <button onClick={() => setShowBulkAdd(!showBulkAdd)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Upload className="w-4 h-4" /> Import hàng loạt
              </button>
              <button onClick={() => { loadRagStats(); loadRagDocuments(); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={handleDeleteAllDocuments} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 ml-auto">
                <Trash2 className="w-4 h-4" /> Xóa tất cả
              </button>
            </div>

            {/* Add Single Prompt Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Thêm kiến thức mới</h3>
                    <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="Nhập nội dung kiến thức cần thêm vào RAG..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-32"
                    />
                    <div className="flex gap-3">
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="general">General</option>
                        <option value="programming">Programming</option>
                        <option value="ai">AI/ML</option>
                        <option value="education">Education</option>
                        <option value="science">Science</option>
                        <option value="business">Business</option>
                      </select>
                      <input
                        type="text"
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        placeholder="Tags (phân cách bằng dấu phẩy)"
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <button onClick={handleAddPrompt} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Lưu
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Add Form */}
            <AnimatePresence>
              {showBulkAdd && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Import hàng loạt</h3>
                    <button onClick={() => setShowBulkAdd(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      value={bulkDocuments}
                      onChange={(e) => setBulkDocuments(e.target.value)}
                      placeholder="Nhập mỗi document trên một dòng..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 h-40 font-mono text-sm"
                    />
                    <div className="flex gap-3">
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
                        <option value="general">General</option>
                        <option value="programming">Programming</option>
                        <option value="ai">AI/ML</option>
                        <option value="education">Education</option>
                      </select>
                      <button onClick={handleBulkAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Import ({bulkDocuments.split('\n').filter(d => d.trim()).length} docs)
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search RAG */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" /> Tìm kiếm Semantic
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchRagQuery}
                  onChange={(e) => setSearchRagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchRag()}
                  placeholder="Nhập câu hỏi để tìm kiếm trong RAG..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button onClick={handleSearchRag} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Tìm kiếm
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-500">Tìm thấy {searchResults.length} kết quả:</p>
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-700 flex-1">{result.document?.substring(0, 200)}...</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                          {((1 - result.distance) * 100).toFixed(1)}% match
                        </span>
                      </div>
                      {result.metadata?.category && (
                        <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{result.metadata.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documents trong RAG ({ragDocuments.length})
                </h3>
              </div>
              {loadingRag ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : ragDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Chưa có documents nào trong RAG</p>
                  <p className="text-sm text-gray-400">Thêm kiến thức để AI có thể trả lời tốt hơn</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {ragDocuments.slice(0, 50).map((doc, idx) => (
                    <div key={doc.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 font-mono mt-1">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-clamp-2">{doc.document}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {doc.metadata?.category && (
                              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">{doc.metadata.category}</span>
                            )}
                            {doc.metadata?.type && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{doc.metadata.type}</span>
                            )}
                            <span className="text-xs text-gray-400">{doc.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {ragDocuments.length > 50 && (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      Hiển thị 50 / {ragDocuments.length} documents
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== SYSTEM TAB ==================== */}
        {activeTab === 'system' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Spring Boot Status */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Server className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Spring Boot API</h3>
                    <p className="text-sm text-gray-500">Backend chính</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      systemHealth?.spring?.status === 'UP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {systemHealth?.spring?.status || 'Checking...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Port</span>
                    <span className="text-sm font-mono text-gray-800">8080</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="text-sm text-gray-800">MySQL</span>
                  </div>
                </div>
              </div>

              {/* Python Service Status */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Python AI Service</h3>
                    <p className="text-sm text-gray-500">AI + RAG Service</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      systemHealth?.python?.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {systemHealth?.python?.status || 'Checking...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Port</span>
                    <span className="text-sm font-mono text-gray-800">8000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vector DB Docs</span>
                    <span className="text-sm text-gray-800">{systemHealth?.python?.vector_db_documents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Version</span>
                    <span className="text-sm text-gray-800">{systemHealth?.python?.version || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Services Overview */}
              <div className="bg-white rounded-xl shadow-sm border p-6 md:col-span-2">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Tổng quan Services
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Authentication', status: 'active', icon: Shield },
                    { name: 'Chat Service', status: 'active', icon: MessageSquare },
                    { name: 'RAG/ChromaDB', status: 'active', icon: Database },
                    { name: 'Google OAuth', status: 'active', icon: Zap },
                  ].map((service, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <service.icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{service.name}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== ANALYTICS TAB ==================== */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid md:grid-cols-3 gap-6">
              {/* User Analytics */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> User Analytics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Admins</span>
                      <span className="font-medium">{userStats.admins}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(userStats.admins / userStats.total) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Teachers</span>
                      <span className="font-medium">{userStats.teachers}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(userStats.teachers / userStats.total) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Students</span>
                      <span className="font-medium">{userStats.students}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(userStats.students / userStats.total) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Regular Users</span>
                      <span className="font-medium">{userStats.users}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-500 rounded-full" style={{ width: `${(userStats.users / userStats.total) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RAG Analytics */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> RAG Analytics
                </h3>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-purple-600">{ragStats?.total_documents || 0}</p>
                    <p className="text-sm text-gray-500">Total Documents</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-lg font-semibold text-purple-700">{Object.keys(ragStats?.categories || {}).length}</p>
                      <p className="text-xs text-purple-600">Categories</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-lg font-semibold text-green-700">768</p>
                      <p className="text-xs text-green-600">Dimensions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-semibold text-gray-800">{userStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">RAG Documents</span>
                    <span className="font-semibold text-gray-800">{ragStats?.total_documents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Google Connected</span>
                    <span className="font-semibold text-gray-800">{users.filter(u => u.googleConnected).length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Embedding Model</span>
                    <span className="font-semibold text-gray-800 text-xs">MiniLM-L12</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPage;
