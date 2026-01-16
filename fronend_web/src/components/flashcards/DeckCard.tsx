import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FlashcardDeck } from '../../types/flashcard';
import { Play, Edit, Trash2 } from 'lucide-react';

interface Props {
  deck: FlashcardDeck;
  onUpdate: () => void;
  onDelete?: (id: number) => void;
}

const DeckCard: React.FC<Props> = ({ deck, onUpdate, onDelete }) => {
  const navigate = useNavigate();

  const handleStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/flashcards/study/${deck.id}`);
  };

  const handleManage = () => {
    navigate(`/flashcards/deck/${deck.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Xóa bộ thẻ "${deck.name}"?`)) {
      onDelete?.(deck.id);
    }
  };

  const hasCardsToStudy = deck.dueCards > 0 || deck.newCards > 0;

  return (
    <div
      className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-dark-700"
      onClick={handleManage}
    >
      {/* Header with icon and color */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="text-4xl w-16 h-16 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: `${deck.color}20` }}
        >
          {deck.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold truncate dark:text-white">{deck.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{deck.totalCards} thẻ</p>
        </div>
      </div>

      {/* Description */}
      {deck.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {deck.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-green-600 dark:text-blue-400">{deck.newCards}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Mới</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{deck.dueCards}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Cần ôn</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {Math.max(0, deck.totalCards - deck.newCards)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Đã học</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleStudy}
          disabled={!hasCardsToStudy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play size={16} />
          <span className="font-medium">Học ngay</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleManage();
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          title="Quản lý thẻ"
        >
          <Edit size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Xóa bộ thẻ"
          >
            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DeckCard;
