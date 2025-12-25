import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { quizService } from '../services/quizService';

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = parseInt(id || '0');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizService.getQuiz(quizId),
  });

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== data?.questions?.length) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      const result = await quizService.submitQuiz(quizId, answers);
      setResult(result);
      setSubmitted(true);
      toast.success('Quiz submitted successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted && result) {
    const percentage = (result.score || (result.correctAnswers / result.totalQuestions) * 100);
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Result Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white mx-auto mb-6 ${
              percentage >= 50 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-orange-500'
            }`}>
              <Trophy className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
            <div className={`text-6xl font-bold mb-4 ${
              percentage >= 50 ? 'text-green-600' : 'text-red-600'
            }`}>
              {percentage.toFixed(0)}%
            </div>
            <p className="text-xl text-gray-600 mb-2">
              {result.correctAnswers} / {result.totalQuestions} câu đúng
            </p>
            <p className="text-lg text-gray-500 mb-6">{result.message}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Về Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Làm lại
              </button>
            </div>
          </motion.div>

          {/* Answer Review Section */}
          {result.questionResults && result.questionResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div 
                className="flex items-center justify-between bg-white rounded-xl p-4 shadow-lg mb-4 cursor-pointer"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                <h2 className="text-xl font-bold">Xem đáp án chi tiết</h2>
                {showAnswers ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </div>

              {showAnswers && (
                <div className="space-y-4">
                  {result.questionResults.map((qr: any, index: number) => (
                    <motion.div
                      key={qr.questionId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${
                        qr.isCorrect ? 'border-green-500' : 'border-red-500'
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          qr.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {qr.isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg mb-1">Câu {index + 1}</p>
                          <p className="text-gray-800">{qr.question}</p>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2 ml-14">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const optionText = qr[`option${option}`];
                          const isUserAnswer = qr.userAnswer === option;
                          const isCorrectAnswer = qr.correctAnswer === option;
                          
                          let bgColor = 'bg-gray-50';
                          let textColor = 'text-gray-700';
                          let borderColor = 'border-gray-200';
                          
                          if (isCorrectAnswer) {
                            bgColor = 'bg-green-50';
                            textColor = 'text-green-700';
                            borderColor = 'border-green-300';
                          } else if (isUserAnswer && !qr.isCorrect) {
                            bgColor = 'bg-red-50';
                            textColor = 'text-red-700';
                            borderColor = 'border-red-300';
                          }
                          
                          return (
                            <div
                              key={option}
                              className={`flex items-center p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
                            >
                              <span className={`font-semibold mr-3 ${textColor}`}>{option}.</span>
                              <span className={textColor}>{optionText}</span>
                              {isCorrectAnswer && (
                                <span className="ml-auto text-green-600 font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Đáp án đúng
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="ml-auto text-red-600 font-semibold flex items-center gap-1">
                                  <XCircle className="w-4 h-4" /> Bạn chọn
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {qr.explanation && (
                        <div className="mt-4 ml-14 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-blue-800 mb-1">💡 Giải thích:</p>
                          <p className="text-blue-700">{qr.explanation}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-2">{data?.title || 'Quiz'}</h1>
          {data?.description && (
            <p className="text-gray-600 mb-3">{data.description}</p>
          )}
          <p className="text-gray-600">
            Difficulty: <span className="font-medium capitalize">{data?.difficulty?.toLowerCase()}</span>
          </p>
          <p className="text-gray-600">
            Questions: {data?.questions?.length || 0}
          </p>
        </div>

        <div className="space-y-6">
          {data?.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <h3 className="font-bold text-lg mb-4">
                {index + 1}. {question.question}
              </h3>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = question[`option${option}` as keyof typeof question] as string;
                  const isSelected = answers[question.id] === option;
                  return (
                    <label
                      key={option}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="w-5 h-5 text-primary-600"
                      />
                      <span className="ml-3 flex-1">
                        <span className="font-medium mr-2">{option}.</span>
                        {optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== (data?.questions?.length || 0)}
            className="btn-primary text-lg px-8 py-4"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default QuizPage;
