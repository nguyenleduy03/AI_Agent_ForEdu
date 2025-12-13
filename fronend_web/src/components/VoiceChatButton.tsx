/**
 * Voice Chat Button Component
 * - Microphone button để ghi âm
 * - Animation khi đang nghe
 * - Hiển thị transcript real-time
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, VolumeX } from 'lucide-react';

interface VoiceChatButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

const VoiceChatButton = ({
  isListening,
  isSpeaking,
  isSupported,
  transcript,
  onStartListening,
  onStopListening,
  onStopSpeaking,
}: VoiceChatButtonProps) => {
  if (!isSupported) {
    return (
      <div className="text-xs text-gray-400 text-center">
        Trình duyệt không hỗ trợ Voice Chat
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Microphone Button */}
      <div className="relative">
        <motion.button
          onClick={isListening ? onStopListening : onStartListening}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>

        {/* Listening Animation - Ripple Effect */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </div>

      {/* Speaking Button */}
      {isSpeaking && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onStopSpeaking}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm transition-colors"
          title="Dừng đọc"
        >
          <VolumeX className="w-4 h-4" />
          <span>Dừng đọc</span>
        </motion.button>
      )}

      {/* Transcript Display */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-gray-100 rounded-lg max-w-xs"
          >
            <p className="text-sm text-gray-700 text-center">
              <span className="font-medium">Đang nghe:</span> {transcript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Text */}
      <div className="text-xs text-gray-500 text-center">
        {isListening && '🎤 Đang nghe...'}
        {isSpeaking && '🔊 Đang đọc...'}
        {!isListening && !isSpeaking && 'Nhấn mic để nói'}
      </div>
    </div>
  );
};

export default VoiceChatButton;
