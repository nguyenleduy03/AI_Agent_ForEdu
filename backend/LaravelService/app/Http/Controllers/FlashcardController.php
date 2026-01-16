<?php

namespace App\Http\Controllers;

use App\Models\FlashcardDeck;
use App\Models\Flashcard;
use App\Models\FlashcardStats;
use App\Models\FlashcardReview;
use App\Services\SpacedRepetitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FlashcardController extends Controller
{
    protected $spacedRepetition;

    public function __construct(SpacedRepetitionService $spacedRepetition)
    {
        $this->spacedRepetition = $spacedRepetition;
    }

    /**
     * Get overview stats for dashboard
     */
    public function getOverviewStats(Request $request)
    {
        $userId = $request->user()->id;
        
        $totalDecks = FlashcardDeck::where('user_id', $userId)->count();
        $totalCards = Flashcard::whereHas('deck', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->count();
        
        // Count due cards (cards that need review)
        $dueCards = FlashcardStats::whereHas('flashcard.deck', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
        ->where('next_review_date', '<=', now())
        ->count();
        
        // Count new cards (never reviewed)
        $newCards = Flashcard::whereHas('deck', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
        ->whereDoesntHave('stats')
        ->count();
        
        return response()->json([
            'totalDecks' => $totalDecks,
            'totalCards' => $totalCards,
            'dueCards' => $dueCards,
            'newCards' => $newCards,
        ]);
    }

    /**
     * Get all decks for current user
     */
    public function getDecks(Request $request)
    {
        $decks = FlashcardDeck::where('user_id', $request->user()->id)
            ->withCount('flashcards')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($deck) {
                return $this->formatDeck($deck);
            });

        return response()->json($decks);
    }

    /**
     * Create new deck
     */
    public function createDeck(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'courseId' => 'nullable|exists:courses,id',
            'isPublic' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $deck = FlashcardDeck::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
            'color' => $request->color ?? '#3B82F6',
            'icon' => $request->icon ?? '📚',
            'is_public' => $request->isPublic ?? false,
        ]);

        return response()->json($this->formatDeck($deck), 201);
    }

    /**
     * Get deck with flashcards
     */
    public function getDeck($id)
    {
        $deck = FlashcardDeck::with('flashcards')->find($id);

        if (!$deck) {
            return $this->error('Deck not found', 404);
        }

        return response()->json($this->formatDeck($deck, true));
    }

    /**
     * Update deck
     */
    public function updateDeck(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'isPublic' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Check ownership
        $deck = FlashcardDeck::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$deck) {
            return $this->error('Deck not found or you do not have permission to edit it', 403);
        }

        $deck->update([
            'name' => $request->name ?? $deck->name,
            'description' => $request->description ?? $deck->description,
            'color' => $request->color ?? $deck->color,
            'icon' => $request->icon ?? $deck->icon,
            'is_public' => $request->isPublic ?? $deck->is_public,
        ]);

        return response()->json($this->formatDeck($deck));
    }

    /**
     * Delete deck
     */
    public function deleteDeck(Request $request, $id)
    {
        // Check ownership
        $deck = FlashcardDeck::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$deck) {
            return $this->error('Deck not found or you do not have permission to delete it', 403);
        }

        $deck->flashcards()->delete();
        $deck->delete();

        return response()->json(['message' => 'Deck deleted successfully']);
    }

    /**
     * Add flashcard to deck
     */
    public function addFlashcard(Request $request, $deckId)
    {
        $validator = Validator::make($request->all(), [
            'front' => 'required|string',
            'back' => 'required|string',
            'hint' => 'nullable|string',
            'tags' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Check deck ownership
        $deck = FlashcardDeck::where('id', $deckId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$deck) {
            return $this->error('Deck not found or you do not have permission to add cards', 403);
        }

        $flashcard = Flashcard::create([
            'deck_id' => $deckId,
            'user_id' => $request->user()->id,
            'front' => $request->front,
            'back' => $request->back,
            'hint' => $request->hint,
            'tags' => $request->tags,
        ]);

        return response()->json($this->formatFlashcard($flashcard), 201);
    }

    /**
     * Update flashcard
     */
    public function updateFlashcard(Request $request, $cardId)
    {
        $validator = Validator::make($request->all(), [
            'front' => 'sometimes|required|string',
            'back' => 'sometimes|required|string',
            'hint' => 'nullable|string',
            'tags' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        // Check flashcard ownership
        $flashcard = Flashcard::where('id', $cardId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$flashcard) {
            return $this->error('Flashcard not found or you do not have permission to edit it', 403);
        }

        $flashcard->update([
            'front' => $request->front ?? $flashcard->front,
            'back' => $request->back ?? $flashcard->back,
            'hint' => $request->hint ?? $flashcard->hint,
            'tags' => $request->tags ?? $flashcard->tags,
        ]);

        return response()->json($this->formatFlashcard($flashcard));
    }

    /**
     * Delete flashcard
     */
    public function deleteFlashcard(Request $request, $cardId)
    {
        // Check flashcard ownership
        $flashcard = Flashcard::where('id', $cardId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$flashcard) {
            return $this->error('Flashcard not found or you do not have permission to delete it', 403);
        }

        // Delete related stats and reviews
        FlashcardStats::where('flashcard_id', $cardId)->delete();
        FlashcardReview::where('flashcard_id', $cardId)->delete();
        
        $flashcard->delete();

        return response()->json(['message' => 'Flashcard deleted successfully']);
    }

    /**
     * Get cards due for review
     */
    public function getDueCards(Request $request, $deckId)
    {
        $user = $request->user();
        
        $deck = FlashcardDeck::with('flashcards')->find($deckId);

        if (!$deck) {
            return $this->error('Deck not found', 404);
        }

        $dueCards = [];
        
        foreach ($deck->flashcards as $card) {
            $stats = FlashcardStats::where('user_id', $user->id)
                ->where('flashcard_id', $card->id)
                ->first();

            if (!$stats || !$stats->next_review_date || $stats->next_review_date <= now()) {
                $dueCards[] = $this->formatFlashcard($card);
            }
        }

        return response()->json($dueCards);
    }

    /**
     * Review flashcard (Spaced Repetition)
     */
    public function reviewCard(Request $request, $cardId)
    {
        $validator = Validator::make($request->all(), [
            'quality' => 'required|integer|min:0|max:5',
            'responseTimeMs' => 'integer',
        ]);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $user = $request->user();
        $card = Flashcard::find($cardId);

        if (!$card) {
            return $this->error('Flashcard not found', 404);
        }

        // Record review
        FlashcardReview::create([
            'user_id' => $user->id,
            'flashcard_id' => $cardId,
            'quality' => $request->quality,
            'response_time_ms' => $request->responseTimeMs ?? 0,
            'review_date' => now(),
        ]);

        // Update spaced repetition stats
        $stats = $this->spacedRepetition->updateStats($user->id, $cardId, $request->quality);

        return response()->json([
            'flashcardId' => $cardId,
            'nextReviewDate' => $stats->next_review_date,
            'intervalDays' => $stats->interval_days,
            'easeFactor' => $stats->ease_factor,
            'repetitions' => $stats->repetitions,
        ]);
    }

    /**
     * Get deck statistics
     */
    public function getDeckStats(Request $request, $deckId)
    {
        $user = $request->user();
        $deck = FlashcardDeck::withCount('flashcards')->find($deckId);

        if (!$deck) {
            return $this->error('Deck not found', 404);
        }

        $stats = FlashcardStats::where('user_id', $user->id)
            ->where('deck_id', $deckId)
            ->get();

        $dueCount = $stats->filter(function ($s) {
            return !$s->next_review_date || $s->next_review_date <= now();
        })->count();

        $masteredCount = $stats->filter(function ($s) {
            return $s->interval_days >= 21;
        })->count();

        return response()->json([
            'deckId' => $deckId,
            'totalCards' => $deck->flashcards_count,
            'dueCards' => $dueCount,
            'masteredCards' => $masteredCount,
            'reviewedCards' => $stats->count(),
        ]);
    }

    private function formatDeck($deck, $withCards = false)
    {
        $data = [
            'id' => $deck->id,
            'userId' => $deck->user_id,
            'name' => $deck->name,
            'description' => $deck->description,
            'color' => $deck->color ?? '#3B82F6',
            'icon' => $deck->icon ?? '📚',
            'isPublic' => $deck->is_public,
            'cardCount' => $deck->flashcards_count ?? $deck->flashcards->count(),
            'createdAt' => $deck->created_at,
            'updatedAt' => $deck->updated_at,
        ];

        if ($withCards && $deck->flashcards) {
            $data['flashcards'] = $deck->flashcards->map(function ($card) {
                return $this->formatFlashcard($card);
            });
        }

        return $data;
    }

    private function formatFlashcard($card)
    {
        return [
            'id' => $card->id,
            'deckId' => $card->deck_id,
            'front' => $card->front,
            'back' => $card->back,
            'hint' => $card->hint,
            'tags' => $card->tags,
            'createdAt' => $card->created_at,
        ];
    }
}
