import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  user_id?: number;
}

interface EmailDraftModalProps {
  draft: EmailDraft;
  userId?: number;
  onClose: () => void;
}

export const EmailDraftModal = ({ draft, userId, onClose }: EmailDraftModalProps) => {
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [sending, setSending] = useState(false);

  const handleSend = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      setSending(true);
      
      const token = localStorage.getItem('token');
      const currentUserId = userId || draft.user_id;
      
      console.log('📧 Sending email from modal - Token:', token ? 'EXISTS' : 'NO TOKEN');
      console.log('📧 User ID:', currentUserId);
      
      if (!token) {
        toast.error('Vui lòng đăng nhập lại!');
        return;
      }
      
      if (!currentUserId) {
        toast.error('Không xác định được người dùng. Vui lòng đăng nhập lại!');
        return;
      }

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
          user_id: currentUserId,
        }),
      });

      console.log('📨 Response status:', response.status);
      const data = await response.json();
      console.log('📨 Response data:', data);

      if (response.ok && data.success) {
        toast.success('✅ Email đã được gửi thành công!');
        // Đợi 1 giây để user thấy toast rồi đóng modal
        setTimeout(() => {
          onClose();
        }, 1000);
      } else if (response.status === 401) {
        if (data.detail?.includes('Google Account')) {
          toast.error('⚠️ Cần kết nối Google Account trong Settings');
        } else {
          toast.error('⚠️ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting (only in inputs, not textarea)
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
    // Close modal on Escape
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📧</div>
              <div>
                <h2 className="text-2xl font-bold">Email Draft</h2>
                <p className="text-sm text-green-100">Chỉnh sửa và gửi email</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSend} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Người nhận
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                         transition-all"
                placeholder="email@example.com"
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📌 Chủ đề
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                         transition-all"
                placeholder="Tiêu đề email"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📄 Nội dung
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                         transition-all resize-none"
                placeholder="Nội dung email..."
                required
              />
            </div>

            {/* Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                💡 <strong>Mẹo:</strong> Bạn có thể chỉnh sửa mọi trường trước khi gửi. 
                Nhấn <kbd className="px-2 py-1 bg-white rounded border">Esc</kbd> để đóng.
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 
                       font-semibold rounded-lg transition-colors"
              disabled={sending}
            >
              ❌ Hủy
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !to || !subject || !body}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                       hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400
                       text-white font-semibold rounded-lg transition-all
                       flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  📨 Gửi Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        kbd {
          font-family: monospace;
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
};
