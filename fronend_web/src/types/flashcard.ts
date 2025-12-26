export interface FlashcardDeck {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isPublic: boolean;
  totalCards: number;
  newCards: number;
  dueCards: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: number;
  deckId: number;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  audioUrl?: string;
  tags?: string;
  sourceType: string;
  totalReviews: number;
  accuracy: number;
  maturityLevel: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  flashcardId: number;
  quality: number; // 0-5
  timeTakenSeconds: number;
}

export interface DeckStats {
  deckId: number;
  deckName: string;
  totalCards: number;
  newCards: number;
  learningCards: number;
  youngCards: number;
  matureCards: number;
  dueCards: number;
  overallAccuracy: number;
  totalReviews: number;
  reviewsToday: number;
  averageTimeSeconds: number;
  estimatedMinutesToday: number;
  studyPriority: string;
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface CreateFlashcardRequest {
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  audioUrl?: string;
  tags?: string;
}


// AI Generation types
export interface AIGeneratedCard {
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
}

export interface AIGenerateResult {
  cards: AIGeneratedCard[];
  source_text_length: number;
  processed_text_length?: number;
  model_used: string;
  text_truncated?: boolean;
  warning?: string;
}
