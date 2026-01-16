<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Auth;
use App\Services\AuthService;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Register JWT guard
        Auth::extend('jwt', function ($app, $name, array $config) {
            return new \App\Guards\JwtGuard(
                Auth::createUserProvider($config['provider']),
                $app['request']
            );
        });
    }
}
