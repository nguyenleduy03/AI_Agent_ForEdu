import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { X, Bell, ChevronRight, MessageCircle, Send, Maximize2 } from 'lucide-react';
import { assistantService, type Reminder } from '../services/assistantService';
import { useAuthStore } from '../store/authStore';
import { fastApi } from '../services/api';
import WormAvatar from './WormAvatar';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Các câu khích lệ ngẫu nhiên
const encouragements = [
  "Bạn đang làm rất tốt! 💪",
  "Cố lên nào, mình tin bạn! 🌟",
  "Học tập là hành trình, không phải đích đến! 📚",
  "Mỗi ngày một chút, bạn sẽ tiến bộ! 🚀",
  "Đừng bỏ cuộc, thành công đang chờ bạn! ✨",
  "Bạn thật giỏi khi kiên trì học tập! 🎯",
  "Nghỉ ngơi một chút rồi tiếp tục nhé! ☕",
  "Mình luôn ở đây hỗ trợ bạn! 🤗",
];

const WormAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'reminders' | 'chat'>('reminders');
  const [hasNewReminders, setHasNewReminders] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const panelRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch reminders
  const { data, isLoading } = useQuery({
    queryKey: ['assistantReminders'],
    queryFn: assistantService.getReminders,
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Initialize with greeting
  useEffect(() => {
    if (user && chatMessages.length === 0) {
      const greeting = getGreeting();
      setChatMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [user]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Check for new reminders
  useEffect(() => {
    if (data && data.totalCount > 0) {
      setHasNewReminders(true);
    }
  }, [data]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.fullName?.split(' ').pop() || 'bạn';
    if (hour < 12) return `Chào buổi sáng ${name}! 🌅 Hôm nay học gì nào?`;
    if (hour < 18) return `Chào buổi chiều ${name}! ☀️ Mình có thể giúp gì cho bạn?`;
    return `Chào buổi tối ${name}! 🌙 Học bài khuya thế, cố lên nhé!`;
  };

  const getRandomEncouragement = () => {
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  if (!user) return null;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Tạo context với reminders
      const reminderContext = data?.reminders?.slice(0, 3).map(r => 
        `- ${r.title}: ${r.message}`
      ).join('\n') || '';

      const systemPrompt = `Bạn là Sâu Sách 🐛 - trợ lý học tập dễ thương.

CÁCH TRẢ LỜI:
- NGẮN GỌN, tối đa 1-2 câu
- Tự nhiên như bạn bè chat
- Dùng 1 emoji thôi
- Không giải thích dài dòng

Nhắc nhở của ${user?.fullName}:
${reminderContext || 'Không có'}`;

      const response = await fastApi.post('/api/chat', {
        message: inputMessage.trim(),
        system_prompt: systemPrompt,
        use_rag: false,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || getRandomEncouragement(),
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setTimeout(() => {}, 2000);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${getRandomEncouragement()} Mình gặp chút trục trặc, thử lại nhé! 😅`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReminderClick = (reminder: Reminder) => {
    if (reminder.actionUrl) {
      navigate(reminder.actionUrl);
      setIsOpen(false);
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 border-red-300 text-red-800';
      case 'HIGH': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'LOW': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Quan trọng';
      case 'MEDIUM': return 'Bình thường';
      case 'LOW': return 'Thông tin';
      default: return '';
    }
  };

  return (
    <>
      {/* Worm Character */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => { setIsOpen(!isOpen); setHasNewReminders(false); }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Notification Badge */}
        {data && data.totalCount > 0 && !isOpen && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {data.totalCount > 9 ? '9+' : data.totalCount}
          </motion.div>
        )}

        {/* Worm Body - 3D Animated SVG */}
        <motion.div className="relative"
          animate={isHovered || hasNewReminders ? { y: [0, -8, 0, -5, 0], scale: [1, 1.05, 1] } : { y: [0, -3, 0] }}
          transition={{ duration: hasNewReminders ? 0.6 : 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
        >
          <WormAvatar size="lg" animate={true} />
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
            >
              {data && data.urgentCount > 0 ? `🔥 ${data.urgentCount} việc cần làm ngay!` 
                : data && data.totalCount > 0 ? `📋 ${data.totalCount} nhắc nhở`
                : '💬 Chat với mình nhé!'}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-28 right-6 w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">🐛</span>
                <span className="font-semibold">Sâu Sách</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'reminders' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                Nhắc nhở
                {data && data.totalCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{data.totalCount}</span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('chat'); setTimeout(() => inputRef.current?.focus(), 100); }}
                className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'chat' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'reminders' ? (
                <div className="overflow-y-auto flex-1 p-2">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Đang tải...
                    </div>
                  ) : data && data.reminders.length > 0 ? (
                    <div className="space-y-2">
                      {data.reminders.map((reminder) => (
                        <motion.div key={reminder.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleReminderClick(reminder)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${getPriorityColor(reminder.priority)}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{reminder.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm truncate">{reminder.title}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                  reminder.priority === 'URGENT' ? 'bg-red-200' :
                                  reminder.priority === 'HIGH' ? 'bg-orange-200' :
                                  reminder.priority === 'MEDIUM' ? 'bg-yellow-200' : 'bg-green-200'
                                }`}>{getPriorityBadge(reminder.priority)}</span>
                              </div>
                              <p className="text-xs opacity-80 line-clamp-2">{reminder.message}</p>
                              {reminder.deadline && (
                                <p className="text-xs mt-1 opacity-60">⏰ {new Date(reminder.deadline).toLocaleString('vi-VN')}</p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">🎉</div>
                      <p className="text-gray-600 font-medium">Tuyệt vời!</p>
                      <p className="text-gray-400 text-sm">Không có nhắc nhở nào</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Chat Tab */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatMessages.map((msg) => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-green-500 text-white rounded-br-md' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}>
                          {msg.role === 'assistant' && <span className="mr-1">🐛</span>}
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                          <motion.div className="flex gap-1"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-200 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Nhắn gì đó..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={isTyping}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setInputMessage('Hôm nay mình cần làm gì?'); }}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        📋 Việc cần làm
                      </button>
                      <button
                        onClick={() => { setInputMessage('Cho mình lời khuyên học tập'); }}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        💡 Lời khuyên
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => { navigate('/chat'); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Mở chat đầy đủ
              </button>
              {activeTab === 'reminders' && data && data.totalCount > 0 && (
                <p className="text-xs text-gray-500 text-center mt-1">
                  {data.urgentCount > 0 && <span className="text-red-500 font-medium">{data.urgentCount} khẩn cấp • </span>}
                  Tổng {data.totalCount} nhắc nhở
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WormAssistant;
