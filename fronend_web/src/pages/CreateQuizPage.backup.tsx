import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { quizService } from '../services/quizService';
import type { CreateQuizRequest } from '../services/quizService';
import { courseService } from '../services/courseService';

interface QuestionForm {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
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
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

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
      // AI generation mode
      if (aiNumQuestions < 1 || aiNumQuestions > 50) {
        toast.error('Số câu hỏi phải từ 1 đến 50');
        return;
      }
      aiGenerateQuizMutation.mutate();
      return;
    }

    // Manual mode validation
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to={`/lessons/${lessonIdNum}`}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại bài học
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-8 mb-8 text-white"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tạo Bài Kiểm Tra Mới</h1>
              <p className="text-green-100 mt-1">Cho bài học: {lesson?.title}</p>
            </div>
          </div>
        </motion.div>

        {/* Mode Selection Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100 mb-6 flex gap-2"
        >
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✏️ Tạo thủ công
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              mode === 'ai'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🤖 AI tự động tạo
          </button>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'manual' ? (
          // MANUAL MODE
          <>
          {/* Quiz Info */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="VD: Kiểm tra kiến thức chương 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Mô tả ngắn về bài kiểm tra này..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Độ khó</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Questions */}
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Giải thích đáp án đúng..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add Question Button */}
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-green-500 hover:text-green-600 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm câu hỏi
          </button>

          </>
        ) : (
          // AI MODE
          <>
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
                  <p className="text-purple-700 text-sm">AI sẽ phân tích nội dung bài học và tạo câu hỏi phù hợp</p>
                </div>
              </div>

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
                    placeholder="VD: 10"
                  />
                  <p className="text-sm text-gray-600 mt-1">Từ 1 đến 50 câu hỏi</p>
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

              <div className="mt-6 bg-purple-100 rounded-xl p-6">
                <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  AI sẽ tạo:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ <span className="font-semibold text-purple-700">{aiNumQuestions}</span> câu hỏi trắc nghiệm 4 đáp án</li>
                  <li>✓ Dựa trên nội dung bài học: <span className="font-semibold text-purple-700">{lesson?.title}</span></li>
                  <li>✓ Độ khó: <span className="font-semibold capitalize text-purple-700">{aiDifficulty === 'easy' ? 'Dễ' : aiDifficulty === 'medium' ? 'Trung bình' : 'Khó'}</span></li>
                  <li>✓ Tự động chọn đáp án đúng</li>
                  <li>✓ Có thể sử dụng ngay sau khi tạo</li>
                </ul>
              </div>
            </motion.div>
          </>
        )}

          {/* Submit Button */}
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
              disabled={createQuizMutation.isPending || aiGenerateQuizMutation.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createQuizMutation.isPending || aiGenerateQuizMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'ai' ? 'AI đang tạo...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {mode === 'ai' ? '🤖 Để AI tạo quiz' : 'Tạo bài kiểm tra'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateQuizPage;
