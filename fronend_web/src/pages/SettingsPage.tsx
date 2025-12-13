import { useState, useEffect } from 'react';
import { School, Key, RefreshCw, Save, Trash2, CheckCircle, AlertCircle, Plus, Edit2, Eye, EyeOff, Globe, Film, Users, Briefcase, DollarSign, Heart, Cloud } from 'lucide-react';
import Layout from '../components/Layout';
import { springApi } from '../services/api';
import toast from 'react-hot-toast';
import GoogleConnectButton from '../components/GoogleConnectButton';
import { useAuthStore } from '../store/authStore';

interface Credential {
  id: number;
  serviceName: string;
  serviceUrl?: string;
  serviceType: 'WEB' | 'API' | 'APP' | 'OTHER';
  username: string;
  password: string;
  purpose: string;
  description?: string;
  category: 'EDUCATION' | 'ENTERTAINMENT' | 'SOCIAL' | 'WORK' | 'FINANCE' | 'HEALTH' | 'OTHER';
  tags?: string[];
  label?: string;
  isActive: boolean;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
}

interface CredentialFormData {
  serviceName: string;
  serviceUrl: string;
  serviceType: 'WEB' | 'API' | 'APP' | 'OTHER';
  username: string;
  password: string;
  purpose: string;
  description: string;
  category: 'EDUCATION' | 'ENTERTAINMENT' | 'SOCIAL' | 'WORK' | 'FINANCE' | 'HEALTH' | 'OTHER';
  tags: string;
  label: string;
}

const CATEGORY_ICONS = {
  EDUCATION: School,
  ENTERTAINMENT: Film,
  SOCIAL: Users,
  WORK: Briefcase,
  FINANCE: DollarSign,
  HEALTH: Heart,
  OTHER: Globe
};

const CATEGORY_COLORS = {
  EDUCATION: 'bg-blue-100 text-blue-800 border-blue-200',
  ENTERTAINMENT: 'bg-purple-100 text-purple-800 border-purple-200',
  SOCIAL: 'bg-green-100 text-green-800 border-green-200',
  WORK: 'bg-orange-100 text-orange-800 border-orange-200',
  FINANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HEALTH: 'bg-red-100 text-red-800 border-red-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200'
};

const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const [formData, setFormData] = useState<CredentialFormData>({
    serviceName: '',
    serviceUrl: '',
    serviceType: 'WEB',
    username: '',
    password: '',
    purpose: '',
    description: '',
    category: 'OTHER',
    tags: '',
    label: ''
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await springApi.get('/api/credentials?active=true');
      setCredentials(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load credentials:', error);
        toast.error('Không thể tải danh sách credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceName || !formData.username || !formData.password || !formData.purpose) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }

    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (editingId) {
        await springApi.put(`/api/credentials/${editingId}`, payload);
        toast.success('✅ Đã cập nhật credential!');
      } else {
        await springApi.post('/api/credentials', payload);
        toast.success('✅ Đã thêm credential mới!');
      }
      
      loadCredentials();
      resetForm();
    } catch (error) {
      toast.error('❌ Không thể lưu credential!');
      console.error(error);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await springApi.get(`/api/credentials/${id}?decrypt=true`);
      const cred = response.data;
      
      setFormData({
        serviceName: cred.serviceName,
        serviceUrl: cred.serviceUrl || '',
        serviceType: cred.serviceType,
        username: cred.username,
        password: cred.password,
        purpose: cred.purpose,
        description: cred.description || '',
        category: cred.category,
        tags: cred.tags?.join(', ') || '',
        label: cred.label || ''
      });
      
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      toast.error('❌ Không thể tải credential!');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa credential này?')) {
      return;
    }

    try {
      await springApi.delete(`/api/credentials/${id}`);
      toast.success('✅ Đã xóa credential!');
      loadCredentials();
    } catch (error) {
      toast.error('❌ Không thể xóa credential!');
      console.error(error);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      serviceUrl: '',
      serviceType: 'WEB',
      username: '',
      password: '',
      purpose: '',
      description: '',
      category: 'OTHER',
      tags: '',
      label: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredCredentials = selectedCategory === 'ALL' 
    ? credentials 
    : credentials.filter(c => c.category === selectedCategory);

  const groupedCredentials = filteredCredentials.reduce((acc, cred) => {
    if (!acc[cred.category]) {
      acc[cred.category] = [];
    }
    acc[cred.category].push(cred);
    return acc;
  }, {} as Record<string, Credential[]>);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cài Đặt</h1>
          <p className="text-gray-600">
            Quản lý tài khoản và tích hợp dịch vụ
          </p>
        </div>

        {/* Google Cloud Integration Section */}
        <div className="card mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Cloud className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Google Cloud Integration</h2>
              <p className="text-gray-600 text-sm">
                Kết nối tài khoản Google để sử dụng các API miễn phí trong chatbox
              </p>
            </div>
          </div>
          
          {user && (
            <GoogleConnectButton 
              userId={user.id}
              onConnectionChange={(connected) => {
                if (connected) {
                  toast.success('🎉 Đã kết nối tài khoản Google!');
                } else {
                  toast('Đã ngắt kết nối tài khoản Google');
                }
              }}
            />
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💬 Sử dụng trong Chat:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Dịch thuật:</strong> "Dịch sang tiếng Anh: Xin chào"</li>
              <li>• <strong>Phân tích cảm xúc:</strong> "Phân tích cảm xúc: Tôi rất vui!"</li>
              <li>• <strong>Nhận diện ảnh:</strong> "Phân tích ảnh này [URL]"</li>
              <li>• <strong>Text-to-Speech:</strong> "Đọc cho tôi: Hello world"</li>
            </ul>
          </div>
        </div>

        {/* Credentials Management Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Quản Lý Credentials</h2>
            <p className="text-gray-600 mt-1">
              Lưu trữ và quản lý tài khoản cho các dịch vụ khác nhau
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm Credential</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả ({credentials.length})
          </button>
          {Object.keys(CATEGORY_ICONS).map(category => {
            const count = credentials.filter(c => c.category === category).length;
            if (count === 0) return null;
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Chỉnh Sửa Credential' : 'Thêm Credential Mới'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tên Dịch Vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.serviceName}
                    onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                    placeholder="school_portal, netflix, facebook..."
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL Dịch Vụ
                  </label>
                  <input
                    type="url"
                    value={formData.serviceUrl}
                    onChange={(e) => setFormData({...formData, serviceUrl: e.target.value})}
                    placeholder="https://example.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Tên đăng nhập"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Mật khẩu"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Danh Mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="input-field"
                    required
                  >
                    <option value="EDUCATION">Giáo Dục</option>
                    <option value="ENTERTAINMENT">Giải Trí</option>
                    <option value="SOCIAL">Mạng Xã Hội</option>
                    <option value="WORK">Công Việc</option>
                    <option value="FINANCE">Tài Chính</option>
                    <option value="HEALTH">Sức Khỏe</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Loại Dịch Vụ
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({...formData, serviceType: e.target.value as any})}
                    className="input-field"
                  >
                    <option value="WEB">Website</option>
                    <option value="API">API</option>
                    <option value="APP">Application</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mục Đích Sử Dụng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="Xem thời khóa biểu, xem phim, đăng bài..."
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI sẽ sử dụng thông tin này để tự động chọn credential phù hợp
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô Tả Chi Tiết
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả chi tiết về cách sử dụng credential này..."
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="school, schedule, student"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nhãn
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                    placeholder="Tài khoản chính, Tài khoản phụ..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">🔒 Bảo mật</p>
                    <p>
                      Mật khẩu được mã hóa AES-256 trước khi lưu. AI Agent có thể tự động chọn và sử dụng credential dựa trên mục đích.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex items-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>{editingId ? 'Cập Nhật' : 'Lưu Credential'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Credentials List */}
        {credentials.length === 0 ? (
          <div className="card text-center py-12">
            <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Chưa có credential nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thêm credential đầu tiên để AI Agent có thể tự động đăng nhập các dịch vụ cho bạn
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm Credential</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCredentials).map(([category, creds]) => {
              const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
              const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
              
              return (
                <div key={category}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Icon className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-bold">{category}</h2>
                    <span className="text-sm text-gray-500">({creds.length})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {creds.map(cred => (
                      <div key={cred.id} className="card hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-bold text-lg">{cred.serviceName}</h3>
                              {cred.label && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  {cred.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{cred.purpose}</p>
                          </div>
                          
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
                            {cred.category}
                          </span>
                        </div>

                        {cred.serviceUrl && (
                          <p className="text-xs text-gray-500 mb-2 truncate">
                            🔗 {cred.serviceUrl}
                          </p>
                        )}

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-600">Username:</span>
                            <span className="font-mono">{cred.username}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-600">Password:</span>
                            <span className="font-mono">
                              {showPassword[cred.id] ? cred.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {showPassword[cred.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {cred.tags && cred.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {cred.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            <p>Sử dụng: {cred.usageCount} lần</p>
                            {cred.lastUsedAt && (
                              <p>Lần cuối: {new Date(cred.lastUsedAt).toLocaleDateString('vi-VN')}</p>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(cred.id)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cred.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="card mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-lg font-bold mb-4">🤖 AI Agent Tự Động</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Semantic Search:</strong> AI hiểu ngôn ngữ tự nhiên. Ví dụ:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>"Tôi muốn xem lịch học" → Tự động chọn credential trường</li>
              <li>"Xem phim Netflix" → Tự động chọn credential Netflix</li>
              <li>"Đăng bài lên Facebook" → Tự động chọn credential Facebook</li>
            </ul>
            <p className="text-xs text-gray-600 mt-3">
              💡 Mẹo: Viết "Mục đích sử dụng" rõ ràng để AI chọn đúng credential!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
