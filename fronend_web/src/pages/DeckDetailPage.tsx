import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import type { FlashcardDeck, Flashcard } from '../types/flashcard';
import { ArrowLeft, Plus, Edit, Trash2, Play } from 'lucide-react';

const DeckDetailPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardHint, setCardHint] = useState('');
  const [cardExplanation, setCardExplanation] = useState('');

  useEffect(() => {
    if (deckId) {
      loadDeckData();
    }
  }, [deckId]);

  const loadDeckData = async () => {
    try {
      setLoading(true);
      const [deckData, cardsData] = await Promise.all([
        flashcardService.getDeck(Number(deckId)),
        flashcardService.getCardsInDeck(Number(deckId))
      ]);
      setDeck(deckData);
      setCards(cardsData);
    } catch (error) {
      console.error('Failed to load deck:', error);
      alert('Không thể tải bộ thẻ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) return;

    try {
      await flashcardService.createCard(Number(deckId), {
        front: cardFront,
        back: cardBack,
        hint: cardHint || undefined,
        explanation: cardExplanation || undefined,
      });
      
      setCardFront('');
      setCardBack('');
      setCardHint('');
      setCardExplanation('');
      setShowAddModal(false);
      loadDeckData();
    } catch (error) {
      console.error('Failed to create card:', error);
      alert('Không thể tạo thẻ. Vui lòng thử lại.');
    }
  };

  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !cardFront.trim() || !cardBack.trim()) return;

    try {
      await flashcardService.updateCard(editingCard.id, {
        front: cardFront,
        back: cardBack,
        hint: cardHint || undefined,
        explanation: cardExplanation || undefined,
      });
      
      setEditingCard(null);
      setCardFront('');
      setCardBack('');
      setCardHint('');
      setCardExplanation('');
      loadDeckData();
    } catch (error) {
      console.error('Failed to update card:', error);
      alert('Không thể cập nhật thẻ. Vui lòng thử lại.');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!window.confirm('Xóa thẻ này?')) return;

    try {
      await flashcardService.deleteCard(cardId);
      loadDeckData();
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('Không thể xóa thẻ. Vui lòng thử lại.');
    }
  };

  const openAddModal = () => {
    setEditingCard(null);
    setCardFront('');
    setCardBack('');
    setCardHint('');
    setCardExplanation('');
    setShowAddModal(true);
  };

  const openEditModal = (card: Flashcard) => {
    setEditingCard(card);
    setCardFront(card.front);
    setCardBack(card.back);
    setCardHint(card.hint || '');
    setCardExplanation(card.explanation || '');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCard(null);
    setCardFront('');
    setCardBack('');
    setCardHint('');
    setCardExplanation('');
  };

  const handleStudy = () => {
    navigate(`/flashcards/study/${deckId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Không tìm thấy bộ thẻ</h2>
          <button
            onClick={() => navigate('/flashcards')}
            className="text-green-500 hover:text-green-600"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/flashcards')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg"
              style={{ backgroundColor: deck.color }}
            >
              {deck.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold dark:text-white">{deck.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{deck.description}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg"
            >
              <Plus size={20} />
              Thêm thẻ mới
            </button>
            {cards.length > 0 && (
              <button
                onClick={handleStudy}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg"
              >
                <Play size={20} />
                Học ngay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-dark-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-500">{deck.totalCards}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tổng số thẻ</div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-500">{deck.newCards}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Thẻ mới</div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-orange-500">{deck.dueCards}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Cần ôn tập</div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-purple-500">
            {deck.totalCards - deck.newCards - deck.dueCards}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Đã thành thạo</div>
        </div>
      </div>

      {/* Cards List */}
      {cards.length > 0 ? (
        <div className="space-y-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Mặt trước
                    </div>
                    <div className="text-lg dark:text-white">{card.front}</div>
                    {card.hint && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        💡 {card.hint}
                      </div>
                    )}
                  </div>

                  {/* Back */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Mặt sau
                    </div>
                    <div className="text-lg dark:text-white">{card.back}</div>
                    {card.explanation && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        📝 {card.explanation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(card)}
                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Card Stats */}
              <div className="mt-4 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Độ chính xác: <span className="font-semibold">{card.accuracy}%</span>
                </span>
                <span>
                  Đã ôn: <span className="font-semibold">{card.totalReviews} lần</span>
                </span>
                <span>
                  Trình độ: <span className="font-semibold capitalize">{card.maturityLevel}</span>
                </span>
                {card.nextReviewDate && (
                  <span>
                    Ôn tiếp: <span className="font-semibold">{new Date(card.nextReviewDate).toLocaleDateString('vi-VN')}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Chưa có thẻ nào</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thêm thẻ đầu tiên để bắt đầu học!
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus size={20} />
            Thêm thẻ đầu tiên
          </button>
        </div>
      )}

      {/* Add/Edit Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">
              {editingCard ? 'Sửa thẻ' : 'Thêm thẻ mới'}
            </h2>
            <form onSubmit={editingCard ? handleEditCard : handleAddCard}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Mặt trước (Câu hỏi) *
                </label>
                <textarea
                  value={cardFront}
                  onChange={(e) => setCardFront(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-dark-700 dark:text-white"
                  placeholder="VD: What is the capital of France?"
                  rows={3}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Mặt sau (Câu trả lời) *
                </label>
                <textarea
                  value={cardBack}
                  onChange={(e) => setCardBack(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-dark-700 dark:text-white"
                  placeholder="VD: Paris"
                  rows={3}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Gợi ý (tùy chọn)
                </label>
                <input
                  type="text"
                  value={cardHint}
                  onChange={(e) => setCardHint(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-dark-700 dark:text-white"
                  placeholder="VD: Thủ đô của Pháp"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Giải thích (tùy chọn)
                </label>
                <textarea
                  value={cardExplanation}
                  onChange={(e) => setCardExplanation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-dark-700 dark:text-white"
                  placeholder="Giải thích thêm về câu trả lời"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  {editingCard ? 'Cập nhật' : 'Thêm thẻ'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckDetailPage;
