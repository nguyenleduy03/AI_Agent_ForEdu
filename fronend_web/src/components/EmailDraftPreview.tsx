import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  user_id?: number;
}

interface EmailDraftPreviewProps {
  draft: EmailDraft;
  userId?: number; // Current logged-in user's ID from auth store
  onSent?: () => void;
}

export const EmailDraftPreview = ({ draft, userId, onSent }: EmailDraftPreviewProps) => {
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [sending, setSending] = useState(false);

  const handleSend = async (e?: React.MouseEvent | React.FormEvent) => {
    // Prevent default form submission/page reload
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      setSending(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Use userId from props (from auth store) - this is the current logged-in user
      const currentUserId = userId || draft.user_id;
      
      console.log('📧 Sending email - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('📧 Current User ID (from auth store):', currentUserId);
      
      if (!token) {
        toast.error('Vui lòng đăng nhập lại!');
        return;
      }
      
      if (!currentUserId) {
        toast.error('Không xác định được người dùng. Vui lòng đăng nhập lại!');
        return;
      }

      // Call API to send email
      console.log('📤 Calling /api/email/send with:', { to, subject, body: body.substring(0, 50) + '...', user_id: currentUserId });
      
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
        toast.success('✅ Email đã được gửi!');
        onSent?.();
      } else if (response.status === 401) {
        // Check for specific auth errors
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
  };

  return (
    <form 
      onSubmit={handleSend}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border-2 border-green-200 dark:border-blue-800 my-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">📧</div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Xem trước Email
        </h3>
      </div>

      {/* Email Fields */}
      <div className="space-y-3" onKeyDown={handleKeyDown}>
        {/* To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📧 Người nhận
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="email@example.com"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📌 Chủ đề
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Tiêu đề email"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📄 Nội dung
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Nội dung email..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !to || !subject || !body}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                   text-white font-semibold py-2.5 px-4 rounded-lg
                   transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <span>📨</span>
              Gửi Email
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        💡 Bạn có thể chỉnh sửa nội dung trước khi gửi
      </p>
    </form>
  );
};
