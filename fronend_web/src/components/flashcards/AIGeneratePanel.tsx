import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Plus, Check, X, FileText, BookOpen, Upload, File, Trash2 } from 'lucide-react';
import { flashcardService } from '../../services/flashcardService';
import type { FlashcardDeck } from '../../types/flashcard';

interface GeneratedCard {
  front: string;
  back: string;
  hint?: string;
  selected: boolean;
}

interface Props {
  decks: FlashcardDeck[];
  onCardsCreated: () => void;
}

type InputMode = 'text' | 'file';

const AIGeneratePanel: React.FC<Props> = ({ decks, onCardsCreated }) => {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [inputText, setInputText] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [numCards, setNumCards] = useState(5);
  const [aiProvider, setAiProvider] = useState<'groq' | 'gemini'>('groq');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractingText, setExtractingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExtensions = ['.txt', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Chỉ hỗ trợ file TXT, PDF, DOCX. File .DOC cũ vui lòng lưu lại thành .DOCX');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File quá lớn. Tối đa 10MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Extract text from file
    await extractTextFromFile(file);
  };

  const extractTextFromFile = async (file: File) => {
    setExtractingText(true);
    setError('');

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'txt') {
        // Read TXT file directly
        const text = await file.text();
        setInputText(text);
      } else {
        // For PDF/DOCX, send to backend for extraction
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8000/api/flashcards/extract-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Không thể đọc file');
        }

        const data = await response.json();
        setInputText(data.text || '');
      }
    } catch (err: any) {
      console.error('Extract text error:', err);
      setError(err.message || 'Lỗi khi đọc file. Vui lòng thử lại.');
      setSelectedFile(null);
    } finally {
      setExtractingText(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setInputText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập nội dung để tạo flashcards');
      return;
    }
    if (inputText.trim().length < 50) {
      setError('Nội dung quá ngắn. Vui lòng nhập ít nhất 50 ký tự.');
      return;
    }

    setError('');
    setGenerating(true);
    setGeneratedCards([]);

    try {
      const result = await flashcardService.generateCardsFromText(inputText, numCards, aiProvider);
      
      if (result.cards && result.cards.length > 0) {
        setGeneratedCards(result.cards.map((card: any) => ({
          ...card,
          selected: true
        })));
        
        // Show warning if text was truncated
        if (result.warning) {
          setError(result.warning);
        }
      } else {
        setError('Không thể tạo flashcards từ nội dung này. Vui lòng thử lại với nội dung khác.');
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      setError(err.response?.data?.detail || err.message || 'Lỗi khi tạo flashcards. Vui lòng thử lại.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleCardSelection = (index: number) => {
    setGeneratedCards(prev => prev.map((card, i) => 
      i === index ? { ...card, selected: !card.selected } : card
    ));
  };

  const selectAll = () => {
    setGeneratedCards(prev => prev.map(card => ({ ...card, selected: true })));
  };

  const deselectAll = () => {
    setGeneratedCards(prev => prev.map(card => ({ ...card, selected: false })));
  };

  const handleSaveCards = async () => {
    if (!selectedDeckId) {
      setError('Vui lòng chọn bộ thẻ để lưu');
      return;
    }

    const cardsToSave = generatedCards.filter(c => c.selected);
    if (cardsToSave.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thẻ để lưu');
      return;
    }

    setSaving(true);
    setError('');

    try {
      for (const card of cardsToSave) {
        await flashcardService.createCard(selectedDeckId, {
          front: card.front,
          back: card.back,
          hint: card.hint,
        });
      }
      
      // Reset state
      setGeneratedCards([]);
      setInputText('');
      setSelectedFile(null);
      onCardsCreated();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu flashcards');
    } finally {
      setSaving(false);
    }
  };

  const updateCard = (index: number, field: 'front' | 'back' | 'hint', value: string) => {
    setGeneratedCards(prev => prev.map((card, i) => 
      i === index ? { ...card, [field]: value } : card
    ));
  };

  const selectedCount = generatedCards.filter(c => c.selected).length;

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    return '📃';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Flashcard Generator</h2>
            <p className="text-white/80 text-sm">Tự động tạo flashcards từ văn bản hoặc file</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Input Mode Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
          <button
            onClick={() => setInputMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              inputMode === 'text'
                ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Nhập văn bản
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              inputMode === 'file'
                ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload file
          </button>
        </div>

        {/* Input Section */}
        {inputMode === 'text' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Nhập nội dung học tập
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dán nội dung bài học, ghi chú, hoặc bất kỳ văn bản nào bạn muốn tạo flashcards..."
              className="w-full h-40 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                       focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900
                       dark:bg-gray-700 dark:text-white resize-none transition-all"
              disabled={generating}
            />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{inputText.length} ký tự</span>
              <span>Tối thiểu 50 ký tự</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Upload className="w-4 h-4 inline mr-2" />
              Upload file (TXT, PDF, DOCX)
            </label>
            
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8
                         hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20
                         cursor-pointer transition-all text-center"
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Click để chọn file hoặc kéo thả vào đây
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Hỗ trợ: TXT, PDF, DOCX (tối đa 10MB)
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ File .DOC cũ không hỗ trợ - vui lòng lưu lại thành .DOCX
                </p>
              </div>
            ) : (
              <div className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getFileIcon(selectedFile.name)}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                
                {extractingText && (
                  <div className="mt-3 flex items-center gap-2 text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Đang đọc nội dung file...</span>
                  </div>
                )}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Show extracted text preview */}
            {inputText && selectedFile && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nội dung đã trích xuất ({inputText.length} ký tự)
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                           dark:bg-gray-700 dark:text-white resize-none text-sm"
                  placeholder="Nội dung file sẽ hiển thị ở đây..."
                />
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Số lượng thẻ
            </label>
            <select
              value={numCards}
              onChange={(e) => setNumCards(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                       focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              disabled={generating}
            >
              <option value={3}>3 thẻ</option>
              <option value={5}>5 thẻ</option>
              <option value={10}>10 thẻ</option>
              <option value={15}>15 thẻ</option>
              <option value={20}>20 thẻ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🤖 AI Model
            </label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as 'groq' | 'gemini')}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                       focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              disabled={generating}
            >
              <option value="groq">🚀 Groq (Nhanh)</option>
              <option value="gemini">✨ Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Lưu vào bộ thẻ
            </label>
            <select
              value={selectedDeckId || ''}
              onChange={(e) => setSelectedDeckId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                       focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Chọn bộ thẻ --</option>
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>
                  {deck.icon} {deck.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !inputText.trim() || extractingText}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl
                   font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tạo flashcards...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Tạo Flashcards với AI
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                        rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Generated Cards Preview */}
        <AnimatePresence>
          {generatedCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  Đã tạo {generatedCards.length} thẻ ({selectedCount} đã chọn)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedCards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      card.selected 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCardSelection(index)}
                        className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          card.selected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {card.selected && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Câu hỏi</label>
                          <input
                            type="text"
                            value={card.front}
                            onChange={(e) => updateCard(index, 'front', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Câu trả lời</label>
                          <input
                            type="text"
                            value={card.back}
                            onChange={(e) => updateCard(index, 'back', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                     dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </div>
                        {card.hint && (
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Gợi ý</label>
                            <input
                              type="text"
                              value={card.hint}
                              onChange={(e) => updateCard(index, 'hint', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                                       dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveCards}
                disabled={saving || selectedCount === 0 || !selectedDeckId}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold
                         hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Lưu {selectedCount} thẻ vào bộ thẻ
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIGeneratePanel;
