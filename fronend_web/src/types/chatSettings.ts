// Chat Settings Type Definition
export interface ChatSettingsType {
  // AI Provider
  aiProvider: 'gemini' | 'groq';
  geminiModel: string;
  groqModel: string;
  
  // Chat Mode
  chatMode: 'normal' | 'google-cloud' | 'rag' | 'agent';
  useRag: boolean;
  
  // Voice
  autoSpeak: boolean;
  voiceLanguage: 'vi-VN' | 'en-US';
  voiceSpeed: number;
  
  // Display
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  showTimestamp: boolean;
  compactMode: boolean;
  
  // Features
  enableFileUpload: boolean;
  enableVoiceChat: boolean;
  enableToolActions: boolean;
  
  // Advanced
  maxTokens: number;
  temperature: number;
  topP: number;
}
