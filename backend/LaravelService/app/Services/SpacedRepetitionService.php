<?php

namespace App\Services;

use App\Models\FlashcardStats;
use Carbon\Carbon;

/**
 * SM-2 Spaced Repetition Algorithm Implementation
 */
class SpacedRepetitionService
{
    /**
     * Update flashcard stats based on review quality
     * 
     * @param int $userId
     * @param int $flashcardId
     * @param int $quality 0-5 (0=complete blackout, 5=perfect response)
     * @return FlashcardStats
     */
    public function updateStats(int $userId, int $flashcardId, int $quality): FlashcardStats
    {
        // Get flashcard to get deck_id
        $flashcard = \App\Models\Flashcard::find($flashcardId);
        if (!$flashcard) {
            throw new \Exception('Flashcard not found');
        }

        $stats = FlashcardStats::firstOrNew([
            'user_id' => $userId,
            'flashcard_id' => $flashcardId,
        ]);

        // Initialize if new
        if (!$stats->exists) {
            $stats->deck_id = $flashcard->deck_id;
            $stats->ease_factor = 2.5;
            $stats->interval_days = 0;
            $stats->repetitions = 0;
        }

        // SM-2 Algorithm
        if ($quality >= 3) {
            // Correct response
            if ($stats->repetitions == 0) {
                $stats->interval_days = 1;
            } elseif ($stats->repetitions == 1) {
                $stats->interval_days = 6;
            } else {
                $stats->interval_days = round($stats->interval_days * $stats->ease_factor);
            }
            $stats->repetitions++;
        } else {
            // Incorrect response - reset
            $stats->repetitions = 0;
            $stats->interval_days = 1;
        }

        // Update ease factor
        $stats->ease_factor = max(1.3, $stats->ease_factor + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02)));

        // Set next review date
        $stats->next_review_date = Carbon::now()->addDays($stats->interval_days);
        $stats->last_review_date = Carbon::now();

        $stats->save();

        return $stats;
    }

    /**
     * Get cards due for review
     */
    public function getDueCards(int $userId, int $deckId): array
    {
        return FlashcardStats::where('user_id', $userId)
            ->where('deck_id', $deckId)
            ->where(function ($query) {
                $query->whereNull('next_review_date')
                    ->orWhere('next_review_date', '<=', Carbon::now());
            })
            ->pluck('flashcard_id')
            ->toArray();
    }

    /**
     * Get study statistics for a deck
     */
    public function getDeckStatistics(int $userId, int $deckId): array
    {
        $stats = FlashcardStats::where('user_id', $userId)
            ->where('deck_id', $deckId)
            ->get();

        $total = $stats->count();
        $mastered = $stats->filter(fn($s) => $s->interval_days >= 21)->count();
        $learning = $stats->filter(fn($s) => $s->interval_days > 0 && $s->interval_days < 21)->count();
        $new = $stats->filter(fn($s) => $s->repetitions == 0)->count();

        return [
            'total' => $total,
            'mastered' => $mastered,
            'learning' => $learning,
            'new' => $new,
            'masteryPercent' => $total > 0 ? round(($mastered / $total) * 100) : 0,
        ];
    }
}
