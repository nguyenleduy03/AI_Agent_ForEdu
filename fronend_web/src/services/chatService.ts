import { springApi, fastApi } from './api';
import { ENDPOINTS } from '../config/api';
import type { ChatSession, ChatMessage } from '../types';

export const chatService = {
  // Chat Sessions
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await springApi.get(ENDPOINTS.CHAT.SESSIONS);
    return response.data;
  },

  createSession: async (title: string): Promise<ChatSession> => {
    const response = await springApi.post(ENDPOINTS.CHAT.CREATE_SESSION, { title });
    return response.data;
  },

  getMessages: async (sessionId: number): Promise<ChatMessage[]> => {
    const response = await springApi.get(ENDPOINTS.CHAT.MESSAGES(sessionId));
    return response.data;
  },

  deleteSession: async (sessionId: number): Promise<void> => {
    await springApi.delete(ENDPOINTS.CHAT.DELETE_SESSION(sessionId));
  },

  // AI Chat
  sendMessage: async (message: string, useRag: boolean = false): Promise<string> => {
    const response = await fastApi.post(ENDPOINTS.AI.CHAT, {
      message,
      use_rag: useRag,
    });
    return response.data.response;
  },

  sendMessageWithActions: async (
    message: string,
    useRag: boolean = false,
    aiProvider: string = 'gemini',
    model?: string,
    imageBase64?: string,
    imageMimeType?: string,
    sessionId?: number
  ): Promise<any> => {
    const response = await fastApi.post(ENDPOINTS.AI.CHAT, {
      message,
      use_rag: useRag,
      ai_provider: aiProvider,
      model: model,
      image_base64: imageBase64,
      image_mime_type: imageMimeType,
      session_id: sessionId,
    });
    return response.data;
  },

  getModels: async (): Promise<any> => {
    const response = await fastApi.get(ENDPOINTS.AI.MODELS);
    return response.data;
  },

  getGroqModels: async (): Promise<any> => {
    const response = await fastApi.get(ENDPOINTS.AI.GROQ_MODELS);
    return response.data;
  },
};
