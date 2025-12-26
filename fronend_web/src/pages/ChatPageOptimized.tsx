import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Plus, CheckCheck, AlertCircle, Clock, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import { EmailDraftOverlay } from '../components/EmailDraftOverlay';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store/authStore';

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
  emailDraft?: EmailDraft;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  };
}

type ChatMode = 'normal' | 'rag' | 'agent';
type AiProvider = 'gemini' | 'groq';

const ChatPageOptimized = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // ===== CORE STATE (Minimal) =====
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ===== UI STATE =====
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  const [aiProvider, setAiProvider] = useState<AiProvider>('gemini');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [emailDraftOverlay, setEmailDraftOverlay] = useState<EmailDraft | null>(null);
  
  // ===== REFS (Không trigger re-render) =====
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== REACT QUERY (Controlled) =====
  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatService.getSessions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ===== MEMOIZED VALUES =====
  const canSend = useMemo(() => {
    return !loading && (input.trim() || selectedFile) && currentSessionId;
  }, [loading, input, selectedFile, currentSessionId]);

  // ===== CALLBACKS (Stable references) =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ===== INITIALIZE SESSION (Once) =====
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
      isInitializedRef.current = true;
    }
  }, [sessions, currentSessionId]);

  // ===== LOAD MESSAGES (Controlled) =====
  useEffect(() => {
    if (!currentSessionId) return;

    let isCancelled = false;

    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(currentSessionId);
        
        if (isCancelled) return;

        const converted: Message[] = data.map((msg: any) => ({
          id: msg.id.toString(),
          sender: msg.sender.toLowerCase() as 'user' | 'ai',
          text: msg.message,
          timestamp: new Date(msg.timestamp),
        }));

        setMessages(converted.length > 0 ? converted : [{
          id: '1',
          sender: 'ai',
          text: 'Hello! How can I help you today?',
          timestamp: new Date(),
        }]);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [currentSessionId]);

  // ===== AUTO SCROLL (Debounced) =====
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  // ===== SEND MESSAGE =====
  const handleSend = useCallback(async () => {
    if (!canSend) return;

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userText = input.trim() || (selectedFile ? '📎 File attached' : '');
    const tempId = Date.now().toString();

    // Prepare attachment
    let imageBase64: string | undefined;
    if (selectedFile && filePreview) {
      const match = filePreview.match(/^data:(.+);base64,(.+)$/);
      if (match) imageBase64 = match[2];
    }

    // Add user message immediately
    const userMessage: Message = {
      id: tempId,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
      status: 'sending',
      attachment: selectedFile && filePreview ? {
        type: 'image',
        url: filePreview,
        name: selectedFile.name,
      } : undefined,
    };

    // Batch updates
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    handleRemoveFile();
    setLoading(true);

    try {
      // Get AI response
      const aiResponse = await chatService.sendMessageWithActions(
        userText,
        chatMode === 'rag',
        aiProvider,
        'models/gemini-2.0-flash-exp',
        imageBase64
      );

      // Update user message status
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'sent' as const } : msg
      ));

      // Parse email draft
      let emailDraft = aiResponse.email_draft || aiResponse.emailDraft;
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: emailDraft ? '📧 Email draft created. Please review and send.' : 
              (typeof aiResponse.response === 'string' ? aiResponse.response : JSON.stringify(aiResponse.response)),
        timestamp: new Date(),
        emailDraft,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-open email overlay
      if (emailDraft) {
        setEmailDraftOverlay(emailDraft);
      }

    } catch (error: any) {
      console.error('Send error:', error);

      // Update message status to error
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'error' as const } : msg
      ));

      toast.error('Failed to send message');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [canSend, input, selectedFile, filePreview, chatMode, aiProvider, handleRemoveFile]);

  // ===== KEYBOARD HANDLER =====
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ===== FILE HANDLER =====
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large! Max 10MB');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    toast.success(`Selected: ${file.name}`);
  }, []);

  // ===== NEW SESSION =====
  const handleNewSession = useCallback(() => {
    const title = `Chat ${new Date().toLocaleString()}`;
    chatService.createSession(title).then(newSession => {
      setCurrentSessionId(newSession.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast.success('New chat created!');
    });
  }, [queryClient]);

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cleanup file URLs
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  return (
    <ErrorBoundary>
      <Layout>
        <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)]">
          <div className="card h-full flex flex-col">
            {/* Header */}
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">AI Assistant</h1>
                    <p className="text-sm text-gray-600">
                      {currentSessionId ? `Session #${currentSessionId}` : 'Loading...'}
                    </p>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setChatMode('normal')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      chatMode === 'normal' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🤖 Normal
                  </button>
                  <button
                    onClick={() => setChatMode('rag')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      chatMode === 'rag' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    📚 RAG
                  </button>
                  <button
                    onClick={() => setChatMode('agent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      chatMode === 'agent' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    🎓 Agent
                  </button>
                </div>

                <button
                  onClick={handleNewSession}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}>
                      {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>

                    <div className="flex-1">
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.text}</div>

                        {/* Attachment */}
                        {message.attachment && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <img
                              src={message.attachment.url}
                              alt={message.attachment.name}
                              className="max-w-xs rounded-lg shadow-md"
                            />
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.status === 'sending' && <Clock className="w-3 h-3" />}
                          {message.status === 'sent' && <CheckCheck className="w-3 h-3" />}
                          {message.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t pt-4">
              <div className="flex space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1 space-y-2">
                  {selectedFile && filePreview && (
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                      <span className="text-sm flex-1">{selectedFile.name}</span>
                      <button onClick={handleRemoveFile} className="p-1 hover:bg-red-100 rounded">
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="input-field w-full"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>

      <EmailDraftOverlay
        draft={emailDraftOverlay}
        userId={user?.id}
        onClose={() => setEmailDraftOverlay(null)}
      />
    </ErrorBoundary>
  );
};

export default ChatPageOptimized;
