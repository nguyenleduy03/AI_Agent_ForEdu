<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AuthService;
use App\Services\CredentialEncryptionService;
use App\Services\SpacedRepetitionService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuthService::class, function ($app) {
            return new AuthService();
        });

        $this->app->singleton(CredentialEncryptionService::class, function ($app) {
            return new CredentialEncryptionService();
        });

        $this->app->singleton(SpacedRepetitionService::class, function ($app) {
            return new SpacedRepetitionService();
        });
    }

    public function boot(): void
    {
        //
    }
}
