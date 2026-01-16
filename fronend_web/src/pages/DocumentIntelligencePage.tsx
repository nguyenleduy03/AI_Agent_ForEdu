import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Upload, Type, Book, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { documentService, type Flashcard } from '../services/documentService';

type TabType = 'text' | 'upload';

const DocumentIntelligencePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [summary, setSummary] = useState('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);

  const handleTextSubmit = async () => {
    if (!text.trim()) {
      toast.error('Vui lòng nhập nội dung!');
      return;
    }

    if (text.length < 50) {
      toast.error('Nội dung quá ngắn! Cần ít nhất 50 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const response = await documentService.textToFlashcards(text, numCards, difficulty);
      
      if (response.success && response.flashcards.length > 0) {
        setFlashcards(response.flashcards);
        toast.success(`✅ Đã tạo ${response.num_flashcards} flashcards!`);
      } else {
        toast.error('Không thể tạo flashcards. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToFlashcardSystem = () => {
    // TODO: Integrate with existing flashcard system
    // Call API to save flashcards to database
    toast.success('🎴 Đang phát triển: Lưu vào hệ thống flashcard...');
  };

  const exampleTexts = [
    {
      title: 'Python Programming',
      text: 'Python là ngôn ngữ lập trình bậc cao, được thiết kế với triết lý mã nguồn rõ ràng. Các tính năng chính: Dynamic typing - kiểu dữ liệu động, Garbage collection - thu gom rác tự động, Extensive standard library - thư viện chuẩn phong phú. Python được sử dụng rộng rãi trong Web development (Django, Flask), Data science (Pandas, NumPy), Machine Learning (TensorFlow, PyTorch), và Automation & Scripting.',
    },
    {
      title: 'Machine Learning',
      text: 'Machine Learning là nhánh của AI cho phép máy tính học từ dữ liệu mà không cần lập trình cụ thể. Có 3 loại chính: Supervised Learning - học có giám sát với labeled data, Unsupervised Learning - học không giám sát tìm patterns, và Reinforcement Learning - học qua thưởng phạt. Các thuật toán phổ biến: Linear Regression, Decision Trees, Neural Networks, K-Means Clustering.',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-10 h-10 text-purple-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Document Intelligence
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              🤖 AI tự động tạo flashcards từ tài liệu học tập
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 bg-white rounded-lg p-2 shadow-sm">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Type className="w-5 h-5" />
              Paste Text
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload File
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                {activeTab === 'text' ? 'Nhập nội dung' : 'Upload tài liệu'}
              </h2>

              {activeTab === 'text' ? (
                <div className="space-y-4">
                  {/* Example buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-sm text-gray-500">Ví dụ:</span>
                    {exampleTexts.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setText(example.text)}
                        className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
                      >
                        {example.title}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste nội dung bài học, lecture notes, hoặc tài liệu cần tạo flashcards...

Ví dụ: 
- Copy từ slide bài giảng
- Paste từ sách giáo khoa
- Nhập notes của bạn

Cần ít nhất 50 ký tự."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <div className="text-sm text-gray-500">
                    {text.length} ký tự {text.length < 50 && text.length > 0 && '(Cần ít nhất 50)'}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      Click để upload hoặc kéo thả file vào đây
                    </p>
                    <p className="text-sm text-gray-500">
                      Hỗ trợ: PDF, DOCX, TXT, ảnh (OCR)
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Upload file đang được phát triển. Hiện tại hãy dùng tab "Paste Text"
                    </p>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng flashcards
                  </label>
                  <input
                    type="number"
                    value={numCards}
                    onChange={(e) => setNumCards(parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ khó
                  </label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                          difficulty === level
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level === 'easy' ? '😊 Dễ' : level === 'medium' ? '📚 Trung bình' : '🔥 Khó'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleTextSubmit}
                  disabled={loading || (activeTab === 'text' && text.length < 50)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Đang tạo flashcards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Tạo Flashcards bằng AI
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Right Panel - Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Book className="w-6 h-6 text-green-600" />
                Kết quả ({flashcards.length} flashcards)
              </h2>

              {flashcards.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Flashcards sẽ hiển thị ở đây</p>
                  <p className="text-sm mt-2">Nhập nội dung và nhấn "Tạo Flashcards"</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {/* Summary */}
                  {summary && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-green-800 mb-2">📝 Tóm tắt</h3>
                      <p className="text-sm text-green-700">{summary}</p>
                    </div>
                  )}

                  {/* Key Concepts */}
                  {keyConcepts.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-purple-800 mb-2">🎯 Khái niệm chính</h3>
                      <div className="flex flex-wrap gap-2">
                        {keyConcepts.map((concept, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm border border-purple-200"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flashcards */}
                  {flashcards.map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">❓ {card.question}</p>
                        </div>
                      </div>
                      <div className="ml-8 space-y-2">
                        <p className="text-green-700">
                          <span className="font-medium">✅ Trả lời:</span> {card.answer}
                        </p>
                        {card.hint && (
                          <p className="text-green-600 text-sm">
                            <span className="font-medium">💡 Gợi ý:</span> {card.hint}
                          </p>
                        )}
                        {card.explanation && (
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">📖 Giải thích:</span> {card.explanation}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Save Button */}
                  <button
                    onClick={handleSaveToFlashcardSystem}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Lưu vào Flashcard System
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid md:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-purple-600 mb-2">⚡ Nhanh chóng</h3>
              <p className="text-sm text-gray-600">
                AI tạo flashcards trong vài giây, tiết kiệm hàng giờ làm thủ công
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-green-600 mb-2">🎯 Chính xác</h3>
              <p className="text-sm text-gray-600">
                Trích xuất key concepts, tạo câu hỏi chất lượng cao từ Gemini AI
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-green-600 mb-2">🔄 Linh hoạt</h3>
              <p className="text-sm text-gray-600">
                Chỉnh độ khó, số lượng câu hỏi theo nhu cầu học tập
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default DocumentIntelligencePage;
