import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, CheckCircle, Edit2, Save, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { quizService } from '../services/quizService';
import type { CreateQuizRequest } from '../services/quizService';
import { courseService } from '../services/courseService';
import { API_CONFIG } from '../config/api';

interface QuestionForm {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

interface PreviewQuiz {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questions: QuestionForm[];
}

const CreateQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const lessonIdNum = parseInt(lessonId || '0');

  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonIdNum],
    queryFn: () => courseService.getLesson(lessonIdNum),
  });

  // Mode: 'manual' or 'ai'
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  
  // Manual mode states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    },
  ]);

  // AI mode states
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [additionalText, setAdditionalText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<PreviewQuiz | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const createQuizMutation = useMutation({
    mutationFn: (data: CreateQuizRequest) => quizService.createQuiz(data),
    onSuccess: () => {
      toast.success('Tạo bài kiểm tra thành công!');
      navigate(`/lessons/${lessonIdNum}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể tạo bài kiểm tra');
    },
  });

  const aiGenerateQuizMutation = useMutation({
    mutationFn: () => quizService.generateQuiz(lessonIdNum, aiDifficulty, aiNumQuestions),
    onSuccess: () => {
      toast.success('AI đã tạo bài kiểm tra thành công!');
      navigate(`/lessons/${lessonIdNum}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'AI không thể tạo bài kiểm tra');
    },
  });

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error('Chỉ hỗ trợ file PDF, DOC, DOCX, TXT');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File không được vượt quá 10MB');
      return;
    }
    
    setUploadedFile(file);
    toast.success(`Đã chọn file: ${file.name}`);
  };

  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Generate preview with AI
  const handleGeneratePreview = async () => {
    if (aiNumQuestions < 1 || aiNumQuestions > 50) {
      toast.error('Số câu hỏi phải từ 1 đến 50');
      return;
    }
    
    setGenerating(true);
    
    try {
      let fileContent = '';
      if (uploadedFile) {
        try {
          fileContent = await readFileAsText(uploadedFile);
        } catch (err) {
          console.error('Error reading file:', err);
          toast.error('Không thể đọc file. Vui lòng thử file khác');
          setGenerating(false);
          return;
        }
      }
      
      const response = await fetch(`${API_CONFIG.FASTAPI_URL}/api/ai/generate-quiz-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: lesson?.content || '',
          num_questions: aiNumQuestions,
          difficulty: aiDifficulty,
          additional_text: additionalText || undefined,
          file_content: fileContent || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate');
      }
      
      const data = await response.json();
      setPreviewQuiz(data);
      setStep('preview');
      toast.success('AI đã tạo xong! Hãy xem lại và chỉnh sửa');
    } catch (error) {
      toast.error('Không thể tạo quiz. Vui lòng thử lại');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // Edit question
  const handleEditQuestion = (index: number, updated: QuestionForm) => {
    if (!previewQuiz) return;
    const newQuestions = [...previewQuiz.questions];
    newQuestions[index] = updated;
    setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
    setEditingIndex(null);
    toast.success('Đã cập nhật câu hỏi');
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    if (!previewQuiz) return;
    if (previewQuiz.questions.length <= 1) {
      toast.error('Phải có ít nhất 1 câu hỏi');
      return;
    }
    
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    
    const newQuestions = previewQuiz.questions.filter((_, i) => i !== index);
    setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
    toast.success('Đã xóa câu hỏi');
  };

  // Add new question
  const handleAddQuestion = () => {
    if (!previewQuiz) return;
    const newQuestion: QuestionForm = {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    };
    
    setPreviewQuiz({
      ...previewQuiz,
      questions: [...previewQuiz.questions, newQuestion],
    });
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // Save final quiz
  const handleSaveFinalQuiz = async () => {
    if (!previewQuiz) return;
    
    if (!previewQuiz.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    
    for (let i = 0; i < previewQuiz.questions.length; i++) {
      const q = previewQuiz.questions[i];
      if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || 
          !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`Câu ${i + 1}: Vui lòng điền đầy đủ thông tin`);
        return;
      }
    }
    
    createQuizMutation.mutate({
      lessonId: lessonIdNum,
      title: previewQuiz.title,
      description: previewQuiz.description,
      difficulty: previewQuiz.difficulty,
      questions: previewQuiz.questions,
    });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'ai') {
      return;
    }

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài kiểm tra');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`Câu hỏi ${i + 1}: Vui lòng điền đầy đủ thông tin`);
        return;
      }
    }

    createQuizMutation.mutate({
      lessonId: lessonIdNum,
      title,
      description,
      difficulty,
      questions,
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to={`/lessons/${lessonIdNum}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại bài học
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 mb-8 text-white"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tạo Bài Kiểm Tra Mới</h1>
              <p className="text-blue-100 mt-1">Cho bài học: {lesson?.title}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100 mb-6 flex gap-2"
        >
          <button
            type="button"
            onClick={() => {
              setMode('manual');
              setStep('config');
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✏️ Tạo thủ công
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ai');
              setStep('config');
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              mode === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🤖 AI tự động tạo
          </button>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'manual' ? (
          <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-xl font-bold mb-4">Thông tin bài kiểm tra</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Kiểm tra kiến thức chương 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Mô tả ngắn về bài kiểm tra này..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Độ khó</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Câu hỏi {index + 1}</h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Nhập câu hỏi..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {(['A', 'B', 'C', 'D'] as const).map((option) => (
                      <div key={option}>
                        <label className="block text-sm font-semibold mb-2">
                          Đáp án {option} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={q[`option${option}` as keyof QuestionForm] as string}
                          onChange={(e) =>
                            updateQuestion(index, `option${option}` as keyof QuestionForm, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Nhập đáp án ${option}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Đáp án đúng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Giải thích (tùy chọn)</label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Giải thích đáp án đúng..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm câu hỏi
          </button>

          </>
        ) : (
          <>
            {step === 'config' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-900">AI Tự động tạo câu hỏi</h2>
                    <p className="text-purple-700 text-sm">AI sẽ phân tích nội dung và tạo câu hỏi phù hợp</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-800">
                        Số lượng câu hỏi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={aiNumQuestions}
                        onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-800">
                        Độ khó <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as any)}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      >
                        <option value="easy">🟢 Dễ</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="hard">🔴 Khó</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      📝 Nội dung bổ sung (tùy chọn)
                    </label>
                    <textarea
                      value={additionalText}
                      onChange={(e) => setAdditionalText(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={6}
                      placeholder="Nhập thêm nội dung để AI tham khảo khi tạo câu hỏi...&#10;&#10;VD: Tập trung vào các khái niệm X, Y, Z&#10;Thêm ví dụ về A, B, C&#10;Bỏ qua phần D, E, F"
                    />
                    <p className="text-sm text-purple-600 mt-2">
                      💡 AI sẽ kết hợp nội dung bài học + text này để tạo câu hỏi chính xác hơn
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      📎 Tài liệu bổ sung (tùy chọn)
                    </label>
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-2 text-purple-500" />
                        <p className="text-gray-700 font-medium">
                          Click để chọn file hoặc kéo thả vào đây
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Hỗ trợ: PDF, DOC, DOCX, TXT (tối đa 10MB)
                        </p>
                      </label>
                    </div>
                    
                    {uploadedFile && (
                      <div className="mt-3 flex items-center gap-3 bg-purple-100 rounded-lg p-3">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-600">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-purple-100 rounded-xl p-6">
                    <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      AI sẽ tạo:
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>✓ <span className="font-semibold text-purple-700">{aiNumQuestions}</span> câu hỏi trắc nghiệm</li>
                      <li>✓ Dựa trên: Nội dung bài học + Text bổ sung + File upload</li>
                      <li>✓ Độ khó: <span className="font-semibold capitalize text-purple-700">
                        {aiDifficulty === 'easy' ? 'Dễ' : aiDifficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </span></li>
                      <li>✓ Bạn sẽ xem lại và chỉnh sửa trước khi lưu</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate(`/lessons/${lessonIdNum}`)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={generating}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        AI đang tạo...
                      </>
                    ) : (
                      <>
                        🤖 Để AI tạo quiz
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center text-xl">
                      ✨
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-green-900">AI đã tạo {previewQuiz?.questions.length} câu hỏi</h2>
                      <p className="text-green-700 text-sm">Xem lại và chỉnh sửa trước khi lưu</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-bold mb-4">Thông tin bài kiểm tra</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Tiêu đề</label>
                      <input
                        type="text"
                        value={previewQuiz?.title || ''}
                        onChange={(e) => setPreviewQuiz(prev => prev ? {...prev, title: e.target.value} : null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Mô tả</label>
                      <textarea
                        value={previewQuiz?.description || ''}
                        onChange={(e) => setPreviewQuiz(prev => prev ? {...prev, description: e.target.value} : null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Độ khó</label>
                      <select
                        value={previewQuiz?.difficulty || 'MEDIUM'}
                        onChange={(e) => setPreviewQuiz(prev => prev ? {...prev, difficulty: e.target.value as any} : null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {previewQuiz?.questions.map((q, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      {editingIndex === index ? (
                        <QuestionEditForm
                          question={q}
                          index={index}
                          onSave={(updated) => handleEditQuestion(index, updated)}
                          onCancel={() => setEditingIndex(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Câu hỏi {index + 1}</h3>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingIndex(index)}
                                className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(index)}
                                className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-gray-900 font-medium">{q.question}</p>
                            <div className="grid gap-2">
                              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                                <div
                                  key={option}
                                  className={`p-3 rounded-lg border-2 ${
                                    q.correctAnswer === option
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  <span className="font-semibold">{option}.</span> {q[`option${option}` as keyof QuestionForm]}
                                  {q.correctAnswer === option && (
                                    <span className="ml-2 text-green-600 font-semibold">✓ Đúng</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold">Giải thích:</span> {q.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm câu hỏi
                </button>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('config');
                      setPreviewQuiz(null);
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={generating}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {generating ? 'Đang tạo lại...' : '🔄 Tạo lại'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFinalQuiz}
                    disabled={createQuizMutation.isPending}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createQuizMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        💾 Lưu bài kiểm tra
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}

          {mode === 'manual' && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(`/lessons/${lessonIdNum}`)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createQuizMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createQuizMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Tạo bài kiểm tra
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

interface QuestionEditFormProps {
  question: QuestionForm;
  index: number;
  onSave: (updated: QuestionForm) => void;
  onCancel: () => void;
}

const QuestionEditForm: React.FC<QuestionEditFormProps> = ({ question, index, onSave, onCancel }) => {
  const [edited, setEdited] = useState<QuestionForm>(question);

  const handleChange = (field: keyof QuestionForm, value: string) => {
    setEdited(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Chỉnh sửa câu hỏi {index + 1}</h3>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Câu hỏi</label>
        <textarea
          value={edited.question}
          onChange={(e) => handleChange('question', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(['A', 'B', 'C', 'D'] as const).map((option) => (
          <div key={option}>
            <label className="block text-sm font-semibold mb-2">Đáp án {option}</label>
            <input
              type="text"
              value={edited[`option${option}` as keyof QuestionForm] as string}
              onChange={(e) => handleChange(`option${option}` as keyof QuestionForm, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Đáp án đúng</label>
          <select
            value={edited.correctAnswer}
            onChange={(e) => handleChange('correctAnswer', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Giải thích</label>
          <input
            type="text"
            value={edited.explanation || ''}
            onChange={(e) => handleChange('explanation', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Hủy
        </button>
        <button
          type="button"
          onClick={() => onSave(edited)}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
};

export default CreateQuizPage;
