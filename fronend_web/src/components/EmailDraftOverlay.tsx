import { useState, useEffect } from 'react';
import { X, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  user_id?: number;
}

interface EmailDraftOverlayProps {
  draft: EmailDraft | null;
  userId?: number;
  onClose: () => void;
}

export const EmailDraftOverlay = ({ draft, userId, onClose }: EmailDraftOverlayProps) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Load draft when it changes
  useEffect(() => {
    console.log('📧 EmailDraftOverlay useEffect, draft:', draft);
    if (draft) {
      console.log('📧 Loading draft data:', draft);
      setTo(draft.to);
      setSubject(draft.subject);
      setBody(draft.body);
    }
  }, [draft]);

  const handleSend = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!to || !subject || !body) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    try {
      setSending(true);
      
      const token = localStorage.getItem('token');
      const currentUserId = userId || draft?.user_id;
      
      console.log('📧 Sending email from overlay - Token:', token ? 'EXISTS' : 'NO TOKEN');
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
        toast.success('✅ Email đã được gửi thành công!', { duration: 2000 });
        // Đợi 1 giây rồi đóng overlay
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
    // Close on Escape
    if (e.key === 'Escape' && !sending) {
      onClose();
    }
  };

  if (!draft) return null;

  console.log('🎨 EmailDraftOverlay rendering with draft:', draft);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Overlay Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Quay lại Chat"
                disabled={sending}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="text-4xl">📧</div>
                <div>
                  <h2 className="text-2xl font-bold">Email Draft</h2>
                  <p className="text-sm text-blue-100">Chỉnh sửa và gửi email</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Đóng (Esc)"
              disabled={sending}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <form onSubmit={handleSend} className="space-y-5">
              {/* To */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 Người nhận
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all text-lg"
                  placeholder="email@example.com"
                  required
                  disabled={sending}
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all text-lg"
                  placeholder="Tiêu đề email"
                  required
                  disabled={sending}
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
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all text-lg resize-none"
                  placeholder="Nội dung email..."
                  required
                  disabled={sending}
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Mẹo:</strong> Bạn có thể chỉnh sửa mọi trường trước khi gửi. 
                  Nhấn <kbd className="px-2 py-1 bg-white rounded border text-xs">Esc</kbd> để đóng.
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 
                       font-semibold rounded-lg transition-colors text-lg"
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
                       text-white font-semibold rounded-lg transition-all text-lg
                       flex items-center justify-center gap-2 shadow-lg"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
