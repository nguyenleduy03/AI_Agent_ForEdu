import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Sparkles,
  GraduationCap,
  ArrowLeft,
  Lock,
  MessageSquare,
  Zap,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

const MAX_GUEST_MESSAGES = 10;

const GuestChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (messageCount >= MAX_GUEST_MESSAGES) {
      toast.error('Bạn đã hết lượt dùng thử. Đăng ký để tiếp tục!');
      return;
    }

    const userMessageText = input.trim();
    const tempMessageId = Date.now().toString();

    const userMessage: Message = {
      id: tempMessageId,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setMessageCount((prev) => prev + 1);

    try {
      // Call FastAPI directly without auth token for guest
      const response = await axios.post(
        `${API_CONFIG.FASTAPI_URL}/api/chat/guest`,
        {
          message: userMessageText,
          use_rag: false,
          ai_provider: 'gemini',
        },
        { timeout: 30000 }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId ? { ...msg, status: 'sent' } : msg
        )
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.data.response || 'Xin lỗi, tôi không thể trả lời lúc này.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Guest chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId ? { ...msg, status: 'error' } : msg
        )
      );
      
      // Add fallback AI response for demo
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Xin chào! Tôi là AI Learning Assistant. Đây là phiên bản demo, một số tính năng có thể bị giới hạn. Hãy đăng ký tài khoản để trải nghiệm đầy đủ nhé! 🎓',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickSuggestions = [
    { icon: '🤖', text: 'Machine Learning là gì?' },
    { icon: '💡', text: 'Cách học lập trình hiệu quả' },
    { icon: '📚', text: 'Giải thích về React hooks' },
    { icon: '🎯', text: 'Tips quản lý thời gian học tập' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Quay lại</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  EduAgent
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-600 font-medium hover:text-green-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all hover:-translate-y-0.5"
              >
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 h-screen flex flex-col">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Chế độ dùng thử • {MAX_GUEST_MESSAGES - messageCount} tin nhắn còn lại
                </p>
                <p className="text-xs text-amber-600">
                  Đăng ký để mở khóa tất cả tính năng: lưu lịch sử, xem TKB, gửi email...
                </p>
              </div>
            </div>
            <Link
              to="/register"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              <Lock className="w-4 h-4" />
              Mở khóa
            </Link>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Welcome State */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-12"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Chào mừng đến với EduAgent! 👋
                </h2>
                <p className="text-slate-500 text-center max-w-md mb-8">
                  Tôi là AI Learning Assistant, sẵn sàng hỗ trợ bạn học tập.
                  Hãy thử hỏi tôi bất cứ điều gì!
                </p>

                {/* Quick Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {quickSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(suggestion.text)}
                      className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left hover:bg-slate-50 hover:border-slate-300 transition-all group"
                    >
                      <span className="text-xl">{suggestion.icon}</span>
                      <span className="text-sm text-slate-600 group-hover:text-slate-800">
                        {suggestion.text}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Features Preview */}
                <div className="mt-12 grid grid-cols-3 gap-6 w-full max-w-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs text-slate-500">Chat AI 24/7</p>
                  </div>
                  <div className="text-center opacity-50">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs text-slate-500">RAG Documents</p>
                    <span className="text-[10px] text-amber-600">Cần đăng ký</span>
                  </div>
                  <div className="text-center opacity-50">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-xs text-slate-500">Agent Mode</p>
                    <span className="text-[10px] text-amber-600">Cần đăng ký</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white'
                        : 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.sender === 'user' ? 'flex flex-col items-end' : ''
                    }`}
                  >
                    <div
                      className={`relative rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {message.text}
                      </div>
                      {message.status === 'sending' && (
                        <span className="text-xs opacity-60 mt-1 block">Đang gửi...</span>
                      )}
                      {message.status === 'error' && (
                        <span className="text-xs text-red-400 mt-1 block">Lỗi gửi tin nhắn</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Limit Reached Banner */}
        {messageCount >= MAX_GUEST_MESSAGES && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-4"
          >
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div>
                <p className="font-semibold">Bạn đã hết lượt dùng thử! 🎉</p>
                <p className="text-sm text-white/80">
                  Đăng ký miễn phí để chat không giới hạn và mở khóa tất cả tính năng
                </p>
              </div>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    messageCount >= MAX_GUEST_MESSAGES
                      ? 'Đăng ký để tiếp tục chat...'
                      : 'Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)'
                  }
                  disabled={loading || messageCount >= MAX_GUEST_MESSAGES}
                  className="w-full px-4 py-3 pr-12 bg-slate-100 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 placeholder-slate-400"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || messageCount >= MAX_GUEST_MESSAGES}
                className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Phiên bản demo • Một số tính năng bị giới hạn •{' '}
              <Link to="/register" className="text-purple-600 hover:underline">
                Đăng ký miễn phí
              </Link>{' '}
              để trải nghiệm đầy đủ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestChatPage;
