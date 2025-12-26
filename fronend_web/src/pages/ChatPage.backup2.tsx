import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Plus, CheckCheck, AlertCircle, Clock, ExternalLink, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VoiceChatButton from '../components/VoiceChatButton';
import QuotaWarningBanner from '../components/QuotaWarningBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { EmailDraftOverlay } from '../components/EmailDraftOverlay';
import { chatService } from '../services/chatService';
import { springApi } from '../services/api';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useAuthStore } from '../store/authStore';
import type { ChatMessage } from '../types';
import './ChatPage.css';

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
  status?: 'sending' | 'sent' | 'error'; // Status for user messages
  retryable?: boolean; // Can retry if failed
  actions?: ActionLink[]; // Suggested action links
  toolAction?: ToolAction; // Auto-execute action
  emailDraft?: EmailDraft; // Email draft for preview
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
  const { user, token } = useAuthStore(); // Get current user from auth store
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
  const [useRag, setUseRag] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true); // Auto-read AI responses
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [emailDraftOverlay, setEmailDraftOverlay] = useState<EmailDraft | null>(null); // Overlay state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true); // Track if component is mounted
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]); // Track all timeouts for cleanup
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null); // Track scroll timer
  const abortControllerRef = useRef<AbortController | null>(null); // ✅ Track abort controller
  const initialLoadDoneRef = useRef<number | null>(null); // ✅ Track initial load

  // Voice Chat Hook
  const voiceChat = useVoiceChat({
    onTranscript: (text) => {
      setInput(text);
    },
    language: 'vi-VN', // Vietnamese
  });

  // Cleanup on unmount - MUST be after voiceChat declaration
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      
      // ✅ Cancel pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cancel all pending timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      
      // Cancel scroll timer
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      // ✅ Revoke file URLs
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
      
      // ✅ Stop voice chat
      if (voiceChat.isListening) {
        voiceChat.stopListening();
      }
      if (voiceChat.isSpeaking) {
        voiceChat.stopSpeaking();
      }
    };
  }, [filePreview, voiceChat]);

  // Load chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatService.getSessions,
  });

  // Load messages for current session - DISABLE auto refetch to prevent DOM conflicts
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ['chat-messages', currentSessionId],
    queryFn: () => currentSessionId ? chatService.getMessages(currentSessionId) : Promise.resolve([]),
    enabled: !!currentSessionId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Never consider data stale
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

  // Save message mutation - DON'T invalidate queries to avoid DOM conflict
  const saveMessageMutation = useMutation({
    mutationFn: async ({ sessionId, sender, message }: { sessionId: number; sender: string; message: string }) => {
      const response = await springApi.post(`/api/chat/sessions/${sessionId}/messages`, { sender, message });
      console.log('Message saved:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Message saved successfully:', data);
      // DON'T invalidate queries here - it causes React DOM conflicts
      // Messages are already in local state, no need to reload from backend
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

  // Reset initialLoadDone when switching sessions
  useEffect(() => {
    if (currentSessionId && initialLoadDoneRef.current !== currentSessionId) {
      // Allow reload for new session
      initialLoadDoneRef.current = null;
    }
  }, [currentSessionId]);

  // Fetch Gemini models on mount
  useEffect(() => {
    console.log('🔄 Fetching Gemini models...');
    chatService.getModels()
      .then(data => {
        console.log('✨ Gemini models fetched:', data.models);
        setGeminiModels(data.models || []);
      })
      .catch(err => {
        console.error('❌ Error fetching Gemini models:', err);
      });
  }, []);

  // Fetch Groq models when provider changes to groq
  useEffect(() => {
    if (aiProvider === 'groq') {
      console.log('🔄 Fetching Groq models from API...');
      chatService.getGroqModels()
        .then(data => {
          console.log('⚡ Groq models fetched:', data.models);
          const models = data.models || [];
          if (models.length > 0) {
            setGroqModels(models);
            // If current selected model is not in the list, select the first one
            if (!models.find((m: any) => m.id === selectedGroqModel)) {
              setSelectedGroqModel(models[0].id);
            }
          }
        })
        .catch(err => {
          console.error('❌ Error fetching Groq models:', err);
          toast.error('Không thể lấy danh sách model Groq');
        });
    }
  }, [aiProvider]);

  // Convert backend messages to display format - ONLY on initial load
  useEffect(() => {
    if (!currentSessionId) return;
    if (initialLoadDoneRef.current === currentSessionId) {
      console.log('⏭️ Skipping message reload - already loaded for session', currentSessionId);
      return;
    }

    let isCancelled = false;

    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(currentSessionId);
        if (isCancelled) return;

        console.log('📥 Raw sessionMessages from backend:', data);

        if (data.length > 0) {
          const convertedMessages: Message[] = data.map((msg: ChatMessage) => ({
            id: msg.id.toString(),
            sender: msg.sender.toLowerCase() as 'user' | 'ai',
            text: msg.message,
            timestamp: new Date(msg.timestamp),
          }));

          console.log('✅ Converted messages:', convertedMessages.length);
          setMessages(convertedMessages);
        } else {
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

        initialLoadDoneRef.current = currentSessionId;
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [currentSessionId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length]); // ✅ Only depend on length, not entire array

  // Auto-adjust RAG based on mode
  useEffect(() => {
    if (chatMode === 'rag') {
      setUseRag(true);
    } else if (chatMode === 'normal' || chatMode === 'google-cloud' || chatMode === 'agent') {
      setUseRag(false);
    }
  }, [chatMode]);

  // Auto-send when voice transcript is complete
  useEffect(() => {
    if (!voiceChat.transcript || voiceChat.isListening) return;
    if (!voiceChat.transcript.trim()) return;
    
    const timer = setTimeout(() => {
      if (input === voiceChat.transcript && input.trim()) {
        handleSend();
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [voiceChat.transcript, voiceChat.isListening]); // ✅ Removed 'input' dependency

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || loading || !currentSessionId) {
      console.log('Cannot send:', { input: input.trim(), selectedFile, loading, currentSessionId });
      return;
    }

    // ✅ Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessageText = input.trim() || (selectedFile ?
      (selectedFile.type.startsWith('image/') ?
        'Phân tích và mô tả chi tiết nội dung trong ảnh này' :
        '📎 Đã gửi file đính kèm')
      : '');
    const tempMessageId = Date.now().toString();
    console.log('Sending message:', userMessageText, 'with file:', selectedFile?.name);

    // Prepare attachment data
    let attachmentData: { type: 'image' | 'file'; url: string; name: string; mimeType?: string } | undefined;
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (selectedFile && filePreview) {
      // For images, use the preview as attachment and prepare base64
      attachmentData = {
        type: 'image',
        url: filePreview,
        name: selectedFile.name,
        mimeType: selectedFile.type,
      };

      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Match = filePreview.match(/^data:(.+);base64,(.+)$/);
      if (base64Match) {
        imageMimeType = base64Match[1];
        imageBase64 = base64Match[2];
      }
    } else if (selectedFile) {
      // For non-image files, create a file URL
      attachmentData = {
        type: 'file',
        url: URL.createObjectURL(selectedFile),
        name: selectedFile.name,
        mimeType: selectedFile.type,
      };
    }

    // Create user message with "sending" status and attachment
    const userMessage: Message = {
      id: tempMessageId,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
      status: 'sending',
      attachment: attachmentData,
    };

    // Batch state updates to prevent multiple re-renders
    if (isMountedRef.current) {
      // Add user message to UI immediately with sending status
      setMessages((prev) => {
        console.log('Adding user message to UI with status: sending');
        return [...prev, userMessage];
      });
      setInput('');
      handleRemoveFile(); // Clear file selection
      setLoading(true);
    }

    try {
      // Save user message to database
      console.log('Saving user message to database...');
      const savedUserMsg = await saveMessageMutation.mutateAsync({
        sessionId: currentSessionId,
        sender: 'USER',
        message: userMessageText,
      });
      console.log('User message saved:', savedUserMsg);

      // Update message status to "sent" - simplified
      if (isMountedRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId ? { ...msg, status: 'sent', id: savedUserMsg.id.toString() } : msg
          )
        );
      }

      // Get AI response with image if present
      console.log('Getting AI response...', imageBase64 ? 'with image' : 'text only');
      const aiResponse = await chatService.sendMessageWithActions(
        userMessageText,
        useRag,
        aiProvider,
        aiProvider === 'groq' ? selectedGroqModel : selectedGeminiModel,
        imageBase64,
        imageMimeType
      );

      // Safely convert response to string (handle arrays and objects)
      let responseText = '';
      if (typeof aiResponse.response === 'string') {
        responseText = aiResponse.response;
      } else if (Array.isArray(aiResponse.response)) {
        // If response is an array, join it or stringify it
        responseText = aiResponse.response.flat(Infinity).join('\n');
      } else if (typeof aiResponse.response === 'object') {
        responseText = JSON.stringify(aiResponse.response, null, 2);
      } else {
        responseText = String(aiResponse.response);
      }

      console.log('AI response received:', responseText.substring(0, 100) + '...');
      console.log('🔍 FULL API RESPONSE:', JSON.stringify(aiResponse, null, 2));
      console.log('🔍 Email draft from API (snake_case):', aiResponse.email_draft);
      console.log('🔍 Email draft from API (camelCase):', aiResponse.emailDraft);
      console.log('🔍 Full API response keys:', Object.keys(aiResponse));

      // Check both snake_case and camelCase (Pydantic v2 may use either)
      let emailDraft = aiResponse.email_draft || aiResponse.emailDraft;
      
      // Fallback: Parse email draft from response text if API didn't return email_draft
      if (!emailDraft && responseText.includes('**Người nhận:**') && responseText.includes('**Chủ đề:**')) {
        console.log('📧 Parsing email draft from response text...');
        try {
          const toMatch = responseText.match(/\*\*Người nhận:\*\*\s*([^\n*]+)/);
          const subjectMatch = responseText.match(/\*\*Chủ đề:\*\*\s*([^\n*]+)/);
          const bodyMatch = responseText.match(/\*\*(?:📄\s*)?Nội dung:\*\*\s*([\s\S]*?)(?:---|💡|$)/);
          
          if (toMatch && subjectMatch) {
            emailDraft = {
              to: toMatch[1].trim(),
              subject: subjectMatch[1].trim(),
              body: bodyMatch ? bodyMatch[1].trim() : '',
              user_id: user?.id
            };
            console.log('📧 Parsed email draft:', emailDraft);
          }
        } catch (e) {
          console.error('Failed to parse email draft from text:', e);
        }
      }

      console.log('📧 Final emailDraft:', emailDraft);
      
      // ===== DEBUG: Check emailDraft structure =====
      if (emailDraft) {
        console.log('✅ emailDraft EXISTS!');
        console.log('   - Type:', typeof emailDraft);
        console.log('   - Keys:', Object.keys(emailDraft));
        console.log('   - to:', emailDraft.to);
        console.log('   - subject:', emailDraft.subject);
        console.log('   - body length:', emailDraft.body?.length);
      } else {
        console.log('❌ emailDraft is NULL/UNDEFINED');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: emailDraft ? '📧 Email draft đã được tạo. Vui lòng kiểm tra và gửi.' : responseText,
        timestamp: new Date(),
        actions: aiResponse.suggested_actions || [],
        toolAction: aiResponse.tool_action,
        emailDraft: emailDraft, // Add email draft if present
      };

      console.log('📧 Message created with emailDraft:', aiMessage.emailDraft);
      console.log('📧 Message.emailDraft exists?', !!aiMessage.emailDraft);

      // Add AI message to UI - simplified without RAF to reduce complexity
      if (isMountedRef.current) {
        setMessages((prev) => {
          console.log('📝 Adding AI message to UI');
          console.log('📝 Current messages count:', prev.length);
          console.log('📝 New message has emailDraft?', !!aiMessage.emailDraft);
          const newMessages = [...prev, aiMessage];
          console.log('📝 New messages count:', newMessages.length);
          console.log('📝 Last message emailDraft?', !!newMessages[newMessages.length - 1].emailDraft);
          return newMessages;
        });
        
        // Auto-open overlay if email draft exists
        console.log('🔍 Checking emailDraft:', emailDraft);
        console.log('🔍 emailDraft type:', typeof emailDraft);
        console.log('🔍 emailDraft is null?', emailDraft === null);
        console.log('🔍 emailDraft is undefined?', emailDraft === undefined);
        
        if (emailDraft) {
          console.log('🚀 Auto-opening email draft overlay');
          console.log('🚀 emailDraft data:', JSON.stringify(emailDraft));
          setEmailDraftOverlay(emailDraft);
          console.log('🚀 setEmailDraftOverlay called!');
        } else {
          console.log('❌ emailDraft is falsy, not opening overlay');
        }

        // ✅ Auto-speak AI response if enabled - SKIP for email draft
        if (autoSpeak && voiceChat.isSupported && !aiResponse.email_draft) {
          const speakTimeout = setTimeout(() => {
            if (isMountedRef.current) {
              voiceChat.speak(responseText);
            }
          }, 1000);
          timeoutsRef.current.push(speakTimeout);
        }

        // ✅ Auto-execute tool action if present
        if (aiResponse.tool_action && aiResponse.tool_action.auto_execute) {
          console.log('Auto-executing tool:', aiResponse.tool_action);
          console.log('isMountedRef.current:', isMountedRef.current);
          
          // Execute immediately instead of setTimeout
          try {
            console.log('🚀 Calling executeToolAction...');
            executeToolAction(aiResponse.tool_action);
            console.log('✅ executeToolAction completed');
          } catch (toolError) {
            console.error('❌ Tool execution failed:', toolError);
          }
        }
      }

      // Save AI message to database (skip email draft messages)
      if (!aiResponse.email_draft) {
        console.log('Saving AI message to database...');
        const savedAIMsg = await saveMessageMutation.mutateAsync({
          sessionId: currentSessionId,
          sender: 'AI',
          message: aiResponse.response,
        });
        console.log('AI message saved:', savedAIMsg);
      } else {
        console.log('⏭️ Skipping database save for email draft message');
      }

    } catch (error: any) {
      console.error('❌ Error sending message:', error);

      // Prevent infinite loops
      if (isMountedRef.current) {
        setLoading(false);
      }

      // Check if it's a quota exceeded error
      const errorMessage = error.response?.data?.detail || error.message || '';
      const isQuotaError = errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('exceeded');

      // Update message status to "error" with retry option
      if (isMountedRef.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId ? { ...msg, status: 'error', retryable: !isQuotaError } : msg
          )
        );
      }

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

        if (isMountedRef.current) {
          setMessages((prev) => [...prev, systemMessage]);
        }
      } else {
        toast.error('Không thể gửi tin nhắn. Nhấn để thử lại.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      abortControllerRef.current = null; // ✅ Clear abort controller
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
    try {
      if (!action || !action.url) {
        console.warn('Invalid action:', action);
        return;
      }

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
      } catch (urlError) {
        console.error('Invalid URL:', urlError);
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
    } catch (error) {
      console.error('❌ Error executing tool action:', error);
      toast.error('Không thể thực hiện hành động này');
    }
  };

  const handleNewSession = () => {
    const title = `Chat ${new Date().toLocaleString()}`;
    initialLoadDoneRef.current = null; // ✅ Reset to allow loading messages for new session
    createSessionMutation.mutate(title);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File quá lớn! Kích thước tối đa là 10MB');
      return;
    }

    // Check file type (images and common documents)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Loại file không được hỗ trợ! Chỉ chấp nhận: ảnh (JPG, PNG, GIF, WebP), PDF, TXT');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    toast.success(`Đã chọn: ${file.name}`);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        {/* Sidebar - ChatGPT Style */}
        <div className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800">
          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleNewSession}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New chat</span>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="text-xs text-gray-400 px-3 py-2 font-semibold">Recent</div>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-sm truncate block">{session.title}</span>
              </button>
            ))}
          </div>

          {/* User Info */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center space-x-2 px-2 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.username || 'User'}</div>
                <div className="text-xs text-gray-400">Free plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Quota Warning Banner */}
          <AnimatePresence mode="wait">
            {showQuotaWarning && (
              <QuotaWarningBanner onClose={() => setShowQuotaWarning(false)} />
            )}
          </AnimatePresence>

          {/* Header - Compact */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Learning Assistant
              </h1>
              <div className="flex items-center space-x-2">

                {/* Mode Selector - Compact */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setChatMode('normal')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${chatMode === 'normal'
                        ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}
                    title="Normal AI Chat"
                  >
                    🤖
                  </button>
                  <button
                    onClick={() => setChatMode('google-cloud')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${chatMode === 'google-cloud'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}
                    title="Google Cloud APIs"
                  >
                    🌐
                  </button>
                  <button
                    onClick={() => setChatMode('rag')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${chatMode === 'rag'
                        ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}
                    title="RAG Mode"
                  >
                    📚
                  </button>
                  <button
                    onClick={() => setChatMode('agent')}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${chatMode === 'agent'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}
                    title="Agent Mode"
                  >
                    🎓
                  </button>
                </div>

                {/* AI Provider Selector - Compact */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setAiProvider('gemini')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${aiProvider === 'gemini'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}
                    title="Google Gemini"
                  >
                    ✨
                  </button>
                  <button
                    onClick={() => setAiProvider('groq')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${aiProvider === 'groq'
                        ? 'bg-gray-800 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400'
                      }`}
                    title="Groq"
                  >
                    ⚡
                  </button>
                </div>

                {/* Model Selector - Compact */}
                {aiProvider === 'gemini' && geminiModels.length > 0 && (
                  <select
                    value={selectedGeminiModel}
                    onChange={(e) => setSelectedGeminiModel(e.target.value)}
                    className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
                  >
                    {geminiModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                )}

                {aiProvider === 'groq' && groqModels.length > 0 && (
                  <select
                    value={selectedGroqModel}
                    onChange={(e) => setSelectedGroqModel(e.target.value)}
                    className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
                  >
                    {groqModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* RAG Toggle */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRag}
                    onChange={(e) => setUseRag(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">RAG</span>
                </label>
              </div>
            </div>
          </div>

          {/* Messages Area - ChatGPT Style */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => {
                if (message.sender === 'ai' && message.emailDraft) {
                  console.log('🎨 Rendering AI message with emailDraft:', message.id, message.emailDraft);
                }
                
                return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  layout
                  className={`py-6 px-4 ${
                    message.sender === 'ai' ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="max-w-3xl mx-auto flex space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                          : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        }`}>
                        {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      {/* AI Provider Badge */}
                      {message.sender === 'ai' && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">
                          {aiProvider === 'groq' ? '⚡ Groq' : '✨ Gemini'}
                        </div>
                      )}

                      {/* Message Text */}
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                          {(() => {
                            try {
                              return typeof message.text === 'string'
                                ? message.text
                                : JSON.stringify(message.text, null, 2);
                            } catch (error) {
                              console.error('Error rendering message text:', error);
                              return '[Lỗi hiển thị tin nhắn]';
                            }
                          })()}
                        </div>
                      </div>

                          {/* File/Image Attachment Display */}
                          {message.attachment && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              {message.attachment.type === 'image' ? (
                                <div className="relative group">
                                  <img
                                    src={message.attachment.url}
                                    alt={message.attachment.name}
                                    className="max-w-xs rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.attachment!.url, '_blank')}
                                  />
                                  <div className="mt-1 text-xs opacity-70">
                                    📎 {message.attachment.name}
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={message.attachment.url}
                                  download={message.attachment.name}
                                  className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-sm">{message.attachment.name}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Tool Action Indicator */}
                          {message.sender === 'ai' && message.toolAction && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900 dark:to-purple-900 rounded-lg border border-primary-200 dark:border-primary-700">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                  <ExternalLink className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </motion.div>
                                <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                                  Đang mở tab mới...
                                </span>
                              </div>
                            </motion.div>
                          )}

                          {/* Action Links */}
                          {message.sender === 'ai' && message.actions && message.actions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">📚 Tài liệu tham khảo:</p>
                              {message.actions.map((action, idx) => (
                                <motion.a
                                  key={idx}
                                  href={action.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 group"
                                >
                                  <span className="text-lg">{action.icon}</span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {action.title}
                                  </span>
                                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                                </motion.a>
                              ))}
                            </div>
                          )}

                          <div className={`flex items-center justify-between mt-1 text-xs ${message.sender === 'user' ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
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
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-6 px-4 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="max-w-3xl mx-auto flex space-x-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="max-w-3xl mx-auto space-y-3">
                  className="py-6 px-4 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="max-w-3xl mx-auto flex space-x-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <div className="max-w-3xl mx-auto space-y-3">
                {/* Mode Helper Text - Compact */}
                {chatMode !== 'normal' && (
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                    {chatMode === 'google-cloud' && '🌐 Google Cloud Mode'}
                    {chatMode === 'rag' && '📚 RAG Mode - Searching knowledge base'}
                    {chatMode === 'agent' && '🎓 Agent Mode - Schedule, Grades, Email'}
                  </div>
                )}

                {/* Voice Chat Controls */}
                <div className="flex items-center justify-between mb-3">
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">🔊 Auto-speak</span>
                    </label>
                  )}
                </div>

                {/* File preview */}
                {(selectedFile || filePreview) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-2"
                  >
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {selectedFile?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Xóa file"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </motion.div>
                )}

                {/* Input Box */}
                <div className="flex items-end space-x-2">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Attach file"
                    disabled={loading || voiceChat.isListening}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Text input */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={selectedFile ? "Describe what to analyze..." : "Message ChatGPT..."}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    disabled={loading || voiceChat.isListening}
                  />

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={loading || (!input.trim() && !selectedFile) || voiceChat.isListening}
                    className={`p-3 rounded-xl transition-all ${
                      (input.trim() || selectedFile) && !loading && !voiceChat.isListening
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Draft Overlay */}
      {console.log('🎨 Rendering EmailDraftOverlay, draft:', emailDraftOverlay)}
      <EmailDraftOverlay
        draft={emailDraftOverlay}
        userId={user?.id}
        onClose={() => setEmailDraftOverlay(null)}
      />
    </ErrorBoundary>
  );
};

export default ChatPage;
                  </div>
                )}
                {chatMode === 'google-cloud' && (
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">🌐</span>
                    <div>
                      <p className="font-semibold text-blue-800">Google Cloud Mode</p>
                      <p className="text-sm text-blue-600">
                        Try: "Dịch sang tiếng Anh: Hello" • "Phân tích cảm xúc: Amazing!" • "Phân tích ảnh: [URL]"
                      </p>
                    </div>
                  </div>
                )}
                {chatMode === 'rag' && (
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">📚</span>
                    <div>
                      <p className="font-semibold text-green-800">RAG Mode</p>
                      <p className="text-sm text-green-600">
                        Searches knowledge base for accurate answers • Great for studying!
                      </p>
                    </div>
                  </div>
                )}
                {chatMode === 'agent' && (
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">🎓</span>
                    <div>
                      <p className="font-semibold text-purple-800">Agent Mode</p>
                      <p className="text-sm text-purple-600">
                        Try: "Xem thời khóa biểu" • "Điểm của tôi" • "Gửi email cho giáo viên"
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Đính kèm file hoặc ảnh"
                  disabled={loading || voiceChat.isListening}
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                <div className="flex-1 space-y-2">
                  {/* File preview */}
                  {(selectedFile || filePreview) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {selectedFile?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Xóa file"
                      >
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </motion.div>
                  )}

                  {/* Text input */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={selectedFile ? "Mô tả yêu cầu phân tích..." : "Type your message or use voice..."}
                    className="input-field w-full"
                    disabled={loading || voiceChat.isListening}
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={loading || (!input.trim() && !selectedFile) || voiceChat.isListening}
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
      
      {/* Email Draft Overlay - Auto-open when draft exists */}
      {console.log('🎨 Rendering EmailDraftOverlay, draft:', emailDraftOverlay)}
      <EmailDraftOverlay
        draft={emailDraftOverlay}
        userId={user?.id}
        onClose={() => setEmailDraftOverlay(null)}
      />
    </ErrorBoundary>
  );
};

export default ChatPage;
