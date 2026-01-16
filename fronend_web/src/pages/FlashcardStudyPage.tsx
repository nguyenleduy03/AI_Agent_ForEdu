import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import type { Flashcard } from '../types/flashcard';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const FlashcardStudyPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [studyComplete, setStudyComplete] = useState(false);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (studyComplete) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      }
      if (isFlipped) {
        if (e.key === '1') handleReview(0);
        if (e.key === '2') handleReview(1);
        if (e.key === '3') handleReview(3);
        if (e.key === '4') handleReview(5);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, currentIndex, studyComplete]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const dueCards = await flashcardService.getDueCards(Number(deckId), 50);
      const newCards = await flashcardService.getNewCards(Number(deckId), 20);
      const allCards = [...dueCards, ...newCards.slice(0, 20 - dueCards.length)];
      setCards(allCards);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality: number) => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const currentCard = cards[currentIndex];

    try {
      await flashcardService.submitReview({
        flashcardId: currentCard.id,
        quality,
        timeTakenSeconds: timeTaken,
      });

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setStartTime(Date.now());
      } else {
        setStudyComplete(true);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Lỗi khi lưu kết quả. Vui lòng thử lại.');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyComplete(false);
    setStartTime(Date.now());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải thẻ...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Không có thẻ nào cần ôn!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Quay lại sau nhé</p>
          <button
            onClick={() => navigate('/flashcards')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Quay về trang chính
          </button>
        </div>
      </div>
    );
  }

  if (studyComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-2 dark:text-white">Hoàn thành!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bạn đã ôn xong {cards.length} thẻ
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/flashcards')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 dark:text-white"
            >
              Về trang chính
            </button>
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <RotateCcw size={20} />
              Học lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-dark-900 dark:to-dark-800 p-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/flashcards')}
        className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Thẻ {currentIndex + 1} / {cards.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="relative h-96 cursor-pointer"
          onClick={handleFlip}
          style={{ perspective: 1000 }}
        >
          <motion.div
            className="absolute w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front side */}
            <div
              className="absolute w-full h-full bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Câu hỏi:</p>
              <p className="text-2xl font-bold text-center dark:text-white mb-4">
                {currentCard.front}
              </p>
              {currentCard.hint && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-4 italic">
                  💡 {currentCard.hint}
                </p>
              )}
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
                👆 Nhấp để lật thẻ (hoặc Space)
              </p>
            </div>

            {/* Back side */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <p className="text-sm opacity-80 mb-4">Câu trả lời:</p>
              <p className="text-2xl font-bold text-center mb-4">{currentCard.back}</p>
              {currentCard.explanation && (
                <p className="text-sm opacity-90 mt-4 text-center max-w-lg">
                  📝 {currentCard.explanation}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Review buttons */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-3 mt-8"
          >
            <button
              onClick={() => handleReview(0)}
              className="px-4 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
            >
              <div className="text-lg">Quên</div>
              <div className="text-xs font-normal mt-1">1 phút</div>
            </button>
            <button
              onClick={() => handleReview(1)}
              className="px-4 py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
            >
              <div className="text-lg">Khó</div>
              <div className="text-xs font-normal mt-1">10 phút</div>
            </button>
            <button
              onClick={() => handleReview(3)}
              className="px-4 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
            >
              <div className="text-lg">Tốt</div>
              <div className="text-xs font-normal mt-1">1 ngày</div>
            </button>
            <button
              onClick={() => handleReview(5)}
              className="px-4 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
            >
              <div className="text-lg">Dễ</div>
              <div className="text-xs font-normal mt-1">4 ngày</div>
            </button>
          </motion.div>
        )}

        {/* Keyboard shortcuts hint */}
        {!isFlipped && (
          <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Phím tắt: Space (lật) • 1 (Quên) • 2 (Khó) • 3 (Tốt) • 4 (Dễ)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardStudyPage;
