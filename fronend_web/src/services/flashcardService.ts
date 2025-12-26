import { springApi, fastApi } from './api';
import type { FlashcardDeck, Flashcard, ReviewRequest, DeckStats, CreateDeckRequest, CreateFlashcardRequest, AIGenerateResult } from '../types/flashcard';

const BASE_URL = '/api/flashcards';

export const flashcardService = {
  // Deck management
  getDecks: async (): Promise<FlashcardDeck[]> => {
    const response = await springApi.get(`${BASE_URL}/decks`);
    return response.data;
  },

  createDeck: async (data: CreateDeckRequest): Promise<FlashcardDeck> => {
    const response = await springApi.post(`${BASE_URL}/decks`, data);
    return response.data;
  },

  getDeck: async (deckId: number): Promise<FlashcardDeck> => {
    const response = await springApi.get(`${BASE_URL}/decks/${deckId}`);
    return response.data;
  },

  updateDeck: async (deckId: number, data: CreateDeckRequest): Promise<FlashcardDeck> => {
    const response = await springApi.put(`${BASE_URL}/decks/${deckId}`, data);
    return response.data;
  },

  deleteDeck: async (deckId: number): Promise<void> => {
    await springApi.delete(`${BASE_URL}/decks/${deckId}`);
  },

  // Flashcard management
  getCardsInDeck: async (deckId: number): Promise<Flashcard[]> => {
    const response = await springApi.get(`${BASE_URL}/decks/${deckId}/cards`);
    return response.data;
  },

  createCard: async (deckId: number, data: CreateFlashcardRequest): Promise<Flashcard> => {
    const response = await springApi.post(`${BASE_URL}/decks/${deckId}/cards`, data);
    return response.data;
  },

  updateCard: async (cardId: number, data: CreateFlashcardRequest): Promise<Flashcard> => {
    const response = await springApi.put(`${BASE_URL}/cards/${cardId}`, data);
    return response.data;
  },

  deleteCard: async (cardId: number): Promise<void> => {
    await springApi.delete(`${BASE_URL}/cards/${cardId}`);
  },

  // Study operations
  getDueCards: async (deckId?: number, limit: number = 50): Promise<Flashcard[]> => {
    const params = new URLSearchParams();
    if (deckId) params.append('deckId', deckId.toString());
    params.append('limit', limit.toString());
    const response = await springApi.get(`${BASE_URL}/study/due?${params}`);
    return response.data;
  },

  getNewCards: async (deckId?: number, limit: number = 20): Promise<Flashcard[]> => {
    const params = new URLSearchParams();
    if (deckId) params.append('deckId', deckId.toString());
    params.append('limit', limit.toString());
    const response = await springApi.get(`${BASE_URL}/study/new?${params}`);
    return response.data;
  },

  submitReview: async (data: ReviewRequest): Promise<Flashcard> => {
    const response = await springApi.post(`${BASE_URL}/study/review`, data);
    return response.data;
  },

  // Statistics
  getDeckStats: async (deckId: number): Promise<DeckStats> => {
    const response = await springApi.get(`${BASE_URL}/stats/deck/${deckId}`);
    return response.data;
  },

  getOverview: async (): Promise<any> => {
    const response = await springApi.get(`${BASE_URL}/stats/overview`);
    return response.data;
  },

  // ==================== AI GENERATION ====================
  
  generateCardsFromText: async (text: string, numCards: number = 5, aiProvider: string = 'groq'): Promise<AIGenerateResult> => {
    const response = await fastApi.post('/api/flashcards/generate', {
      text,
      num_cards: numCards,
      ai_provider: aiProvider
    });
    return response.data;
  },

  generateCardsFromLesson: async (lessonId: number, numCards: number = 10): Promise<AIGenerateResult> => {
    const response = await fastApi.post('/api/flashcards/generate-from-lesson', {
      lesson_id: lessonId,
      num_cards: numCards
    });
    return response.data;
  },
};
