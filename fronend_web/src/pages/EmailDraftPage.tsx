import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  user_id?: number;
}

const EmailDraftPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get draft data from URL params or localStorage
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Try to get draft from URL params first
    const toParam = searchParams.get('to');
    const subjectParam = searchParams.get('subject');
    const bodyParam = searchParams.get('body');
    
    if (toParam && subjectParam && bodyParam) {
      setTo(decodeURIComponent(toParam));
      setSubject(decodeURIComponent(subjectParam));
      setBody(decodeURIComponent(bodyParam));
    } else {
      // Try to get from localStorage
      const draftStr = localStorage.getItem('emailDraft');
      if (draftStr) {
        try {
          const draft: EmailDraft = JSON.parse(draftStr);
          setTo(draft.to);
          setSubject(draft.subject);
          setBody(draft.body);
          setUserId(draft.user_id || null);
          // Clear after loading
          localStorage.removeItem('emailDraft');
        } catch (e) {
          console.error('Failed to parse email draft:', e);
          toast.error('Không thể tải email draft');
          navigate('/chat');
        }
      } else {
        toast.error('Không tìm thấy email draft');
        navigate('/chat');
      }
    }
    
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, [searchParams, navigate]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to || !subject || !body) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    try {
      setSending(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Vui lòng đăng nhập lại!');
        navigate('/login');
        return;
      }
      
      if (!userId) {
        toast.error('Không xác định được người dùng. Vui lòng đăng nhập lại!');
        navigate('/login');
        return;
      }

      console.log('📧 Sending email:', { to, subject, body: body.substring(0, 50) + '...', user_id: userId });

      const response = await fetch('http://localhost:8000/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          user_id: userId,
        }),
      });

      console.log('📨 Response status:', response.status);
      const data = await response.json();
      console.log('📨 Response data:', data);

      if (response.ok && data.success) {
        toast.success('✅ Email đã được gửi thành công!', { duration: 3000 });
        // Wait a bit then navigate back
        setTimeout(() => {
          navigate('/chat');
        }, 1500);
      } else if (response.status === 401) {
        if (data.detail?.includes('Google Account')) {
          toast.error('⚠️ Cần kết nối Google Account trong Settings');
        } else {
          toast.error('⚠️ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
          navigate('/login');
        }
      } else {
        toast.error(data.detail || 'Không thể gửi email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Bạn có chắc muốn hủy? Email draft sẽ bị mất.')) {
      navigate('/chat');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại Chat</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-4xl">📧</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Draft</h1>
              <p className="text-sm text-gray-600">Chỉnh sửa và gửi email của bạn</p>
            </div>
          </div>
        </div>

        {/* Email Form Card */}
        <div className="card">
          <form onSubmit={handleSend} className="space-y-6">
            {/* To Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Người nhận
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all text-lg"
                placeholder="email@example.com"
                required
              />
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📌 Chủ đề
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all text-lg"
                placeholder="Tiêu đề email"
                required
              />
            </div>

            {/* Body Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📄 Nội dung
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all text-lg resize-none font-sans"
                placeholder="Nội dung email..."
                required
              />
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium">
                    <strong>Mẹo:</strong> Bạn có thể chỉnh sửa mọi trường trước khi gửi.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Email sẽ được gửi qua tài khoản Gmail đã kết nối của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 
                         font-semibold rounded-lg transition-colors flex items-center justify-center gap-2
                         text-lg"
                disabled={sending}
              >
                <X className="w-5 h-5" />
                Hủy
              </button>
              
              <button
                type="submit"
                disabled={sending || !to || !subject || !body}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-500 to-purple-500 
                         hover:from-primary-600 hover:to-purple-600 
                         disabled:from-gray-400 disabled:to-gray-400
                         text-white font-semibold rounded-lg transition-all
                         flex items-center justify-center gap-2 text-lg
                         shadow-lg hover:shadow-xl"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Gửi Email
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        <div className="mt-6 card bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👁️</span>
            Xem trước
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Từ:</span>
              <span className="ml-2 text-gray-600">Tài khoản Gmail của bạn</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Đến:</span>
              <span className="ml-2 text-gray-600">{to || '(chưa nhập)'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Chủ đề:</span>
              <span className="ml-2 text-gray-600">{subject || '(chưa nhập)'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Nội dung:</span>
              <div className="ml-2 mt-2 p-3 bg-white rounded border border-gray-200 whitespace-pre-wrap text-gray-600">
                {body || '(chưa nhập)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmailDraftPage;
