import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Plus,
  CheckCheck,
  AlertCircle,
  Clock,
  ExternalLink,
  Paperclip,
  Image as ImageIcon,
  X,
  Sparkles,
  Zap,
  BookOpen,
  GraduationCap,
  Settings2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import ChatSidebar from '../components/ChatSidebar';
import VoiceChatButton from '../components/VoiceChatButton';
import QuotaWarningBanner from '../components/QuotaWarningBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { EmailDraftOverlay } from '../components/EmailDraftOverlay';
import { chatService } from '../services/chatService';
import { springApi } from '../services/api';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useAuthStore } from '../store/authStore';
import type { ChatMessage } from '../types';

interface ActionLink {
  type: string;
  url: string;
  title: string;
  icon: string;
}

interface ToolAction {
  tool: string;
  query: string;
  url: string;
  auto_execute: boolean;
  video_id?: string;
  embed_url?: string;
}

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  user_id?: number;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  retryable?: boolean;
  actions?: ActionLink[];
  toolAction?: ToolAction;
  emailDraft?: EmailDraft;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name: string;
    mimeType?: string;
  };
}

type ChatMode = 'normal' | 'google-cloud' | 'rag' | 'agent';
type AiProvider = 'gemini' | 'groq';

interface GroqModel {
  id: string;
  name: string;
  description: string;
  context: number;
  speed: string;
}

const ChatPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  const [aiProvider, setAiProvider] = useState<AiProvider>('gemini');
  const [selectedGroqModel, setSelectedGroqModel] = useState('llama-3.3-70b-versatile');
  const [groqModels, setGroqModels] = useState<GroqModel[]>([]);
  const [geminiModels, setGeminiModels] = useState<any[]>([]);
  const [selectedGeminiModel, setSelectedGeminiModel] = useState('models/gemini-2.0-flash-exp');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [useRag, setUseRag] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [emailDraftOverlay, setEmailDraftOverlay] = useState<EmailDraft | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionTitleGenerated, setSessionTitleGenerated] = useState<Set<number>>(new Set());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const voiceChat = useVoiceChat({
    onTranscript: (text) => setInput(text),
    language: 'vi-VN',
  });

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Load sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatService.getSessions,
  });

  // Load messages
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ['chat-messages', currentSessionId],
    queryFn: () => (currentSessionId ? chatService.getMessages(currentSessionId) : Promise.resolve([])),
    enabled: !!currentSessionId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  const createSessionMutation = useMutation({
    mutationFn: (title: string) => chatService.createSession(title),
    onSuccess: (newSession) => {
      setCurrentSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast.success('Đã tạo cuộc hội thoại mới!');
    },
  });

  const saveMessageMutation = useMutation({
    mutationFn: async ({ sessionId, sender, message }: { sessionId: number; sender: string; message: string }) => {
      const response = await springApi.post(`/api/chat/sessions/${sessionId}/messages`, { sender, message });
      return response.data;
    },
  });

  // Initialize session
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  const [initialLoadDone, setInitialLoadDone] = useState<number | null>(null);

  useEffect(() => {
    if (currentSessionId && initialLoadDone !== currentSessionId) {
      setInitialLoadDone(null);
    }
  }, [currentSessionId, initialLoadDone]);

  // Fetch models
  useEffect(() => {
    chatService.getModels().then((data) => setGeminiModels(data.models || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (aiProvider === 'groq') {
      chatService.getGroqModels().then((data) => {
        const models = data.models || [];
        if (models.length > 0) {
          setGroqModels(models);
          if (!models.find((m: any) => m.id === selectedGroqModel)) {
            setSelectedGroqModel(models[0].id);
          }
        }
      }).catch(() => toast.error('Không thể lấy danh sách model Groq'));
    }
  }, [aiProvider, selectedGroqModel]);

  // Convert messages
  useEffect(() => {
    if (!currentSessionId) return;
    if (initialLoadDone === currentSessionId) return;

    if (sessionMessages.length > 0) {
      const converted: Message[] = sessionMessages.map((msg: ChatMessage) => ({
        id: msg.id.toString(),
        sender: msg.sender.toLowerCase() as 'user' | 'ai',
        text: msg.message,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(converted);
      setInitialLoadDone(currentSessionId);
    } else if (currentSessionId) {
      setMessages([]);
      setInitialLoadDone(currentSessionId);
    }
  }, [sessionMessages, currentSessionId, initialLoadDone]);

  // Scroll
  useEffect(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Auto RAG
  useEffect(() => {
    setUseRag(chatMode === 'rag');
  }, [chatMode]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);


  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || loading || !currentSessionId) return;

    const userMessageText = input.trim() || (selectedFile?.type.startsWith('image/') ? 'Phân tích ảnh này' : '📎 File đính kèm');
    const tempMessageId = Date.now().toString();

    let attachmentData: Message['attachment'];
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (selectedFile && filePreview) {
      attachmentData = { type: 'image', url: filePreview, name: selectedFile.name, mimeType: selectedFile.type };
      const base64Match = filePreview.match(/^data:(.+);base64,(.+)$/);
      if (base64Match) {
        imageMimeType = base64Match[1];
        imageBase64 = base64Match[2];
      }
    } else if (selectedFile) {
      attachmentData = { type: 'file', url: URL.createObjectURL(selectedFile), name: selectedFile.name, mimeType: selectedFile.type };
    }

    const userMessage: Message = {
      id: tempMessageId,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
      status: 'sending',
      attachment: attachmentData,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    handleRemoveFile();
    setLoading(true);

    try {
      const savedUserMsg = await saveMessageMutation.mutateAsync({
        sessionId: currentSessionId,
        sender: 'USER',
        message: userMessageText,
      });

      setMessages((prev) => prev.map((msg) => (msg.id === tempMessageId ? { ...msg, status: 'sent', id: savedUserMsg.id.toString() } : msg)));

      const aiResponse = await chatService.sendMessageWithActions(
        userMessageText,
        useRag,
        aiProvider,
        aiProvider === 'groq' ? selectedGroqModel : selectedGeminiModel,
        imageBase64,
        imageMimeType,
        currentSessionId
      );

      let responseText = typeof aiResponse.response === 'string' ? aiResponse.response : JSON.stringify(aiResponse.response, null, 2);
      let emailDraft = aiResponse.email_draft || aiResponse.emailDraft;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: emailDraft ? '📧 Email draft đã được tạo.' : responseText,
        timestamp: new Date(),
        actions: aiResponse.suggested_actions || [],
        toolAction: aiResponse.tool_action,
        emailDraft,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (emailDraft) setEmailDraftOverlay(emailDraft);
      if (autoSpeak && voiceChat.isSupported && !emailDraft) {
        setTimeout(() => voiceChat.speak(responseText), 500);
      }
      if (aiResponse.tool_action?.auto_execute) {
        executeToolAction(aiResponse.tool_action);
      }

      if (!emailDraft) {
        await saveMessageMutation.mutateAsync({ sessionId: currentSessionId, sender: 'AI', message: responseText });
        if (messages.length <= 2) generateSessionTitle(currentSessionId, userMessageText, responseText);
      }
    } catch (error: any) {
      const isQuotaError = error.response?.data?.detail?.includes('429') || error.message?.includes('quota');
      setMessages((prev) => prev.map((msg) => (msg.id === tempMessageId ? { ...msg, status: 'error', retryable: !isQuotaError } : msg)));
      if (isQuotaError) {
        setShowQuotaWarning(true);
        toast.error('API đã vượt quá giới hạn sử dụng');
      } else {
        toast.error('Không thể gửi tin nhắn');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.retryable) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setInput(msg.text);
    setTimeout(handleSend, 100);
  };

  const executeToolAction = (action: ToolAction) => {
    if (!action?.url) return;
    const ALLOWED = ['youtube.com', 'google.com', 'wikipedia.org'];
    try {
      const url = new URL(action.url);
      if (!ALLOWED.some((d) => url.hostname.includes(d))) {
        toast.error('URL không được phép');
        return;
      }
      window.open(action.url, '_blank', 'noopener,noreferrer');
      toast.success(`Đã mở: ${action.query}`);
    } catch {
      toast.error('URL không hợp lệ');
    }
  };

  const handleNewSession = () => {
    setInitialLoadDone(null);
    createSessionMutation.mutate('Cuộc hội thoại mới');
  };

  const generateSessionTitle = async (sessionId: number, userMsg: string, aiMsg: string) => {
    if (sessionTitleGenerated.has(sessionId)) return;
    try {
      const title = await chatService.generateTitle([
        { role: 'user', content: userMsg },
        { role: 'ai', content: aiMsg },
      ]);
      if (title && title !== 'New Chat') {
        await chatService.updateSessionTitle(sessionId, title);
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        setSessionTitleGenerated((prev) => new Set(prev).add(sessionId));
      }
    } catch {}
  };

  const handleSelectSession = (sessionId: number) => {
    if (sessionId !== currentSessionId) {
      setInitialLoadDone(null);
      setCurrentSessionId(sessionId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn (max 10MB)');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowed.includes(file.type)) {
      toast.error('Loại file không hỗ trợ');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    toast.success(`Đã chọn: ${file.name}`);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
    toast.success('Đã sao chép');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modeConfig = {
    normal: { icon: Sparkles, label: 'Chat', color: 'from-violet-500 to-purple-500', desc: 'Trò chuyện tự nhiên với AI' },
    'google-cloud': { icon: Zap, label: 'Cloud', color: 'from-blue-500 to-cyan-500', desc: 'Dịch, phân tích cảm xúc, OCR' },
    rag: { icon: BookOpen, label: 'RAG', color: 'from-emerald-500 to-green-500', desc: 'Tìm kiếm trong tài liệu' },
    agent: { icon: GraduationCap, label: 'Agent', color: 'from-orange-500 to-amber-500', desc: 'Xem TKB, điểm, gửi email' },
  };


  return (
    <ErrorBoundary>
      <Layout>
        <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-slate-50">
          {/* Sidebar */}
          <ChatSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Quota Warning */}
            <AnimatePresence>
              {showQuotaWarning && <QuotaWarningBanner onClose={() => setShowQuotaWarning(false)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${modeConfig[chatMode].color} flex items-center justify-center text-white shadow-lg shadow-purple-500/20`}>
                      <Bot className="w-6 h-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-800">AI Learning Assistant</h1>
                    <p className="text-sm text-slate-500">{sessions.find((s) => s.id === currentSessionId)?.title || 'Chọn hoặc tạo cuộc hội thoại'}</p>
                  </div>
                </div>

                {/* Mode & Provider Selector */}
                <div className="flex items-center gap-3">
                  {/* Chat Mode */}
                  <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {(Object.keys(modeConfig) as ChatMode[]).map((mode) => {
                      const config = modeConfig[mode];
                      const Icon = config.icon;
                      return (
                        <button
                          key={mode}
                          onClick={() => setChatMode(mode)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            chatMode === mode
                              ? `bg-gradient-to-r ${config.color} text-white shadow-md`
                              : 'text-slate-600 hover:bg-white/60'
                          }`}
                          title={config.desc}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* AI Provider */}
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setAiProvider('gemini')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        aiProvider === 'gemini' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      ✨ Gemini
                    </button>
                    <button
                      onClick={() => setAiProvider('groq')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        aiProvider === 'groq' ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      ⚡ Groq
                    </button>
                  </div>

                  {/* Settings */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2.5 rounded-xl transition-all ${showSettings ? 'bg-slate-200 text-slate-700' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-slate-200 flex flex-wrap items-center gap-4">
                      {/* Model Selector */}
                      {aiProvider === 'gemini' && geminiModels.length > 0 && (
                        <select
                          value={selectedGeminiModel}
                          onChange={(e) => setSelectedGeminiModel(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {geminiModels.map((m) => (
                            <option key={m.name} value={m.name}>{m.display_name}</option>
                          ))}
                        </select>
                      )}
                      {aiProvider === 'groq' && groqModels.length > 0 && (
                        <select
                          value={selectedGroqModel}
                          onChange={(e) => setSelectedGroqModel(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {groqModels.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      )}

                      {/* Toggles */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={useRag} onChange={(e) => setUseRag(e.target.checked)} className="w-4 h-4 rounded text-purple-600" />
                        <span className="text-sm text-slate-600">📚 Dùng tài liệu</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="w-4 h-4 rounded text-purple-600" />
                        <span className="text-sm text-slate-600">{autoSpeak ? <Volume2 className="w-4 h-4 inline" /> : <VolumeX className="w-4 h-4 inline" />} Tự động đọc</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Empty State */}
                {!currentSessionId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full py-20"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                      <Bot className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Chào mừng bạn!</h2>
                    <p className="text-slate-500 mb-8 text-center max-w-md">
                      Tạo cuộc hội thoại mới để bắt đầu trò chuyện với AI Learning Assistant
                    </p>
                    <button
                      onClick={handleNewSession}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      Tạo cuộc hội thoại mới
                    </button>
                  </motion.div>
                )}

                {/* Welcome for empty session */}
                {currentSessionId && messages.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center py-16"
                  >
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${modeConfig[chatMode].color} flex items-center justify-center mb-4 shadow-xl`}>
                      {(() => { const Icon = modeConfig[chatMode].icon; return <Icon className="w-10 h-10 text-white" />; })()}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Bắt đầu cuộc trò chuyện</h3>
                    <p className="text-slate-500 text-center max-w-md">{modeConfig[chatMode].desc}</p>
                    
                    {/* Quick suggestions */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {chatMode === 'agent' && (
                        <>
                          <button onClick={() => setInput('Xem thời khóa biểu tuần này')} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            📅 Xem TKB
                          </button>
                          <button onClick={() => setInput('Xem điểm học kỳ này')} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            📊 Xem điểm
                          </button>
                          <button onClick={() => setInput('Soạn email xin phép nghỉ học')} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            ✉️ Soạn email
                          </button>
                        </>
                      )}
                      {chatMode === 'normal' && (
                        <>
                          <button onClick={() => setInput('Giải thích về Machine Learning')} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            🤖 Machine Learning
                          </button>
                          <button onClick={() => setInput('Cách học lập trình hiệu quả')} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                            💡 Tips học tập
                          </button>
                        </>
                      )}
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
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white'
                          : `bg-gradient-to-br ${modeConfig[chatMode].color} text-white shadow-lg`
                      }`}>
                        {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>

                      {/* Message Content */}
                      <div className={`flex-1 max-w-[80%] ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                        <div className={`relative group rounded-2xl px-4 py-3 ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                        }`}>
                          {/* Message text */}
                          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.text}</div>

                          {/* Attachment */}
                          {message.attachment?.type === 'image' && (
                            <img src={message.attachment.url} alt="" className="mt-3 rounded-lg max-w-xs cursor-pointer hover:opacity-90" onClick={() => window.open(message.attachment!.url)} />
                          )}

                          {/* Actions */}
                          {message.sender === 'ai' && message.actions && message.actions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              <p className="text-xs text-slate-400 font-medium">📚 Tài liệu tham khảo:</p>
                              {message.actions.map((action, idx) => (
                                <a key={idx} href={action.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-600">
                                  <span>{action.icon}</span>
                                  <span className="flex-1">{action.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Copy button for AI messages */}
                          {message.sender === 'ai' && (
                            <button
                              onClick={() => handleCopyMessage(message.text, message.id)}
                              className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-all"
                            >
                              {copiedMessageId === message.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedMessageId === message.id ? 'Đã sao chép' : 'Sao chép'}
                            </button>
                          )}
                        </div>

                        {/* Status & Time */}
                        <div className={`flex items-center gap-2 mt-1.5 text-xs ${message.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                          <span>{message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.sender === 'user' && message.status === 'sending' && <Clock className="w-3 h-3 animate-pulse" />}
                          {message.sender === 'user' && message.status === 'sent' && <CheckCheck className="w-3.5 h-3.5 text-green-500" />}
                          {message.sender === 'user' && message.status === 'error' && (
                            <button onClick={() => handleRetry(message.id)} className="flex items-center gap-1 text-red-500 hover:text-red-600">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${modeConfig[chatMode].color} flex items-center justify-center text-white shadow-lg`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>


            {/* Input Area */}
            <div className="flex-shrink-0 px-4 py-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
              <div className="max-w-4xl mx-auto">
                {/* File Preview */}
                <AnimatePresence>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mb-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      {filePreview ? (
                        <img src={filePreview} alt="" className="w-14 h-14 object-cover rounded-lg" />
                      ) : (
                        <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={handleRemoveFile} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Box */}
                <div className="flex items-end gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt" onChange={handleFileSelect} className="hidden" />

                  {/* Attach Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!currentSessionId || loading}
                    className="flex-shrink-0 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Voice Button */}
                  <VoiceChatButton
                    isListening={voiceChat.isListening}
                    isSpeaking={voiceChat.isSpeaking}
                    isSupported={voiceChat.isSupported}
                    transcript={voiceChat.transcript}
                    onStartListening={voiceChat.startListening}
                    onStopListening={voiceChat.stopListening}
                    onStopSpeaking={voiceChat.stopSpeaking}
                  />

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={!currentSessionId ? 'Vui lòng tạo cuộc hội thoại mới...' : 'Nhập tin nhắn... (Shift+Enter để xuống dòng)'}
                      disabled={!currentSessionId || loading || voiceChat.isListening}
                      rows={1}
                      className="w-full px-4 py-3 bg-slate-100 border-0 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ minHeight: '48px', maxHeight: '200px' }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={!currentSessionId || loading || (!input.trim() && !selectedFile)}
                    className={`flex-shrink-0 p-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      input.trim() || selectedFile
                        ? `bg-gradient-to-r ${modeConfig[chatMode].color} text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Mode hint */}
                <p className="text-center text-xs text-slate-400 mt-3">
                  {modeConfig[chatMode].desc} • {aiProvider === 'gemini' ? '✨ Gemini' : '⚡ Groq'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>

      {/* Email Draft Overlay */}
      <EmailDraftOverlay draft={emailDraftOverlay} userId={user?.id} onClose={() => setEmailDraftOverlay(null)} />
    </ErrorBoundary>
  );
};

export default ChatPage;
