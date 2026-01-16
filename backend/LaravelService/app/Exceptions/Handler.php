<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Always return JSON for API requests
        if ($request->is('api/*') || $request->expectsJson()) {
            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'error' => 'Unauthenticated',
                    'message' => 'Token không hợp lệ hoặc đã hết hạn'
                ], 401);
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'error' => 'Validation failed',
                    'message' => $e->getMessage(),
                    'errors' => $e->errors()
                ], 422);
            }

            if ($e instanceof NotFoundHttpException) {
                return response()->json([
                    'error' => 'Not found',
                    'message' => 'Resource not found'
                ], 404);
            }

            return response()->json([
                'error' => 'Server error',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }

        return parent::render($request, $e);
    }
}
