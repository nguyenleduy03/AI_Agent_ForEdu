import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
  onNewSession: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChatSidebar = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const updateTitleMutation = useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: number; title: string }) =>
      chatService.updateSessionTitle(sessionId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      setEditingId(null);
      toast.success('Đã cập nhật tiêu đề');
    },
    onError: () => toast.error('Không thể cập nhật tiêu đề'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => chatService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast.success('Đã xóa cuộc hội thoại');
    },
    onError: () => toast.error('Không thể xóa cuộc hội thoại'),
  });

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateTitleMutation.mutate({ sessionId: editingId, title: editTitle.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (sessionId: number) => {
    if (window.confirm('Bạn có chắc muốn xóa cuộc hội thoại này?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Collapsed state
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 64 }}
        animate={{ width: 64 }}
        className="flex-shrink-0 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 border-r border-purple-200/50 flex flex-col items-center py-4 gap-3"
      >
        <button
          onClick={onToggleCollapse}
          className="p-2.5 hover:bg-white/60 rounded-xl transition-colors shadow-sm"
          title="Mở rộng"
        >
          <ChevronRight className="w-5 h-5 text-purple-600" />
        </button>
        <button
          onClick={onNewSession}
          className="p-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all"
          title="Cuộc hội thoại mới"
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: 280 }}
      className="flex-shrink-0 bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 border-r border-green-200/50 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-green-200/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">Lịch sử chat</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          title="Thu gọn"
        >
          <ChevronLeft className="w-4 h-4 text-green-600" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Cuộc hội thoại mới</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent">
        <AnimatePresence>
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.03 }}
              className={`group relative mb-1 rounded-xl transition-all ${
                currentSessionId === session.id
                  ? 'bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border border-green-300 shadow-sm'
                  : 'hover:bg-white/60'
              }`}
            >
              {editingId === session.id ? (
                <div className="p-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-green-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={handleCancelEdit} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectSession(session.id)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                      currentSessionId === session.id
                        ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600'
                        : 'bg-gradient-to-r from-green-200 to-emerald-200'
                    }`}>
                      <MessageSquare className={`w-4 h-4 ${
                        currentSessionId === session.id ? 'text-white' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        currentSessionId === session.id ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {session.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-green-400" />
                        <p className="text-xs text-green-500">
                          {formatDate(session.updatedAt || session.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Action buttons */}
              {editingId !== session.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(session);
                    }}
                    className="p-2 text-green-400 hover:text-green-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                    title="Đổi tên"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                    className="p-2 text-green-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors shadow-sm"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">Chưa có cuộc hội thoại</p>
            <p className="text-xs text-green-500 mt-1">Nhấn nút trên để bắt đầu</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-green-200/50">
        <p className="text-xs text-green-600 text-center font-medium">
          Hiển thị {sessions.length} cuộc hội thoại gần nhất
        </p>
      </div>
    </motion.div>
  );
};

export default ChatSidebar;
