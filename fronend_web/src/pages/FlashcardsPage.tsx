import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { flashcardService } from '../services/flashcardService';
import type { FlashcardDeck } from '../types/flashcard';
import DeckCard from '../components/flashcards/DeckCard';
import { Plus, BookOpen, Sparkles, X } from 'lucide-react';
import Layout from '../components/Layout';

const FlashcardsPage: React.FC = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [newDeckColor, setNewDeckColor] = useState('#3B82F6');
  const [newDeckIcon, setNewDeckIcon] = useState('📚');

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const data = await flashcardService.getDecks();
      setDecks(data);
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
      setNewDeckName('');
      setNewDeckDescription('');
      setNewDeckColor('#3B82F6');
      setNewDeckIcon('📚');
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
      alert('Không thể xóa bộ thẻ. Vui lòng thử lại.');
    }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  const icons = ['📚', '📐', '🗣️', '🐍', '💻', '🧪', '🎨', '🎵', '⚽', '🌍'];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 mb-8 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-6 h-6" />
                <span className="text-sm font-semibold opacity-90">Smart Learning</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3 flex items-center gap-3">
                <BookOpen className="w-10 h-10 md:w-12 md:h-12" />
                Flashcard Decks
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Master concepts with spaced repetition learning
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Deck</span>
            </button>
          </div>
        </motion.div>

        {/* Decks Grid */}
        {decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100"
          >
            <div className="text-6xl mb-6">🎴</div>
            <h2 className="text-2xl font-bold mb-3">No Decks Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first flashcard deck to start your learning journey!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create First Deck
            </button>
          </motion.div>
        )}

        {/* Create Deck Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Create New Deck</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-10 h-10 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDeck} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deck Name *
                  </label>
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    placeholder="e.g. Advanced Calculus"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                    placeholder="What's this deck about?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choose Icon
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewDeckIcon(icon)}
                        className={`text-2xl w-14 h-14 rounded-xl border-2 transition-all ${
                          newDeckIcon === icon
                            ? 'border-green-500 bg-green-50 scale-110'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choose Color
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewDeckColor(color)}
                        className={`w-12 h-12 rounded-xl transition-all ${
                          newDeckColor === color 
                            ? 'ring-4 ring-offset-2 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ 
                          backgroundColor: color,
                          ringColor: color
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Create Deck
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

export default FlashcardsPage;
