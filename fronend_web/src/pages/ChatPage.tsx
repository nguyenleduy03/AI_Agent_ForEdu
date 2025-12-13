import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Plus, CheckCheck, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import VoiceChatButton from '../components/VoiceChatButton';
import QuotaWarningBanner from '../components/QuotaWarningBanner';
import { chatService } from '../services/chatService';
import { springApi } from '../services/api';
import { useVoiceChat } from '../hooks/useVoiceChat';
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

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error'; // Status for user messages
  retryable?: boolean; // Can retry if failed
  actions?: ActionLink[]; // Suggested action links
  toolAction?: ToolAction; // Auto-execute action
}

const ChatPage = () => {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true); // Auto-read AI responses
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Chat Hook
  const voiceChat = useVoiceChat({
    onTranscript: (text) => {
      setInput(text);
    },
    language: 'vi-VN', // Vietnamese
  });

  // Load chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatService.getSessions,
  });

  // Load messages for current session
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ['chat-messages', currentSessionId],
    queryFn: () => currentSessionId ? chatService.getMessages(currentSessionId) : Promise.resolve([]),
    enabled: !!currentSessionId,
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (title: string) => chatService.createSession(title),
    onSuccess: (newSession) => {
      setCurrentSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast.success('New chat session created!');
    },
  });

  // Save message mutation
  const saveMessageMutation = useMutation({
    mutationFn: async ({ sessionId, sender, message }: { sessionId: number; sender: string; message: string }) => {
      const response = await springApi.post(`/api/chat/sessions/${sessionId}/messages`, { sender, message });
      console.log('Message saved:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('Message saved successfully:', data);
      // Invalidate to reload messages from database
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
    },
    onError: (error: any) => {
      console.error('Failed to save message:', error);
      toast.error('Failed to save message: ' + (error.response?.data?.message || error.message));
    },
  });

  // Initialize: Create or use first session
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    } else if (sessions.length === 0 && !currentSessionId) {
      createSessionMutation.mutate('New Chat Session');
    }
  }, [sessions]);

  // Convert backend messages to display format
  useEffect(() => {
    console.log('📥 Raw sessionMessages from backend:', sessionMessages);
    
    if (sessionMessages.length > 0) {
      const convertedMessages: Message[] = sessionMessages.map((msg: ChatMessage) => {
        console.log('🔄 Converting message:', {
          id: msg.id,
          sender: msg.sender,
          senderType: typeof msg.sender,
          message: msg.message.substring(0, 30) + '...',
        });
        
        return {
          id: msg.id.toString(),
          sender: msg.sender.toLowerCase() as 'user' | 'ai',
          text: msg.message,
          timestamp: new Date(msg.timestamp),
        };
      });
      
      console.log('✅ Converted messages:', convertedMessages.map(m => ({
        sender: m.sender,
        text: m.text.substring(0, 30) + '...',
      })));
      
      setMessages(convertedMessages);
    } else if (currentSessionId) {
      // Show welcome message for new session
      console.log('👋 Showing welcome message for new session');
      setMessages([
        {
          id: '1',
          sender: 'ai',
          text: 'Hello! I\'m your AI learning assistant. How can I help you today?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [sessionMessages, currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send when voice transcript is complete
  useEffect(() => {
    if (voiceChat.transcript && !voiceChat.isListening && voiceChat.transcript.trim()) {
      // Wait a bit for transcript to finalize
      const timer = setTimeout(() => {
        if (input === voiceChat.transcript && input.trim()) {
          handleSend();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [voiceChat.transcript, voiceChat.isListening, input]);

  const handleSend = async () => {
    if (!input.trim() || loading || !currentSessionId) {
      console.log('Cannot send:', { input: input.trim(), loading, currentSessionId });
      return;
    }

    const userMessageText = input;
    const tempMessageId = Date.now().toString();
    console.log('Sending message:', userMessageText);
    
    // Create user message with "sending" status
    const userMessage: Message = {
      id: tempMessageId,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
      status: 'sending', // Show as sending
    };

    // Add user message to UI immediately with sending status
    setMessages((prev) => {
      console.log('Adding user message to UI with status: sending');
      return [...prev, userMessage];
    });
    setInput('');
    setLoading(true);

    try {
      // Save user message to database
      console.log('Saving user message to database...');
      const savedUserMsg = await saveMessageMutation.mutateAsync({
        sessionId: currentSessionId,
        sender: 'USER',
        message: userMessageText,
      });
      console.log('User message saved:', savedUserMsg);

      // Update message status to "sent"
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId ? { ...msg, status: 'sent', id: savedUserMsg.id.toString() } : msg
        )
      );

      // Get AI response
      console.log('Getting AI response...');
      const aiResponse = await chatService.sendMessageWithActions(userMessageText, useRag);
      console.log('AI response received:', aiResponse.response.substring(0, 50) + '...');
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponse.response,
        timestamp: new Date(),
        actions: aiResponse.suggested_actions || [],
        toolAction: aiResponse.tool_action,
      };
      
      // Add AI message to UI
      setMessages((prev) => {
        console.log('Adding AI message to UI');
        return [...prev, aiMessage];
      });

      // Auto-speak AI response if enabled
      if (autoSpeak && voiceChat.isSupported) {
        setTimeout(() => {
          voiceChat.speak(aiResponse.response);
        }, 300);
      }

      // Auto-execute tool action if present
      if (aiResponse.tool_action && aiResponse.tool_action.auto_execute) {
        console.log('Auto-executing tool:', aiResponse.tool_action);
        setTimeout(() => {
          executeToolAction(aiResponse.tool_action);
        }, 800); // Delay 800ms để user đọc message trước
      }

      // Save AI message to database
      console.log('Saving AI message to database...');
      const savedAIMsg = await saveMessageMutation.mutateAsync({
        sessionId: currentSessionId,
        sender: 'AI',
        message: aiResponse.response,
      });
      console.log('AI message saved:', savedAIMsg);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Check if it's a quota exceeded error
      const errorMessage = error.response?.data?.detail || error.message || '';
      const isQuotaError = errorMessage.includes('429') || 
                          errorMessage.includes('quota') || 
                          errorMessage.includes('exceeded');
      
      // Update message status to "error" with retry option
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId ? { ...msg, status: 'error', retryable: !isQuotaError } : msg
        )
      );
      
      // Show appropriate error message
      if (isQuotaError) {
        // Show quota warning banner
        setShowQuotaWarning(true);
        
        toast.error(
          '⚠️ API đã vượt quá giới hạn sử dụng hôm nay.',
          { duration: 5000 }
        );
        
        // Add system message to chat
        const systemMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'ai',
          text: '⚠️ **Thông báo hệ thống**\n\n' +
                'API AI đã vượt quá giới hạn sử dụng miễn phí (20 requests/ngày).\n\n' +
                '**Giải pháp:**\n' +
                '• Vui lòng thử lại sau 24 giờ\n' +
                '• Hoặc liên hệ admin để nâng cấp\n\n' +
                'Xin lỗi vì sự bất tiện này! 🙏',
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, systemMessage]);
      } else {
        toast.error('Không thể gửi tin nhắn. Nhấn để thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (messageId: string) => {
    const messageToRetry = messages.find((m) => m.id === messageId);
    if (!messageToRetry || !messageToRetry.retryable) return;

    // Remove the failed message
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    
    // Resend with the original text
    setInput(messageToRetry.text);
    setTimeout(() => handleSend(), 100);
  };

  const executeToolAction = (action: ToolAction) => {
    const { tool, query, url } = action;
    
    // Whitelist URLs for security
    const ALLOWED_DOMAINS = ['youtube.com', 'google.com', 'wikipedia.org'];
    try {
      const urlObj = new URL(url);
      const isAllowed = ALLOWED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
      
      if (!isAllowed) {
        toast.error('URL không được phép!');
        return;
      }
    } catch {
      toast.error('URL không hợp lệ!');
      return;
    }
    
    // Open URL in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Show toast notification
    const messages: Record<string, string> = {
      'play_youtube': `🎬 Đang phát video: ${query}`,
      'search_youtube': `🎥 Đã mở YouTube: ${query}`,
      'search_google': `🔍 Đã tìm trên Google: ${query}`,
      'open_wikipedia': `📖 Đã mở Wikipedia: ${query}`
    };
    
    toast.success(messages[tool] || 'Đã mở tab mới!', {
      duration: 4000,
      icon: tool === 'play_youtube' ? '🎬' : '✅'
    });
  };

  const handleNewSession = () => {
    const title = `Chat ${new Date().toLocaleString()}`;
    createSessionMutation.mutate(title);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)]">
        <div className="card h-full flex flex-col">
          {/* Quota Warning Banner */}
          <AnimatePresence>
            {showQuotaWarning && (
              <QuotaWarningBanner onClose={() => setShowQuotaWarning(false)} />
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI Learning Assistant</h1>
                  <p className="text-sm text-gray-600">
                    {currentSessionId ? `Session #${currentSessionId}` : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleNewSession}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRag}
                    onChange={(e) => setUseRag(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Use Course Context</span>
                </label>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  }`}>
                    {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    
                    {/* Tool Action Indicator */}
                    {message.sender === 'ai' && message.toolAction && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 pt-3 border-t border-gray-200"
                      >
                        <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-200">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <ExternalLink className="w-4 h-4 text-primary-600" />
                          </motion.div>
                          <span className="text-sm text-primary-700 font-medium">
                            Đang mở tab mới...
                          </span>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Action Links */}
                    {message.sender === 'ai' && message.actions && message.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <p className="text-xs text-gray-500 font-medium mb-2">📚 Tài liệu tham khảo:</p>
                        {message.actions.map((action, idx) => (
                          <motion.a
                            key={idx}
                            href={action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 group"
                          >
                            <span className="text-lg">{action.icon}</span>
                            <span className="text-sm text-gray-700 flex-1 group-hover:text-primary-600 transition-colors">
                              {action.title}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                          </motion.a>
                        ))}
                      </div>
                    )}
                    <div className={`flex items-center justify-between mt-1 text-xs ${message.sender === 'user' ? 'text-white/90' : 'text-gray-500'}`}>
                      <span>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.sender === 'user' && message.status && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center ml-2 font-medium"
                        >
                          {message.status === 'sending' && (
                            <motion.div
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="flex items-center text-white"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span className="ml-1">Sending...</span>
                            </motion.div>
                          )}
                          {message.status === 'sent' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.2, 1] }}
                              transition={{ duration: 0.3 }}
                              className="text-white"
                              title="Sent"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </motion.div>
                          )}
                          {message.status === 'error' && (
                            <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRetry(message.id)}
                              className="flex items-center text-red-200 hover:text-white transition-colors font-semibold"
                              title="Click to retry"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="ml-1">Failed - Retry</span>
                            </motion.button>
                          )}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
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
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t pt-4 space-y-4">
            {/* Voice Chat Controls */}
            <div className="flex items-center justify-between">
              <VoiceChatButton
                isListening={voiceChat.isListening}
                isSpeaking={voiceChat.isSpeaking}
                isSupported={voiceChat.isSupported}
                transcript={voiceChat.transcript}
                onStartListening={voiceChat.startListening}
                onStopListening={voiceChat.stopListening}
                onStopSpeaking={voiceChat.stopSpeaking}
              />
              
              {/* Auto-speak toggle */}
              {voiceChat.isSupported && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">🔊 Tự động đọc</span>
                </label>
              )}
            </div>

            {/* Text Input */}
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or use voice..."
                className="input-field flex-1"
                disabled={loading || voiceChat.isListening}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || voiceChat.isListening}
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
  );
};

export default ChatPage;
