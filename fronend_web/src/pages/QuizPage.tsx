import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft } from 'lucide-react';
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

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizService.getQuiz(quizId),
  });

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== data?.questions.length) {
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
    const percentage = (result.score / result.totalQuestions) * 100;
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white mx-auto mb-6">
              <Trophy className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {percentage.toFixed(0)}%
            </div>
            <p className="text-xl text-gray-600 mb-8">
              You scored {result.score} out of {result.totalQuestions}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          </motion.div>
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
          <h1 className="text-3xl font-bold mb-2">{data?.quiz.title}</h1>
          <p className="text-gray-600">
            Difficulty: <span className="font-medium capitalize">{data?.quiz.difficulty}</span>
          </p>
          <p className="text-gray-600">
            Questions: {data?.questions.length}
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
            disabled={Object.keys(answers).length !== data?.questions.length}
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
