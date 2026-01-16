import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Sparkles, BarChart3, Clock, Plus, 
  ChevronRight, Play, Settings, Search, X,
  Layers, Target, TrendingUp, Calendar
} from 'lucide-react';
import Layout from '../components/Layout';
import { flashcardService } from '../services/flashcardService';
import type { FlashcardDeck } from '../types/flashcard';
import DeckCard from '../components/flashcards/DeckCard';
import AIGeneratePanel from '../components/flashcards/AIGeneratePanel';

type TabType = 'decks' | 'ai-generate' | 'study-now' | 'stats';

const FlashcardUnifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('decks');
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create deck form
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [newDeckColor, setNewDeckColor] = useState('#3B82F6');
  const [newDeckIcon, setNewDeckIcon] = useState('📚');

  // Stats
  const [totalCards, setTotalCards] = useState(0);
  const [dueToday, setDueToday] = useState(0);
  const [newCards, setNewCards] = useState(0);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const data = await flashcardService.getDecks();
      setDecks(data);
      
      // Calculate stats
      const total = data.reduce((sum, d) => sum + d.totalCards, 0);
      const due = data.reduce((sum, d) => sum + d.dueCards, 0);
      const newC = data.reduce((sum, d) => sum + d.newCards, 0);
      setTotalCards(total);
      setDueToday(due);
      setNewCards(newC);
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    try {
      await flashcardService.createDeck({
        name: newDeckName,
        description: newDeckDescription,
        color: newDeckColor,
        icon: newDeckIcon,
        isPublic: false,
      });
      resetCreateForm();
      setShowCreateModal(false);
      loadDecks();
    } catch (error) {
      console.error('Failed to create deck:', error);
      alert('Không thể tạo bộ thẻ. Vui lòng thử lại.');
    }
  };

  const handleDeleteDeck = async (deckId: number) => {
    try {
      await flashcardService.deleteDeck(deckId);
      loadDecks();
    } catch (error) {
      console.error('Failed to delete deck:', error);
    }
  };

  const resetCreateForm = () => {
    setNewDeckName('');
    setNewDeckDescription('');
    setNewDeckColor('#3B82F6');
    setNewDeckIcon('📚');
  };

  const handleStudyAll = () => {
    // Find first deck with due cards
    const deckWithDue = decks.find(d => d.dueCards > 0 || d.newCards > 0);
    if (deckWithDue) {
      navigate(`/flashcards/study/${deckWithDue.id}`);
    }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];
  const icons = ['📚', '📐', '🗣️', '🐍', '💻', '🧪', '🎨', '🎵', '⚽', '🌍', '🧠', '💡'];

  const tabs = [
    { id: 'decks' as TabType, label: 'Bộ thẻ', icon: Layers },
    { id: 'ai-generate' as TabType, label: 'AI Tạo thẻ', icon: Sparkles },
    { id: 'study-now' as TabType, label: 'Học ngay', icon: Play },
    { id: 'stats' as TabType, label: 'Thống kê', icon: BarChart3 },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 mb-6 text-white"
        >
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-8 h-8" />
                <h1 className="text-2xl md:text-3xl font-bold">Flashcard Pro</h1>
              </div>
              <p className="text-white/80">Học thông minh với Spaced Repetition + AI</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl font-bold">{totalCards}</div>
                <div className="text-sm text-white/80">Tổng thẻ</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-300">{dueToday}</div>
                <div className="text-sm text-white/80">Cần ôn</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-300">{newCards}</div>
                <div className="text-sm text-white/80">Thẻ mới</div>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          {(dueToday > 0 || newCards > 0) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={handleStudyAll}
              className="mt-4 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold
                       hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Bắt đầu học ({dueToday + newCards} thẻ)
            </motion.button>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Decks Tab */}
          {activeTab === 'decks' && (
            <motion.div
              key="decks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Create Deck Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white">Bộ thẻ của bạn</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl
                           hover:bg-purple-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Tạo bộ thẻ
                </button>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : decks.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {decks.map((deck, index) => (
                    <motion.div
                      key={deck.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DeckCard deck={deck} onUpdate={loadDecks} onDelete={handleDeleteDeck} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">🎴</div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">Chưa có bộ thẻ nào</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Tạo bộ thẻ đầu tiên hoặc dùng AI để tạo tự động!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Tạo thủ công
                    </button>
                    <button
                      onClick={() => setActiveTab('ai-generate')}
                      className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700"
                    >
                      <Sparkles className="w-5 h-5 inline mr-2" />
                      Tạo với AI
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* AI Generate Tab */}
          {activeTab === 'ai-generate' && (
            <motion.div
              key="ai-generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <AIGeneratePanel decks={decks} onCardsCreated={loadDecks} />
            </motion.div>
          )}

          {/* Study Now Tab */}
          {activeTab === 'study-now' && (
            <motion.div
              key="study-now"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-600" />
                  Chọn bộ thẻ để học
                </h2>
                
                {decks.length > 0 ? (
                  <div className="space-y-3">
                    {decks.map(deck => {
                      const hasCards = deck.dueCards > 0 || deck.newCards > 0;
                      return (
                        <div
                          key={deck.id}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            hasCards 
                              ? 'border-purple-200 dark:border-purple-800 hover:border-purple-400 cursor-pointer' 
                              : 'border-gray-200 dark:border-gray-700 opacity-60'
                          }`}
                          onClick={() => hasCards && navigate(`/flashcards/study/${deck.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ backgroundColor: `${deck.color}20` }}
                            >
                              {deck.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold dark:text-white">{deck.name}</h3>
                              <p className="text-sm text-gray-500">
                                {deck.dueCards} cần ôn • {deck.newCards} mới
                              </p>
                            </div>
                          </div>
                          {hasCards && (
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                              <Play className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Chưa có bộ thẻ nào. Hãy tạo bộ thẻ trước!
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Tổng quan
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Tổng số bộ thẻ</span>
                    <span className="font-bold text-xl dark:text-white">{decks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Tổng số thẻ</span>
                    <span className="font-bold text-xl dark:text-white">{totalCards}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Cần ôn hôm nay</span>
                    <span className="font-bold text-xl text-orange-600">{dueToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Thẻ mới</span>
                    <span className="font-bold text-xl text-green-600">{newCards}</span>
                  </div>
                </div>
              </div>

              {/* Study Tip */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Mẹo học tập
                </h3>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">•</span>
                    Học mỗi ngày để duy trì streak
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">•</span>
                    Ưu tiên ôn thẻ cũ trước thẻ mới
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">•</span>
                    Giới hạn 20 thẻ mới/ngày
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-300">•</span>
                    Dùng AI để tạo thẻ nhanh hơn
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Deck Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white">Tạo bộ thẻ mới</h2>
                <button
                  onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Tên bộ thẻ *
                  </label>
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                             focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="VD: Từ vựng tiếng Anh"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Mô tả
                  </label>
                  <textarea
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                             focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Mô tả ngắn về bộ thẻ"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewDeckIcon(icon)}
                        className={`text-2xl w-12 h-12 rounded-xl border-2 transition-all ${
                          newDeckIcon === icon
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Màu sắc</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewDeckColor(color)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          newDeckColor === color ? 'ring-4 ring-offset-2 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                             hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl
                             hover:bg-purple-700 font-medium"
                  >
                    Tạo bộ thẻ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FlashcardUnifiedPage;
