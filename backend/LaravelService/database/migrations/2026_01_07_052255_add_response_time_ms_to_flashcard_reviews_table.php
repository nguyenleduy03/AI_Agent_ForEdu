<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('flashcard_reviews', function (Blueprint $table) {
            if (!Schema::hasColumn('flashcard_reviews', 'response_time_ms')) {
                $table->integer('response_time_ms')->default(0)->after('quality');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flashcard_reviews', function (Blueprint $table) {
            if (Schema::hasColumn('flashcard_reviews', 'response_time_ms')) {
                $table->dropColumn('response_time_ms');
            }
        });
    }
};
